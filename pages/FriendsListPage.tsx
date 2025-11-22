import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserProfile, FriendRequest } from '../types';
import { BackIcon } from '../components/icons/ActionIcons';
import { getFriends, userApi } from '../utils/api';
import { auth, db } from '../firebase/config';

const FriendsListPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [friends, setFriends] = useState<UserProfile[]>([]);
    const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        let unsubscribeRequests = () => {};

        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            // Clean up previous listener
            unsubscribeRequests();

            if (user) {
                try {
                    // Fetch friends list
                    const friendProfiles = await getFriends(user.uid);
                    setFriends(friendProfiles);

                    // Set up listener for friend requests in receivedFriendRequests subcollection
                    const requestsRef = db.collection('users').doc(user.uid).collection('receivedFriendRequests');
                    const q = requestsRef.where('status', '==', 'pending');
                    
                    unsubscribeRequests = q.onSnapshot((snapshot) => {
                        const requests: FriendRequest[] = snapshot.docs.map(doc => {
                            const data = doc.data();
                            // 資料庫欄位對應修正
                            return {
                                id: doc.id,
                                senderUid: data.fromUid || data.senderUid,
                                senderName: data.from || data.senderName,
                                senderAvatarUrl: data.senderAvatarUrl || '',
                                status: data.status || 'pending',
                                timestamp: data.timestamp,
                                ...data,
                            } as FriendRequest;
                        });
                        setPendingRequests(requests);
                        setLoading(false); // Only stop loading after requests are loaded
                    }, (error) => {
                        console.error("Friend request listener error:", error);
                        setLoading(false);
                    });

                } catch (error) {
                    console.error("Failed to fetch friends data:", error);
                    setFriends([]);
                    setPendingRequests([]);
                    setLoading(false);
                }
            } else {
                console.log("User is not logged in.");
                setFriends([]);
                setPendingRequests([]);
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            unsubscribeRequests();
        };
    }, []);

    const handleRespond = async (e: React.MouseEvent, request: FriendRequest, accept: boolean) => {
        e.stopPropagation();
        
        try {
            // Optimistic UI update
            setPendingRequests(prev => prev.filter(r => r.id !== request.id));

            await userApi.respondFriendRequest(request.senderUid, accept);

            if (accept && auth.currentUser) {
                // 等待 Firestore 同步
                await new Promise(r => setTimeout(r, 800));

                // Re-fetch friends list to show the new friend
                const friendProfiles = await getFriends(auth.currentUser.uid);
                setFriends(friendProfiles);
            }
        } catch (error) {
            console.error("Failed to respond:", error);
            alert("操作失敗，請稍後再試。");
        }
    };

    const filteredFriends = friends.filter(friend =>
        (friend.name || '').toLowerCase().includes((searchTerm || '').toLowerCase())
    );

    const handleFriendClick = (id: number | string) => {
        navigate(`/friends/${id}`);
    };

    if (loading) {
        return <div className="text-center p-10 text-brand-accent">正在讀取好友列表...</div>;
    }

    return (
        <div className="animate-fade-in space-y-6">
            <div className="relative">
                 <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-brand-muted hover:text-brand-light transition-colors font-semibold">
                    <BackIcon />
                    <span>返回</span>
                </button>
            </div>
            
            {/* Search Input */}
            <div className="relative">
                <input
                    type="text"
                    placeholder="搜尋好友名稱..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-brand-secondary border-2 border-brand-accent/50 rounded-lg p-3 pl-10 text-brand-light focus:ring-brand-accent focus:border-brand-accent transition-colors"
                    aria-label="Search friends"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                     <svg className="w-5 h-5 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Pending Requests Section */}
            {pendingRequests.length > 0 && (
                <div className="space-y-3 mb-6">
                    <h3 className="text-sm font-bold text-brand-accent px-1 flex items-center gap-2">
                        好友邀請 
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
                    </h3>
                    {pendingRequests.map(req => (
                        <div
                            key={req.id}
                            onClick={() => handleFriendClick(req.senderUid)}
                            className="bg-brand-primary p-3 rounded-xl border-2 border-brand-accent/30 flex items-center gap-4 shadow-sm cursor-pointer"
                        >
                            <img src={req.senderAvatarUrl} alt={req.senderName} className="w-12 h-12 rounded-full object-cover border border-brand-accent/20" />
                            <div className="flex-grow min-w-0">
                                <h3 className="font-bold text-brand-light truncate">{req.senderName}</h3>
                                <p className="text-xs text-brand-muted truncate">想加你為好友</p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                                <button 
                                    onClick={(e) => handleRespond(e, req, true)}
                                    className="bg-brand-accent text-brand-primary text-xs font-bold px-3 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
                                >
                                    確認
                                </button>
                                <button 
                                    onClick={(e) => handleRespond(e, req, false)}
                                    className="bg-brand-secondary border border-brand-accent/20 text-brand-muted text-xs font-bold px-3 py-2 rounded-lg hover:bg-brand-accent/10 transition-colors"
                                >
                                    拒絕
                                </button>
                            </div>
                        </div>
                    ))}
                    <div className="h-px bg-brand-accent/10 my-4"></div>
                </div>
            )}

            {/* Friends List */}
            <div className="space-y-3">
                {pendingRequests.length === 0 && filteredFriends.length > 0 && (
                     <h3 className="text-sm font-bold text-brand-muted px-1">我的好友 ({filteredFriends.length})</h3>
                )}
                
                {filteredFriends.length > 0 ? filteredFriends.map(friend => (
                    <div
                        key={friend.id}
                        onClick={() => handleFriendClick(friend.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleFriendClick(friend.id)}
                        className="bg-brand-secondary p-3 rounded-lg flex items-center justify-between gap-4 cursor-pointer border-2 transition-all duration-300 border-brand-accent/20 hover:border-brand-accent/50 hover:shadow-lg hover:shadow-brand-accent/10"
                    >
                        <div className="flex items-center gap-4">
                            <img src={friend.avatarUrl} alt={friend.name} className="w-12 h-12 rounded-full object-cover" />
                            <div>
                                <h3 className="font-bold text-brand-light">{friend.name}</h3>
                                <p className="text-sm text-brand-muted">等級 {friend.level}</p>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="text-center p-10 text-brand-muted bg-brand-secondary rounded-lg border-2 border-brand-accent/10">
                        <p>{searchTerm ? `找不到名為 "${searchTerm}" 的好友。` : '你還沒有任何好友。'}</p>
                        <button onClick={() => navigate('/add-friend')} className="mt-4 font-semibold text-brand-accent hover:underline">
                            去新增好友
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FriendsListPage;