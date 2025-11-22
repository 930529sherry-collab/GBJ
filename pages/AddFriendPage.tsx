
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    const [pendingSentRequests, setPendingSentRequests] = useState<(string|number)[]>([]); // Track sent requests

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

        // Real-time listener for friend requests
        let unsubscribeRequests = () => {};
        if (auth.currentUser) {
            setLoadingRequests(true);
            // 指定到 receivedFriendRequests 根集合
            const requestsRef = db.collection('receivedFriendRequests');
            const q = requestsRef.where('toUid', '==', auth.currentUser.uid).where('status', '==', 'pending');

            unsubscribeRequests = q.onSnapshot((snapshot) => {
                const requests: FriendRequest[] = [];
                snapshot.forEach(doc => {
                    const data = doc.data();
                    // 3. ★重要：資料庫欄位對應修正★
                    // 自動相容 from/fromUid (後端) 與 senderName/senderUid (前端)
                    requests.push({
                        id: doc.id,
                        senderUid: data.fromUid || data.senderUid, 
                        senderName: data.from || data.senderName,   
                        senderAvatarUrl: data.senderAvatarUrl || '',
                        status: data.status || 'pending',
                        timestamp: data.timestamp,
                        ...data // 確保其他欄位也存在
                    } as FriendRequest);
                });
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
            await userApi.sendFriendRequest(friendId);
            setPendingSentRequests(prev => [...prev, friendId]); // Add to pending list

            const friend = results.find(r => r.id === friendId);
            const friendName = friend?.name || '用戶';
            setSuccessMessage(`已發送好友邀請給 ${friendName}！`);
            
            // Instant Notification
            addNotificationToUser(String(currentUser.id), `好友邀請已發送給 ${friendName}。`, "好友通知");

            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err: any) {
            const errorMessage = (err.message || String(err)).toLowerCase();
            
            if (errorMessage.includes('request already sent') || errorMessage.includes('already pending')) {
                 setError('已發送過好友邀請，請耐心等待對方確認。');
                 setPendingSentRequests(prev => [...prev, friendId]); // Also mark as pending
            } else if (errorMessage.includes('already friends')) {
                 setError('你們已經是好友了。');
            } else {
                 console.error("Failed to add friend", err);
                 setError('發送邀請失敗，請稍後再試。');
            }
            setTimeout(() => setError(''), 3000);
        }
    };
    
    const handleRespond = async (request: FriendRequest, accept: boolean) => {
        try {
            // Optimistic UI update: Remove locally first
            setPendingRequests(prev => prev.filter(r => r.id !== request.id));

            await userApi.respondFriendRequest(request.id, request.senderUid, accept);
            
            if (accept) {
                setSuccessMessage("已接受好友邀請！");
                
                // Update local profile
                if (currentUser) {
                    const updatedFriends = [...(currentUser.friends || []), request.senderUid];
                    const updatedUser = { ...currentUser, friends: updatedFriends };
                    setCurrentUser(updatedUser);
                    localStorage.setItem('userProfile', JSON.stringify(updatedUser));
                }

                // 延遲刷新，等待 Firestore 同步 (解決延遲問題)
                await new Promise(r => setTimeout(r, 800)); 
                
                // Reload fresh profile from DB
                if (currentUser) {
                    const freshProfile = await getUserProfile(currentUser.id);
                    setCurrentUser(freshProfile);
                }

                setTimeout(() => setSuccessMessage(''), 3000);
            }
        } catch (error) {
            console.error("Failed to respond:", error);
            setError("操作失敗，請稍後再試。");
            setTimeout(() => setError(''), 3000);
        }
    };

    const handleNavigateToProfile = (id: string | number) => {
        navigate(`/friends/${id}`);
    };


    return (
        <div className="animate-fade-in space-y-6">
            <div className="relative">
                 <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-brand-muted hover:text-brand-light transition-colors font-semibold">
                    <BackIcon />
                    <span>返回</span>
                </button>
            </div>
            
            {/* Pending Requests Section - Placed at top */}
            {!loadingRequests && pendingRequests.length > 0 && (
                <div className="bg-brand-secondary p-4 rounded-xl border-2 border-brand-accent/20 shadow-md mb-2">
                    <h3 className="text-lg font-bold text-brand-accent mb-3 px-1 flex items-center gap-2">
                        好友邀請 
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{pendingRequests.length}</span>
                    </h3>
                    <div className="space-y-3">
                        {pendingRequests.map(req => (
                            <div
                                key={req.id}
                                className="bg-brand-primary p-3 rounded-lg border border-brand-accent/10 flex items-center gap-4"
                            >
                                <img 
                                    src={req.senderAvatarUrl} 
                                    alt={req.senderName} 
                                    className="w-12 h-12 rounded-full object-cover border border-brand-accent/20 cursor-pointer"
                                    onClick={() => handleNavigateToProfile(req.senderUid)} 
                                />
                                <div className="flex-grow min-w-0 cursor-pointer" onClick={() => handleNavigateToProfile(req.senderUid)}>
                                    <h3 className="font-bold text-brand-light truncate">{req.senderName}</h3>
                                    <p className="text-xs text-brand-muted truncate">想加你為好友</p>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                    <button 
                                        onClick={() => handleRespond(req, true)}
                                        className="bg-brand-accent text-brand-primary text-xs font-bold px-3 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
                                    >
                                        確認
                                    </button>
                                    <button 
                                        onClick={() => handleRespond(req, false)}
                                        className="bg-brand-secondary border border-brand-accent/20 text-brand-muted text-xs font-bold px-3 py-2 rounded-lg hover:bg-brand-accent/10 transition-colors"
                                    >
                                        拒絕
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Search Input */}
            <div className="relative">
                <input
                    type="text"
                    placeholder="輸入好友 ID (例如 GUNBOOJO-1A2B...)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-brand-secondary border-2 border-brand-accent/50 rounded-lg p-3 pl-10 text-brand-light focus:ring-brand-accent focus:border-brand-accent transition-colors"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                     <svg className="w-5 h-5 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>
            
            {(successMessage || error) && (
                 <div className={`${successMessage ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'} text-sm font-semibold p-3 rounded-lg text-center animate-fade-in`}>
                    {successMessage || error}
                </div>
            )}


            {/* Search Results */}
            <div className="space-y-3">
                {isLoading ? (
                     <div className="text-center p-10 text-brand-muted">搜尋中...</div>
                ) : searchTerm.trim() && results.length > 0 ? results.map(user => {
                    const isPending = pendingSentRequests.includes(user.id);
                    return (
                        <div key={user.id} className="bg-brand-secondary p-3 rounded-lg flex items-center justify-between gap-4 border-2 border-brand-accent/20">
                            <div className="flex items-center gap-4">
                                <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                                <div>
                                    <h3 className="font-bold text-brand-light">{user.name || '未知用戶'}</h3>
                                    <p className="text-sm text-brand-muted">等級 {user.level}</p>
                                </div>
                            </div>
                            {user.isFriend ? (
                                <span className="text-sm font-semibold px-4 py-2 rounded-lg bg-brand-primary text-brand-muted">
                                    好友
                                </span>
                            ) : isPending ? (
                                <span className="text-sm font-semibold px-4 py-2 rounded-lg bg-brand-primary text-brand-muted">
                                    已邀請
                                </span>
                            ) : (
                                <button 
                                    onClick={() => handleAddFriend(user.id)}
                                    className="text-sm font-bold px-4 py-2 rounded-lg bg-brand-accent text-brand-primary transition-transform hover:scale-105"
                                >
                                    新增
                                </button>
                            )}
                        </div>
                    );
                }) : (
                     <div className="text-center p-10 text-brand-muted bg-brand-secondary rounded-lg border-2 border-brand-accent/10">
                        {searchTerm.trim() && !isLoading
                            ? <p>找不到符合「{searchTerm}」的用戶。</p>
                            : <p>請輸入好友的 ID 來搜尋。</p>
                        }
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddFriendPage;
