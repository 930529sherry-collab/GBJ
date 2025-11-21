
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ToggleSwitch from '../components/ToggleSwitch';

interface NotificationSettings {
  friendActivity: boolean;
  newDeals: boolean;
  missionReminders: boolean;
  reservationUpdates: boolean;
  appAnnouncements: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  friendActivity: true,
  newDeals: true,
  missionReminders: true, // Changed to true
  reservationUpdates: true,
  appAnnouncements: true,
};

const NotificationSettingsPage: React.FC = () => {
    const navigate = useNavigate();
    const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const savedSettings = localStorage.getItem('notificationSettings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
        setIsLoading(false);
    }, []);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            localStorage.setItem('notificationSettings', JSON.stringify(settings));
            setIsSaving(false);
            navigate('/profile');
        }, 1000); // Simulate API call
    };

    const handleSettingChange = <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    if (isLoading) {
        return <div className="text-center p-10 text-brand-accent">正在讀取設定...</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-brand-secondary p-6 rounded-2xl border-2 border-brand-accent/20 space-y-6">
                 <h3 className="text-lg font-bold text-brand-light">好友與社群</h3>
                 <ToggleSwitch 
                    id="friendActivity"
                    label="好友動態通知"
                    description="當好友打卡或完成任務時通知我。"
                    checked={settings.friendActivity}
                    onChange={(checked) => handleSettingChange('friendActivity', checked)}
                 />
            </div>
            
            <div className="bg-brand-secondary p-6 rounded-2xl border-2 border-brand-accent/20 space-y-6">
                 <h3 className="text-lg font-bold text-brand-light">店家與優惠</h3>
                 <ToggleSwitch 
                    id="newDeals"
                    label="新優惠通知"
                    description="當我收藏的店家或附近有新優惠時通知我。"
                    checked={settings.newDeals}
                    onChange={(checked) => handleSettingChange('newDeals', checked)}
                 />
                 <div className="h-px bg-brand-accent/10"></div>
                 <ToggleSwitch 
                    id="reservationUpdates"
                    label="訂單狀態更新"
                    description="關於我的預約訂單的確認、提醒或變更。"
                    checked={settings.reservationUpdates}
                    onChange={(checked) => handleSettingChange('reservationUpdates', checked)}
                 />
            </div>

            <div className="bg-brand-secondary p-6 rounded-2xl border-2 border-brand-accent/20 space-y-6">
                 <h3 className="text-lg font-bold text-brand-light">任務與系統</h3>
                  <ToggleSwitch 
                    id="missionReminders"
                    label="任務提醒"
                    description="提醒我尚未完成的每日或每週任務。"
                    checked={settings.missionReminders}
                    onChange={(checked) => handleSettingChange('missionReminders', checked)}
                 />
                 <div className="h-px bg-brand-accent/10"></div>
                 <ToggleSwitch 
                    id="appAnnouncements"
                    label="App 公告與更新"
                    description="接收關於新功能、活動或重要公告的通知。"
                    checked={settings.appAnnouncements}
                    onChange={(checked) => handleSettingChange('appAnnouncements', checked)}
                 />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mt-8">
                <button
                    onClick={() => navigate('/profile')}
                    className="flex-1 bg-brand-primary border-2 border-brand-accent text-brand-light py-3 px-4 rounded-lg hover:bg-brand-accent/10 transition-colors font-semibold"
                    disabled={isSaving}
                >
                    取消
                </button>
                <button
                    onClick={handleSave}
                    className="flex-1 bg-brand-accent text-brand-primary font-bold py-3 px-4 rounded-lg hover:bg-opacity-80 transition-colors disabled:bg-brand-muted"
                    disabled={isSaving}
                >
                    {isSaving ? '儲存中...' : '儲存變更'}
                </button>
            </div>
        </div>
    );
};

export default NotificationSettingsPage;
