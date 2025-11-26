

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Notification, UserProfile } from '../types';
import { BackIcon, BellIcon, ChevronDownIcon } from '../components/icons/ActionIcons';
// @-fix: Imported getNotifications from the API module to resolve an undefined function error.
import { getNotifications, updateUserProfile } from '../utils/api';
import { formatDateTime, toDateObj } from '../constants';

interface GroupedNotifications {
    type: string;
    notifications: Notification[];
    latestTimestamp: any;
    hasUnread: boolean;
}

const NotificationsPage: React.FC = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

    useEffect(() => {
        const fetchNotifications = async () => {
            const profileData = localStorage.getItem('userProfile');
            if (profileData) {
                const profile: UserProfile = JSON.parse(profileData);
                setCurrentUser(profile);
            }

            try {
                const data = await getNotifications();
                setNotifications(data);
            } catch (error) {
                console.error("Error fetching notifications:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, []);

    const groupedNotifications = useMemo(() => {
        const groups: { [key: string]: Notification[] } = {};
        notifications.forEach(notif => {
            const type = notif.type || '系統通知';
            if (!groups[type]) groups[type] = [];
            groups[type].push(notif);
        });
        const groupedArray: GroupedNotifications[] = Object.keys(groups).map(type => ({
            type, notifications: groups[type],
            latestTimestamp: groups[type][0]?.timestamp,
            hasUnread: groups[type].some(n => !n.read)
        }));
        groupedArray.sort((a, b) => (toDateObj(b.latestTimestamp)?.getTime() || 0) - (toDateObj(a.latestTimestamp)?.getTime() || 0));
        return groupedArray;
    }, [notifications]);
    
    const toggleGroup = (type: string) => {
        setExpandedGroups(prev => 
            prev.includes(type) ? prev.filter(g => g !== type) : [...prev, type]
        );
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
            
// @-fix: This comparison appears to be unintentional because the types 'string' and 'number' have no overlap. Corrected to compare with string '0'.
            if (profile.id !== '0' && !profile.isGuest) {
                try {
                    await updateUserProfile(String(profile.id), { notifications: updatedNotifications });
                } catch (e) {
                    console.error("Failed to sync notification read status", e);
                }
            }
        }
    };

    if (loading) {
        return <div className="text-center p-10 text-brand-accent">讀取通知...</div>;
    }

    return (
        <div className="animate-fade-in h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4">
                 <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-brand-muted hover:text-brand-light transition-colors font-semibold">
                    <BackIcon />
                    <span>返回</span>
                </button>
            </div>
            
            <h2 className="text-2xl font-bold text-brand-light mb-4 px-2">通知中心</h2>

            <div className="flex-grow overflow-y-auto space-y-3">
                {groupedNotifications.length > 0 ? groupedNotifications.map((group) => {
                    const isExpanded = expandedGroups.includes(group.type);
                    return (
                        <div key={group.type} className="bg-brand-secondary rounded-xl border-2 border-brand-accent/20">
                            <button onClick={() => toggleGroup(group.type)} className="w-full flex justify-between items-center p-4">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-bold text-brand-light">{group.type}</h3>
                                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-brand-primary text-brand-muted border border-brand-accent/20">
                                        {group.notifications.length}
                                    </span>
                                     {group.hasUnread && <div className="w-2 h-2 bg-red-500 rounded-full" />}
                                </div>
                                <ChevronDownIcon className={`w-6 h-6 text-brand-muted transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                            </button>
                            {isExpanded && (
                                <div className="px-4 pb-2 space-y-2 animate-fade-in">
                                    {group.notifications.map((notif, index) => (
                                        <div 
                                            key={notif.id || index} 
                                            onClick={() => handleNotificationClick(notif)}
                                            className={`flex items-start gap-3 py-3 cursor-pointer transition-colors hover:bg-brand-primary/50 rounded-lg px-2 -mx-2 ${index < group.notifications.length - 1 ? 'border-b border-brand-accent/10' : ''}`}
                                        >
                                            <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${notif.read ? 'bg-brand-accent/20' : 'bg-red-500'}`} />
                                            <div>
                                                <p className={`text-sm ${notif.read ? 'text-brand-muted' : 'text-brand-light font-medium'}`}>{notif.message}</p>
                                                <span className="text-xs text-brand-muted/70 mt-1 block">
                                                    {formatDateTime(notif.timestamp)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                }) : (
                    <div className="text-center p-10 text-brand-muted bg-brand-secondary rounded-xl border-2 border-brand-accent/10 flex flex-col items-center justify-center h-64">
                        <BellIcon className="w-12 h-12 text-brand-muted/50 mb-4" />
                        <p className="text-lg font-semibold">暫無通知</p>
                        <p className="text-sm text-brand-muted/70">有新消息時會出現在這裡</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;