
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { XIcon, BellIcon, ChevronDownIcon } from './icons/ActionIcons';
import { UserPlusIcon } from './icons/NavIcons';
import { UserProfile, Notification, FriendRequest } from '../types';
import { getUserProfile, userApi, getNotifications, updateUserProfile, addNotificationToUser, updateAllMissionProgress, syncUserStats } from '../utils/api';
import { auth, db } from '../firebase/config';
import { formatDateTime, toDateObj } from '../constants';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface NotificationDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

interface GroupedNotifications {
    type: string;
    notifications: Notification[];
    latestTimestamp: any;
    hasUnread: boolean;
}

const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'all' | 'requests'>('all');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [respondingIds, setRespondingIds] = useState<(string | number)[]>([]);
    const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
    const [hasInteracted, setHasInteracted] = useState(false);

    useEffect(() => {
        if (!auth.currentUser || !isOpen) return;
        
        const uid = auth.currentUser.uid;
        fetchNotifications();

        const requestsRef = collection(db, 'friendRequests');
        const q = query(requestsRef, where('recipientId', '==', uid), where('status', '==', 'pending'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const requests: FriendRequest[] = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    senderUid: data.fromUid,      // 修正: 使用後端欄位 fromUid
                    senderName: data.from,        // 修正: 使用後端欄位 from
                    senderAvatarUrl: data.senderAvatarUrl,
                    recipientId: auth.currentUser?.uid || '', // Just to satisfy type
                    status: 'pending',
                    timestamp: data.timestamp,
                } as FriendRequest;
            });
            setFriendRequests(requests);
        });
        return () => unsubscribe();
    }, [isOpen]);
    
    const groupedNotifications = useMemo(() => {
        const groups: { [key: string]: Notification[] } = {};
        notifications.forEach(notif => {
            const type = notif.type || '系統通知';
            if (!groups[type]) groups[type] = [];
            groups[type].push(notif);
        });
        const groupedArray: GroupedNotifications[] = Object.keys(groups).map(type => ({
            type, notifications: groups[type],
            latestTimestamp: groups[type][0].timestamp,
            hasUnread: groups[type].some(n => !n.read)
        }));
        groupedArray.sort((a, b) => (toDateObj(b.latestTimestamp)?.getTime() || 0) - (toDateObj(a.latestTimestamp)?.getTime() || 0));
        return groupedArray;
    }, [notifications]);

    useEffect(() => {
        if (groupedNotifications.length > 0 && !hasInteracted) {
            // No auto-expansion
        }
    }, [groupedNotifications, hasInteracted]);
    
    const toggleGroup = (type: string) => {
        setHasInteracted(true);
        setExpandedGroups(prev => 
            prev.includes(type) ? prev.filter(g => g !== type) : [...prev, type]
        );
    };

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const notifs = await getNotifications();
            setNotifications(notifs);
        } catch (error) { console.error("Error fetching notification data:", error); }
        finally { setLoading(false); }
    };

    const handleNotificationClick = async (notif: Notification) => {
        if (notif.read) return;

        const updatedNotifications = notifications.map(n => 
            n.id === notif.id ? { ...n, read: true } : n
        );
        setNotifications(updatedNotifications);

        const profileData = localStorage.getItem('userProfile');
        if (profileData) {
            const profile: UserProfile = JSON.parse(profileData);
            profile.notifications = updatedNotifications;
            localStorage.setItem('userProfile', JSON.stringify(profile));
            
            if (auth.currentUser && !profile.isGuest) {
                try {
                    await updateUserProfile(String(profile.id), { notifications: updatedNotifications });
                } catch (e) {
                    console.error("Failed to sync notification read status", e);
                }
            }
        }
    };


    const handleRespond = async (request: FriendRequest, accept: boolean) => {
        if (respondingIds.includes(request.id)) return;
        setRespondingIds(prev => [...prev, request.id]);
        try {
            await userApi.respondFriendRequest(request.senderUid, accept, request.id);
            if (accept) {
                const currentUser = auth.currentUser;
                if(currentUser) {
                    await syncUserStats(currentUser.uid);
                    await updateAllMissionProgress(currentUser.uid);
                }
            }
        } catch (error) {
            console.error("Responding to friend request failed:", error);
            alert("操作失敗，請稍後再試。");
        } finally {
            setRespondingIds(prev => prev.filter(id => id !== request.id));
        }
    };
    const handleViewProfile = (userId: string | number) => { onClose(); navigate(`/friends/${userId}`); };

    return (
        <>
            <div className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose} />
            <div className={`fixed top-0 right-0 h-full w-80 sm:w-96 bg-brand-secondary shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col border-l-2 border-brand-accent/20 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="p-4 border-b border-brand-accent/20 flex justify-between items-center bg-brand-primary/50 backdrop-blur-sm">
                    <h2 className="text-xl font-bold text-brand-accent flex items-center gap-2"><BellIcon className="w-6 h-6" />通知中心</h2>
                    <button onClick={onClose} className="text-brand-muted hover:text-brand-light p-1 rounded-full hover:bg-brand-primary transition-colors"><XIcon className="w-6 h-6" /></button>
                </div>
                <div className="flex border-b border-brand-accent/20">
                    <button onClick={() => setActiveTab('all')} className={`flex-1 py-3 text-sm font-bold transition-colors ${activeTab === 'all' ? 'text-brand-accent border-b-2 border-brand-accent bg-brand-accent/5' : 'text-brand-muted hover:text-brand-light'}`}>最新通知</button>
                    <button onClick={() => setActiveTab('requests')} className={`flex-1 py-3 text-sm font-bold transition-colors relative ${activeTab === 'requests' ? 'text-brand-accent border-b-2 border-brand-accent bg-brand-accent/5' : 'text-brand-muted hover:text-brand-light'}`}>
                        交友邀請
                        {friendRequests.length > 0 && <span className="absolute top-2 right-6 w-2 h-2 bg-red-500 rounded-full"></span>}
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto p-2 space-y-2">
                    {loading ? <div className="text-center text-brand-muted py-10">讀取中...</div> : (
                        <>
                            {activeTab === 'requests' && (friendRequests.length > 0 ? friendRequests.map(req => (
                                <div key={req.id} className="bg-brand-primary p-3 rounded-lg border border-brand-accent/10">
                                    <div className="flex items-center gap-3">
                                        <img src={req.senderAvatarUrl} alt={req.senderName} className="w-10 h-10 rounded-full object-cover"/>
                                        <div className="flex-grow min-w-0">
                                            <p className="text-sm text-brand-light"><span className="font-bold">{req.senderName}</span> 想加你為好友</p>
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 mt-2">
                                         <button onClick={() => handleViewProfile(req.senderUid)} className="text-xs font-semibold px-3 py-1.5 rounded-md bg-brand-secondary border border-brand-accent/20 text-brand-muted hover:bg-brand-accent/10">詳細資料</button>
                                         <button onClick={() => handleRespond(req, false)} disabled={respondingIds.includes(req.id)} className="text-xs font-semibold px-3 py-1.5 rounded-md bg-brand-secondary border border-brand-accent/20 text-brand-muted hover:bg-brand-accent/10 disabled:opacity-50">拒絕</button>
                                         <button onClick={() => handleRespond(req, true)} disabled={respondingIds.includes(req.id)} className="text-xs font-bold px-3 py-1.5 rounded-md bg-brand-accent text-brand-primary hover:bg-opacity-90 disabled:opacity-50">確認</button>
                                    </div>
                                </div>
                            )) : <div className="text-center py-10 text-brand-muted"><UserPlusIcon className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>目前沒有交友邀請</p></div>)}
                            {activeTab === 'all' && (
                                groupedNotifications.length > 0 ? groupedNotifications.map((group) => {
                                    const isExpanded = expandedGroups.includes(group.type);
                                    return (
                                        <div key={group.type} className="bg-brand-primary rounded-lg border border-brand-accent/10">
                                            <button onClick={() => toggleGroup(group.type)} className="w-full flex justify-between items-center p-3">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold text-brand-light">{group.type}</h3>
                                                    <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-brand-secondary text-brand-muted border border-brand-accent/10">{group.notifications.length}</span>
                                                    {group.hasUnread && <div className="w-2 h-2 bg-red-500 rounded-full" />}
                                                </div>
                                                <ChevronDownIcon className={`w-5 h-5 text-brand-muted transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                            </button>
                                            {isExpanded && (
                                                <div className="px-3 pb-1 space-y-1 animate-fade-in">
                                                    {group.notifications.map((notif, index) => (
                                                        <div 
                                                            key={notif.id || index} 
                                                            onClick={() => handleNotificationClick(notif)}
                                                            className={`flex gap-3 py-2 cursor-pointer transition-colors hover:bg-brand-accent/5 rounded-lg px-2 -mx-2 ${index < group.notifications.length - 1 ? 'border-b border-brand-accent/10' : ''}`}
                                                        >
                                                            <div className="mt-1">
                                                                <div className={`w-2 h-2 rounded-full ${notif.read ? 'bg-brand-accent/20' : 'bg-red-500'}`}></div>
                                                            </div>
                                                            <div>
                                                                <p className={`text-sm leading-snug ${notif.read ? 'text-brand-light' : 'text-brand-light font-medium'}`}>{notif.message}</p>
                                                                <p className="text-xs text-brand-muted mt-1">{formatDateTime(notif.timestamp)}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }) : <div className="text-center py-10 text-brand-muted"><p>暫無新通知</p></div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );
};

export default NotificationDrawer;
