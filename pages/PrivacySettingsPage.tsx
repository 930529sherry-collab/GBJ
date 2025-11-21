
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ToggleSwitch from '../components/ToggleSwitch';
import { auth } from '../firebase/config';
import { useGuestGuard } from '../context/GuestGuardContext';
import { XIcon } from '../components/icons/ActionIcons';
import { updateUserProfile } from '../utils/api';
import { UserProfile } from '../types';

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

const ChangePasswordModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    email: string | null;
}> = ({ isOpen, onClose, email }) => {
    const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        if (isOpen) {
            setStatus('idle');
            setErrorMsg('');
        }
    }, [isOpen]);

    const handleSendEmail = async () => {
        if (!email || !auth) return;
        setStatus('sending');
        try {
            await auth.sendPasswordResetEmail(email);
            setStatus('success');
        } catch (err: any) {
            console.error("Password reset error:", err);
            setStatus('error');
            if (err.code === 'auth/too-many-requests') {
                setErrorMsg("請求過於頻繁，請稍後再試。");
            } else {
                setErrorMsg("發送失敗，請檢查網路或稍後再試。");
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4 backdrop-blur-md animate-fade-in">
            <div className="bg-brand-secondary rounded-2xl p-6 w-full max-w-sm border-2 border-brand-accent/30 shadow-2xl shadow-brand-accent/10 relative">
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 text-brand-muted hover:text-brand-light transition-colors"
                >
                    <XIcon />
                </button>

                <h2 className="text-xl font-bold text-brand-accent mb-4 text-center">更改密碼</h2>

                {status === 'idle' && (
                    <>
                        <div className="bg-brand-primary p-4 rounded-lg border border-brand-accent/20 mb-4">
                            <p className="text-sm text-brand-muted mb-1">將發送重設連結至：</p>
                            <p className="font-bold text-brand-light break-all">{email || '未知信箱'}</p>
                        </div>
                        <p className="text-sm text-brand-muted mb-6 text-center">
                            為了帳號安全，我們將透過電子郵件協助您重設密碼。收到信件後，請點擊連結設定新密碼。
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 bg-brand-primary border-2 border-brand-accent text-brand-light py-2 px-4 rounded-lg hover:bg-brand-accent/10 transition-colors font-semibold"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleSendEmail}
                                className="flex-1 bg-brand-accent text-brand-primary font-bold py-2 px-4 rounded-lg hover:bg-opacity-80 transition-colors"
                            >
                                發送重設信
                            </button>
                        </div>
                    </>
                )}

                {status === 'sending' && (
                    <div className="text-center py-8">
                        <div className="inline-block w-8 h-8 border-4 border-brand-accent border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-brand-muted">正在發送請求...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="text-center py-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-green-200">
                            <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-brand-light mb-2">發送成功！</h3>
                        <p className="text-sm text-brand-muted mb-6">
                            請至您的信箱收信，並依照指示完成密碼更改。
                        </p>
                        <button
                            onClick={onClose}
                            className="w-full bg-brand-accent text-brand-primary font-bold py-2 px-4 rounded-lg hover:bg-opacity-80 transition-colors"
                        >
                            知道了
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="text-center py-4">
                         <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-red-200">
                            <XIcon className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-lg font-bold text-red-500 mb-2">發送失敗</h3>
                        <p className="text-sm text-brand-muted mb-6">
                            {errorMsg}
                        </p>
                        <button
                            onClick={() => setStatus('idle')}
                            className="w-full bg-brand-primary border-2 border-brand-accent text-brand-light font-bold py-2 px-4 rounded-lg hover:bg-brand-accent/10 transition-colors"
                        >
                            重試
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const PrivacySettingsPage: React.FC = () => {
    const navigate = useNavigate();
    const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { checkGuest } = useGuestGuard();
    
    // Password Modal State
    const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    useEffect(() => {
        const savedSettings = localStorage.getItem('privacySettings');
        const profileData = localStorage.getItem('userProfile');
        const profile: UserProfile | null = profileData ? JSON.parse(profileData) : null;
        
        let loadedSettings = { ...DEFAULT_SETTINGS };
        if (savedSettings) {
            loadedSettings = { ...loadedSettings, ...JSON.parse(savedSettings) };
        }
        if (profile && profile.profileVisibility) {
            loadedSettings.profileVisibility = profile.profileVisibility;
        }

        setSettings(loadedSettings);
        setIsLoading(false);
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        
        const profileData = localStorage.getItem('userProfile');
        const profile: UserProfile | null = profileData ? JSON.parse(profileData) : null;
        
        if (profile) {
            const updatedProfile = { ...profile, profileVisibility: settings.profileVisibility };
            localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
            
            if (!profile.isGuest && profile.id !== 0) {
                try {
                    await updateUserProfile(String(profile.id), { profileVisibility: settings.profileVisibility });
                } catch (e) {
                    console.error("Failed to save visibility setting to Firestore", e);
                    // Optionally show an error to the user
                }
            }
        }
        
        localStorage.setItem('privacySettings', JSON.stringify(settings));
        
        setIsSaving(false);
        navigate('/profile');
    };

    const handleSettingChange = <K extends keyof PrivacySettings>(key: K, value: PrivacySettings[K]) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleChangePasswordClick = () => {
        checkGuest(() => {
            const user = auth.currentUser;
            if (user && user.email) {
                setUserEmail(user.email);
                setPasswordModalOpen(true);
            } else {
                alert("無法取得您的帳號資訊，請重新登入。");
            }
        });
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
                        description="個人檔案全公開，貼文包括發限制好友跟私人也全公開。"
                        checked={settings.profileVisibility === 'public'}
                        onChange={(val) => handleSettingChange('profileVisibility', val as PrivacySettings['profileVisibility'])}
                    />
                    <RadioOption
                        id="friends"
                        name="visibility"
                        value="friends"
                        label="僅限好友"
                        description="個人檔案對好友全公開，貼文包括私人的也能看到。"
                        checked={settings.profileVisibility === 'friends'}
                        onChange={(val) => handleSettingChange('profileVisibility', val as PrivacySettings['profileVisibility'])}
                    />
                    <RadioOption
                        id="private"
                        name="visibility"
                        value="private"
                        label="私人"
                        description="別人什麼都看不到。"
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
                <button 
                    onClick={handleChangePasswordClick}
                    className="w-full text-left p-4 hover:bg-brand-primary/80 transition-colors"
                >
                    更改密碼
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

            {/* Change Password Modal */}
            <ChangePasswordModal 
                isOpen={isPasswordModalOpen}
                onClose={() => setPasswordModalOpen(false)}
                email={userEmail}
            />
        </div>
    );
};

export default PrivacySettingsPage;
