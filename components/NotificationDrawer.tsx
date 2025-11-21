
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { XIcon, BellIcon } from './icons/ActionIcons';
import { UserPlusIcon } from './icons/NavIcons';
import { UserProfile, Notification, FriendRequest } from '../types';
import { getUserProfile, userApi, getNotifications, updateUserProfile, addNotificationToUser } from '../utils/api';
import { auth, db } from '../firebase/config';
import { formatDateTime } from '../constants';

interface NotificationDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'all' | 'requests'>('all');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [respondingIds, setRespondingIds] = useState<(string | number)[]>([]);


    // Load data when drawer opens
    useEffect(() => {
        if (!auth.currentUser) return;

        if (isOpen) {
            fetchNotifications();
        }

        // Real-time listener for friend requests in root collection
        const requestsRef = db.collection('receivedFriendRequests');
        const q = requestsRef.where('toUid', '==', auth.currentUser.uid).where('status', '==', 'pending');

        const unsubscribe = q.onSnapshot((snapshot) => {
            const requests: FriendRequest[] = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                // Field mapping compatibility
                requests.push({
                    id: doc.id,
                    senderUid: data.fromUid || data.senderUid,
                    senderName: data.from || data.senderName,
                    senderAvatarUrl: data.senderAvatarUrl || '',
                    status: data.status || 'pending',
                    timestamp: data.timestamp,
                    ...data
                } as FriendRequest);
            });
            console.log("收到的好友邀請（即時）:", requests);
            setFriendRequests(requests);
        }, (error) => {
            console.error("Failed to listen for friend requests:", error);
        });

        return () => unsubscribe();
    }, [isOpen, auth.currentUser]);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            let notifs = await getNotifications();
            
            const unreadIds = notifs.filter(n => !n.read).map(n => n.id);
            
            if (unreadIds.length > 0) {
                notifs = notifs.map(n => ({ ...n, read: true }));
                
                const profileData = localStorage.getItem('userProfile');
                if (profileData) {
                    const profile: UserProfile = JSON.parse(profileData);
                    profile.notifications = notifs; 
                    localStorage.setItem('userProfile', JSON.stringify(profile));
                    
                    if (auth.currentUser && !profile.isGuest && profile.id !== 0) {
                         updateUserProfile(String(profile.id), { notifications: notifs })
                            .catch(err => console.error("Failed to sync read status to DB:", err));
                    }
                }
            }
            setNotifications(notifs);
        } catch (error) {
            console.error("Error fetching notification data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRespond = async (request: FriendRequest, accept: boolean) => {
        if (respondingIds.includes(request.id)) return;

        setRespondingIds(prev => [...prev, request.id]);

        try {
            // Call the updated API function, passing the request doc ID and the sender's UID
            await userApi.respondFriendRequest(request.id, request.senderUid, accept);
            
            // onSnapshot will handle removing the request from the UI automatically
            
            if (accept) {
                const myProfileData = localStorage.getItem('userProfile');
                if (myProfileData) {
                    const myProfile: UserProfile = JSON.parse(myProfileData);
                    const myName = myProfile.displayName || myProfile.name || 'A new friend';
                    
                    await addNotificationToUser(
                        request.senderUid,
                        `${myName} accepted your friend request. You are now friends!`,
                        '好友通知'
                    );
                    await addNotificationToUser(
                        String(myProfile.id),
                        `You are now friends with ${request.senderName}.`,
                        '好友通知'
                    );
                }
            }
        } catch (error) {
            console.error("Responding to friend request failed:", error);
            alert("操作失敗，請稍後再試。");
        } finally {
            setRespondingIds(prev => prev.filter(id => id !== request.id));
        }
    };


    const handleViewProfile = (userId: string | number) => {
        onClose();
        navigate(`/friends/${userId}`);
    };

    return (
        <>
            {/* Overlay */}
            <div 
                className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div 
                className={`fixed top-0 right-0 h-full w-80 sm:w-96 bg-brand-secondary shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col border-l-2 border-brand-accent/20 ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                {/* Header */}
                <div className="p-4 border-b border-brand-accent/20 flex justify-between items-center bg-brand-primary/50 backdrop-blur-sm">
                    <h2 className="text-xl font-bold text-brand-accent flex items-center gap-2">
                        <BellIcon className="w-6 h-6" />
                        通知中心
                    </h2>
                    <button onClick={onClose} className="text-brand-muted hover:text-brand-light p-1 rounded-full hover:bg-brand-primary transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-brand-accent/20">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${
                            activeTab === 'all' 
                            ? 'text-brand-accent border-b-2 border-brand-accent bg-brand-accent/5' 
                            : 'text-brand-muted hover:text-brand-light'
                        }`}
                    >
                        最新通知
                    </button>
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`flex-1 py-3 text-sm font-bold transition-colors relative ${
                            activeTab === 'requests' 
                            ? 'text-brand-accent border-b-2 border-brand-accent bg-brand-accent/5' 
                            : 'text-brand-muted hover:text-brand-light'
                        }`}
                    >
                        交友邀請
                        {friendRequests.length > 0 && (
                            <span className="absolute top-2 right-6 w-2 h-2 bg-red-500 rounded-full"></span>
                        )}
                    </button>
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto p-4 space-y-4">
                    {loading ? (
                        <div className="text-center text-brand-muted py-10">讀取中...</div>
                    ) : (
                        <>
                            {/* Friend Requests Section */}
                            {(activeTab === 'requests' || (activeTab === 'all' && friendRequests.length > 0)) && (
                                <div className="space-y-3">
                                    {activeTab === 'all' && friendRequests.length > 0 && (
                                        <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-2">待確認邀請</h3>
                                    )}
                                    
                                    {friendRequests.map(req => {
                                        const isResponding = respondingIds.includes(req.id);
                                        return (
                                            <div key={req.id} className="bg-brand-primary p-3 rounded-lg border border-brand-accent/20 shadow-sm">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <img src={req.senderAvatarUrl} alt={req.senderName} className="w-10 h-10 rounded-full object-cover border border-brand-accent/30" />
                                                    <div className="flex-grow min-w-0">
                                                        <h4 className="font-bold text-brand-light truncate">{req.senderName}</h4>
                                                        <p className="text-xs text-brand-muted">想加你為好友</p>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleViewProfile(req.senderUid)}
                                                        className="text-xs font-semibold text-brand-accent hover:underline px-2"
                                                        disabled={isResponding}
                                                    >
                                                        詳細資料
                                                    </button>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => handleRespond(req, true)}
                                                        disabled={isResponding}
                                                        className="flex-1 bg-brand-accent text-brand-primary text-sm font-bold py-1.5 rounded hover:bg-opacity-90 transition-colors disabled:bg-brand-muted/50 disabled:cursor-wait"
                                                    >
                                                        {isResponding ? '處理中' : '確認'}
                                                    </button>
                                                    <button 
                                                        onClick={() => handleRespond(req, false)}
                                                        disabled={isResponding}
                                                        className="flex-1 bg-brand-secondary border border-brand-accent/30 text-brand-muted text-sm font-bold py-1.5 rounded hover:bg-brand-accent/10 transition-colors disabled:bg-brand-muted/50"
                                                    >
                                                        刪除
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    
                                    {activeTab === 'requests' && friendRequests.length === 0 && (
                                        <div className="text-center py-10 text-brand-muted">
                                            <UserPlusIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                            <p>目前沒有交友邀請</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Notifications Section */}
                            {activeTab === 'all' && (
                                <div className="space-y-3">
                                    {friendRequests.length > 0 && <div className="h-px bg-brand-accent/10 my-4" />}
                                    
                                    {notifications.length > 0 ? notifications.map((notif, idx) => (
                                        <div key={notif.id || idx} className="flex gap-3 p-3 rounded-lg hover:bg-brand-primary/50 transition-colors">
                                            <div className="mt-1">
                                                <div className={`w-2 h-2 rounded-full ${notif.read ? 'bg-brand-accent/20' : 'bg-red-500'}`}></div>
                                            </div>
                                            <div>
                                                <p className="text-sm text-brand-light leading-snug">{notif.message}</p>
                                                <p className="text-xs text-brand-muted mt-1">
                                                    {formatDateTime(notif.timestamp)}
                                                </p>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-10 text-brand-muted">
                                            <p>暫無新通知</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default NotificationDrawer;
