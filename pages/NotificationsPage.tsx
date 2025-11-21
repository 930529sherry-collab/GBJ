
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Notification } from '../types';
import { BackIcon, BellIcon } from '../components/icons/ActionIcons';
import { getNotifications } from '../utils/api';
import { formatDateTime } from '../constants';

const NotificationsPage: React.FC = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                // No simulation needed, just try to fetch or default to empty
                // getNotifications handles sorting (newest first)
                const data = await getNotifications();
                setNotifications(data);
            } catch (error) {
                console.error("Error fetching notifications:", error);
                setNotifications([]);
            } finally {
                setLoading(false);
            }
        };
        fetchNotifications();
    }, []);

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
                {notifications.length > 0 ? notifications.map((notif, index) => (
                    <div key={notif.id || index} className="bg-brand-secondary p-4 rounded-xl border-2 border-brand-accent/20 flex items-start gap-3">
                        <div className={`w-2 h-2 mt-2 rounded-full flex-shrink-0 ${notif.read ? 'bg-brand-accent/20' : 'bg-red-500'}`} />
                        <div>
                            <h3 className="font-bold text-brand-light">{notif.type}</h3>
                            <p className="text-brand-muted text-sm">{notif.message}</p>
                            <span className="text-xs text-brand-muted/70 mt-1 block">
                                {formatDateTime(notif.timestamp)}
                            </span>
                        </div>
                    </div>
                )) : (
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
