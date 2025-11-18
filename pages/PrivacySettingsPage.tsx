import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ToggleSwitch from '../components/ToggleSwitch';

interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  locationSharing: boolean;
  activitySharing: boolean;
}

const DEFAULT_SETTINGS: PrivacySettings = {
  profileVisibility: 'friends',
  locationSharing: true,
  activitySharing: true,
};

const RadioOption: React.FC<{
  id: string;
  name: string;
  value: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: string) => void;
}> = ({ id, name, value, label, description, checked, onChange }) => (
  <label htmlFor={id} className="flex items-start p-4 rounded-lg bg-brand-primary cursor-pointer hover:bg-brand-accent/10 transition-colors border-2 border-brand-accent/20 has-[:checked]:border-brand-accent has-[:checked]:bg-brand-accent/5">
    <input
      type="radio"
      id={id}
      name={name}
      value={value}
      checked={checked}
      onChange={(e) => onChange(e.target.value)}
      className="mt-1 h-4 w-4 shrink-0 cursor-pointer border-brand-muted text-brand-accent focus:ring-brand-accent"
    />
    <div className="ml-4">
      <p className="font-semibold text-brand-light">{label}</p>
      <p className="text-sm text-brand-muted">{description}</p>
    </div>
  </label>
);

const PrivacySettingsPage: React.FC = () => {
    const navigate = useNavigate();
    const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const savedSettings = localStorage.getItem('privacySettings');
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }
        setIsLoading(false);
    }, []);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            localStorage.setItem('privacySettings', JSON.stringify(settings));
            setIsSaving(false);
            navigate('/profile');
        }, 1000); // Simulate API call
    };

    const handleSettingChange = <K extends keyof PrivacySettings>(key: K, value: PrivacySettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    if (isLoading) {
        return <div className="text-center p-10 text-brand-accent">正在讀取設定...</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Profile Visibility Section */}
            <div className="bg-brand-secondary p-6 rounded-2xl border-2 border-brand-accent/20">
                <h3 className="text-lg font-bold text-brand-light mb-4">個人檔案可見度</h3>
                <div className="space-y-3">
                    <RadioOption
                        id="public"
                        name="visibility"
                        value="public"
                        label="公開"
                        description="所有人都可以看到你的個人檔案。"
                        checked={settings.profileVisibility === 'public'}
                        onChange={(val) => handleSettingChange('profileVisibility', val as PrivacySettings['profileVisibility'])}
                    />
                    <RadioOption
                        id="friends"
                        name="visibility"
                        value="friends"
                        label="僅限好友"
                        description="只有你的好友可以查看你的個人檔案。"
                        checked={settings.profileVisibility === 'friends'}
                        onChange={(val) => handleSettingChange('profileVisibility', val as PrivacySettings['profileVisibility'])}
                    />
                    <RadioOption
                        id="private"
                        name="visibility"
                        value="private"
                        label="私人"
                        description="只有你自己可以查看你的個人檔案。"
                        checked={settings.profileVisibility === 'private'}
                        onChange={(val) => handleSettingChange('profileVisibility', val as PrivacySettings['profileVisibility'])}
                    />
                </div>
            </div>

            {/* Sharing Settings Section */}
            <div className="bg-brand-secondary p-6 rounded-2xl border-2 border-brand-accent/20 space-y-6">
                 <h3 className="text-lg font-bold text-brand-light">分享設定</h3>
                 <ToggleSwitch 
                    id="locationSharing"
                    label="與好友分享我的位置"
                    description="開啟後，你的好友可以在地圖上看到你的大致位置。"
                    checked={settings.locationSharing}
                    onChange={(checked) => handleSettingChange('locationSharing', checked)}
                 />
                 <div className="h-px bg-brand-accent/10"></div>
                 <ToggleSwitch 
                    id="activitySharing"
                    label="在動態牆分享我的活動"
                    description="開啟後，你的打卡和任務完成動態會顯示給好友。"
                    checked={settings.activitySharing}
                    onChange={(checked) => handleSettingChange('activitySharing', checked)}
                 />
            </div>
            
            {/* Data Management Section */}
            <div className="bg-brand-secondary rounded-lg overflow-hidden border-2 border-brand-accent/20">
                <button className="w-full text-left p-4 hover:bg-brand-primary/80 transition-colors">
                    下載我的資料
                </button>
                <div className="h-px bg-brand-accent/10"></div>
                <button className="w-full text-left p-4 text-red-500 hover:bg-red-500/10 transition-colors">
                    刪除帳號
                </button>
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

export default PrivacySettingsPage;