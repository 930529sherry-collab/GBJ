

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_USER_PROFILE } from '../constants';
import { UserProfile } from '../types';
import { updateUserProfile, getUserProfile, uploadImage } from '../utils/api';
import { auth } from '../firebase/config';
// @-fix: Replaced modular 'updateProfile' import with compat syntax which is accessed via auth.currentUser.

const EditProfilePage: React.FC = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [name, setName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Load the current profile data
        const savedProfile = localStorage.getItem('userProfile');
        const currentProfile = savedProfile ? JSON.parse(savedProfile) : MOCK_USER_PROFILE;
        setProfile(currentProfile);
        setName(currentProfile.displayName || currentProfile.name || '');
        setAvatarUrl(currentProfile.avatarUrl);
        setEmail(currentProfile.email || '');
        setPhone(currentProfile.phone || '');
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            
            // Limit to 5MB
            if (file.size > 5 * 1024 * 1024) {
                alert('圖片大小請勿超過 5MB');
                return;
            }

            setSelectedFile(file);

            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleSave = async () => {
        if (!profile) return;
        setIsSaving(true);
        
        try {
            const uid = String(profile.id);
            let finalAvatarUrl = profile.avatarUrl; // Use existing URL by default

            // 0. 如果有選新圖片，先上傳到 Storage
            // @-fix: Corrected unintentional type comparison from '0' (number) to "'0'" (string).
            if (selectedFile && profile.id !== '0') {
                console.log("正在上傳圖片到 Storage...");
                finalAvatarUrl = await uploadImage(selectedFile, `avatars/${uid}_${Date.now()}.jpg`);
            }

            // 1. 準備要更新的資料
            const updates: Partial<UserProfile> = {
                displayName: name,
                name: name,
                avatarUrl: finalAvatarUrl,
                email: email,
                phone: phone
            };

            // 2. 更新 Firestore 資料庫
            // @-fix: Corrected unintentional type comparison from '0' (number) to "'0'" (string).
            if (profile.id !== '0') {
                 console.log("正在更新資料庫...");
                 await updateUserProfile(uid, updates);
            }
            
            // 3. 更新 Firebase Auth (現在網址變短了，可以安全更新)
            if (auth.currentUser) {
                console.log("正在更新 Auth Profile...");
                // @-fix: Switched to compat syntax for updating user profile.
                await auth.currentUser.updateProfile({
                    displayName: name,
                    photoURL: finalAvatarUrl 
                });
            }
            
            // 4. 更新 LocalStorage
            console.log("正在同步本地快取...");
            let latestProfile: UserProfile;
            
            try {
                // @-fix: Corrected unintentional type comparison from '0' (number) to "'0'" (string).
                if (profile.id !== '0') {
                    // Fetch fresh profile to get any server-side changes
                    latestProfile = await getUserProfile(uid);
                } else {
                    // 訪客模式直接用本地更新
                    latestProfile = { ...profile, ...updates };
                }
            } catch (e) {
                // 如果抓取失敗，使用樂觀更新
                console.warn("Fetch profile failed, falling back to optimistic update", e);
                latestProfile = { ...profile, ...updates };
            }
            
            localStorage.setItem('userProfile', JSON.stringify(latestProfile));
            
            setIsSaving(false);
            alert('修改成功！');
            navigate('/profile');
        } catch (error: any) {
            console.error("Failed to update profile:", error);
            alert(`更新失敗: ${error.message || "請稍後再試"}`);
            setIsSaving(false);
        }
    };

    if (!profile) {
        return <div className="text-center p-10 text-brand-accent">讀取中...</div>;
    }

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="bg-brand-secondary p-6 rounded-2xl border-2 border-brand-accent/20 space-y-6">
                <div className="flex flex-col items-center space-y-4">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                    />
                    <img 
                        src={avatarUrl} 
                        alt="Avatar Preview" 
                        className="w-28 h-28 rounded-full object-cover border-4 border-brand-accent shadow-lg shadow-brand-accent/30 cursor-pointer" 
                        onClick={handleAvatarClick}
                    />
                    <button 
                        onClick={handleAvatarClick}
                        className="bg-brand-primary border-2 border-brand-accent text-brand-light text-sm py-1 px-3 rounded-lg hover:bg-brand-accent/10 transition-colors"
                    >
                        更換頭像
                    </button>
                </div>
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-brand-light mb-1">暱稱</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-2 text-brand-light focus:ring-brand-accent focus:border-brand-accent"
                        placeholder="你的暱稱"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-brand-light mb-1">電子郵件</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-2 text-brand-light focus:ring-brand-accent focus:border-brand-accent"
                        placeholder="your@email.com"
                    />
                </div>
                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-brand-light mb-1">電話</label>
                    <input
                        type="tel"
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-2 text-brand-light focus:ring-brand-accent focus:border-brand-accent"
                        placeholder="0912-345-678"
                    />
                </div>
            </div>

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

export default EditProfilePage;