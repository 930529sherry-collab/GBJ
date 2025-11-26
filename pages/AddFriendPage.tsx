import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { SearchableUser, UserProfile, FriendRequest } from '../types';
import { BackIcon } from '../components/icons/ActionIcons';
import { searchUsers, userApi, getUserProfile, addNotificationToUser } from '../utils/api';
import { auth, db } from '../firebase/config';

const AddFriendPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [results, setResults] = useState<SearchableUser[]>([]);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [pendingSentRequests, setPendingSentRequests] = useState<(string|number)[]>([]);

    useEffect(() => {
        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
             if (user) {
                const myProfile = await getUserProfile(user.uid);
                setCurrentUser(myProfile);
             } else {
                const profileData = localStorage.getItem('userProfile');
                if (profileData) setCurrentUser(JSON.parse(profileData));
             }
        });

        let unsubscribeRequests = () => {};
        if (auth.currentUser) {
            setLoadingRequests(true);
            const requestsRef = collection(db, 'friendRequests');
            const q = query(requestsRef, where('recipientId', '==', auth.currentUser.uid), where('status', '==', 'pending'));

            unsubscribeRequests = onSnapshot(q, (snapshot) => {
                const requests: FriendRequest[] = snapshot.docs.map(doc => ({
                    id: doc.id, ...doc.data()
                } as FriendRequest));
                setPendingRequests(requests);
                setLoadingRequests(false);
            }, (err) => {
                console.error("Listener failed:", err);
                setLoadingRequests(false);
            });
        } else {
            setLoadingRequests(false);
        }
        
        return () => {
            unsubscribeAuth();
            unsubscribeRequests();
        };
    }, []);

    useEffect(() => {
        if (!searchTerm.trim() || !currentUser) {
            setResults([]);
            return;
        }

        const performSearch = async () => {
            setIsLoading(true);
            setError('');
            try {
                const users = await searchUsers(searchTerm);
                const resultsWithFriendStatus = users
                    .filter(user => String(user.id) !== String(currentUser.id))
                    .map(user => ({
                        ...user,
                        isFriend: (currentUser.friends || []).some(fid => String(fid) === String(user.id)),
                    }));
                setResults(resultsWithFriendStatus);
            } catch (err) {
                console.error("Search failed:", err);
                setError('搜尋失敗，請稍後再試。');
            } finally {
                setIsLoading(false);
            }
        };
        
        const debounceTimeout = setTimeout(performSearch, 300);
        return () => clearTimeout(debounceTimeout);

    }, [searchTerm, currentUser]);

    const handleAddFriend = async (friendId: number | string) => {
        if (!currentUser || pendingSentRequests.includes(friendId)) return;

        try {
            await userApi.sendFriendRequest(String(friendId));
            setPendingSentRequests(prev => [...prev, friendId]);

            const friend = results.find(r => r.id === friendId);
            const friendName = friend?.name || '用戶';
            setSuccessMessage(`已發送好友邀請給 ${friendName}！`);
            
            addNotificationToUser(String(currentUser.id), `已發送好友邀請給 ${friendName}！`, '好友通知');
            setTimeout(() => setSuccessMessage(''), 3000);

        } catch (error: any) {
            const errorMessage = (error.message || String(error)).toLowerCase();
            if (errorMessage.includes('request already sent') || errorMessage.includes('already pending')) {
                setError('邀請已在等待對方確認中。');
            } else {
                setError('發送邀請失敗，請稍後再試。');
            }
            setTimeout(() => setError(''), 3000);
        }
    };
    
    const handleRespond = async (request: FriendRequest, accept: boolean) => {
        try {
            await userApi.respondFriendRequest(request.senderUid, accept, request.id);
        } catch (error) {
            console.error("Failed to respond to friend request:", error);
            alert("操作失敗，請稍後再試。");
        }
    };

    return (
        <div className="animate-fade-in space-y-6">
            <div className="relative">
                 <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-brand-muted hover:text-brand-light transition-colors font-semibold">
                    <BackIcon />
                    <span>返回</span>
                </button>
            </div>
            
            <h2 className="text-2xl font-bold text-brand-light px-2">新增好友</h2>

            <div className="relative">
                <input
                    type="text"
                    placeholder="搜尋用戶 App ID 或暱稱..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-brand-secondary border-2 border-brand-accent/50 rounded-lg p-3 pl-10 text-brand-light focus:ring-brand-accent focus:border-brand-accent transition-colors"
                    aria-label="Search users"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                     <svg className="w-5 h-5 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {successMessage && <p className="text-green-500 text-center">{successMessage}</p>}
            {error && <p className="text-red-500 text-center">{error}</p>}

            {/* Friend Requests */}
            {!loadingRequests && pendingRequests.length > 0 && (
                <div className="space-y-3">
                    <h3 className="text-sm font-bold text-brand-accent px-1">好友邀請</h3>
                    {pendingRequests.map(req => (
                        <div key={req.id} className="bg-brand-primary p-3 rounded-xl border-2 border-brand-accent/30 flex items-center gap-4 shadow-sm">
                            <img src={req.senderAvatarUrl} alt={req.senderName} className="w-12 h-12 rounded-full object-cover border border-brand-accent/20" />
                            <div className="flex-grow min-w-0">
                                <h3 className="font-bold text-brand-light truncate">{req.senderName}</h3>
                                <p className="text-xs text-brand-muted truncate">想加你為好友</p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                                <button onClick={() => handleRespond(req, true)} className="bg-brand-accent text-brand-primary text-xs font-bold px-3 py-2 rounded-lg hover:bg-opacity-90">確認</button>
                                <button onClick={() => handleRespond(req, false)} className="bg-brand-secondary border border-brand-accent/20 text-brand-muted text-xs font-bold px-3 py-2 rounded-lg hover:bg-brand-accent/10">拒絕</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Search Results */}
            <div className="space-y-3">
                {isLoading && <p className="text-center text-brand-muted">搜尋中...</p>}
                {!isLoading && results.length > 0 && <h3 className="text-sm font-bold text-brand-muted px-1">搜尋結果</h3>}
                {results.map(user => (
                    <div key={user.id} className="bg-brand-secondary p-3 rounded-lg flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                            <div>
                                <h3 className="font-bold text-brand-light">{user.name}</h3>
                                <p className="text-sm text-brand-muted">等級 {user.level}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => handleAddFriend(user.id)}
                            disabled={user.isFriend || pendingSentRequests.includes(user.id)}
                            className="bg-brand-accent text-brand-primary font-bold px-4 py-2 rounded-lg hover:bg-opacity-80 transition-colors disabled:bg-brand-muted disabled:cursor-not-allowed"
                        >
                            {user.isFriend ? '已是好友' : (pendingSentRequests.includes(user.id) ? '已邀請' : '加好友')}
                        </button>
                    </div>
                ))}
                {!isLoading && searchTerm && results.length === 0 && (
                     <p className="text-center text-brand-muted pt-4">找不到用戶。</p>
                )}
            </div>
        </div>
    );
};

export default AddFriendPage;