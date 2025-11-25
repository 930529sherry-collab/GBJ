


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_USER_PROFILE, WELCOME_COUPONS, MOCK_USERS, INITIAL_MISSIONS } from '../constants';
import { UserProfile, Coupon } from '../types';
import firebase, { auth } from '../firebase/config';
import { BackIcon } from '../components/icons/ActionIcons';
import { getUserProfile, createFallbackUserProfile, createUserProfileInDB } from '../utils/api';

const logoUrl = 'https://raw.githubusercontent.com/930529sherry-collab/gunboojo/56b3926c513c87c1cf6cbe82697e392cd03465e6/%E4%B9%BE%E4%B8%8D%E6%8F%AA%20%E5%BD%A9%E8%89%B2%E7%89%88.png';

const PasswordRequirement: React.FC<{ isValid: boolean; text: string }> = ({ isValid, text }) => (
    <li className={`flex items-center text-sm transition-colors ${isValid ? 'text-green-500' : 'text-brand-muted'}`}>
        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
            {isValid ? (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            ) : (
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            )}
        </svg>
        {text}
    </li>
);

const LoginPage: React.FC<{ onLoginSuccess: (userProfile: UserProfile, requiresOnboarding: boolean) => void }> = ({ onLoginSuccess }) => {
    const [mode, setMode] = useState<'landing' | 'login' | 'register' | 'forgot'>('landing');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resetEmailSent, setResetEmailSent] = useState(false);
    const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
    const navigate = useNavigate();
    
    const [passwordValidation, setPasswordValidation] = useState({
        minLength: false,
        hasLetter: false,
        number: false,
    });
    
    useEffect(() => {
        const validatePassword = () => {
            setPasswordValidation({
                minLength: password.length >= 8,
                hasLetter: /[a-zA-Z]/.test(password),
                number: /[0-9]/.test(password),
            });
        };
        if (mode === 'register') {
            validatePassword();
        }
    }, [password, mode]);

    useEffect(() => {
        setError('');
        setSuccessMessage('');
        setName('');
        setPassword('');
        setConfirmPassword('');
        setResetEmailSent(false);
        setShowPasswordRequirements(false);
    }, [mode]);

    const syncUserProfile = async (user: firebase.User, displayNameOverride?: string, photoUrlOverride?: string): Promise<UserProfile> => {
        try {
            return await getUserProfile(user.uid);
        } catch (e: any) {
            const errorMsg = e.message || String(e);
            if (errorMsg.includes("User profile not found")) {
                const displayName = displayNameOverride || user.displayName || name || '新用戶';
                return await createFallbackUserProfile(user, displayName, photoUrlOverride);
            }
            throw e;
        }
    };

    const handleGuestLogin = () => {
        // FIX: Replaced non-existent 'completedMissionIds' with the required 'missions' property and added 'displayName'.
        const guestProfile: UserProfile = {
            id: 0,
            name: '訪客',
            displayName: '訪客',
            avatarUrl: `https://picsum.photos/200/200?random=guest`,
            level: 1,
            xp: 0,
            xpToNextLevel: 100,
            points: 0,
            missionsCompleted: 0,
            checkIns: 0,
            friends: [],
            notifications: [],
            missions: INITIAL_MISSIONS.map(m => ({ ...m, current: m.id === 'special_level_5' ? 1 : 0 })),
            hasReceivedWelcomeGift: false,
            latlng: { lat: 25.04, lng: 121.53 },
            isGuest: true,
        };
        localStorage.setItem('userCoupons', JSON.stringify(WELCOME_COUPONS));
        localStorage.setItem('userProfile', JSON.stringify(guestProfile));
        
        onLoginSuccess(guestProfile, true);
        navigate('/');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        
        if (!auth && mode === 'register') {
            setError('Firebase 未連線，無法註冊。請使用訪客模式。');
            return;
        }

        setIsSubmitting(true);

        try {
            if (mode === 'login') {
                try {
                    const userCredential = await auth!.signInWithEmailAndPassword(email, password);
                    if (userCredential.user) {
                        const profile = await syncUserProfile(userCredential.user);
                        localStorage.setItem('userProfile', JSON.stringify(profile));
                        onLoginSuccess(profile, false);
                        navigate('/');
                    }
                } catch (firebaseErr: any) {
                    const mockUser = MOCK_USERS.find(u => u.email === email && u.password === password);
                    if (mockUser) {
                        localStorage.setItem('userProfile', JSON.stringify(mockUser.profile));
                        onLoginSuccess(mockUser.profile, false);
                        navigate('/');
                        return;
                    }
                    throw firebaseErr;
                }

            } else if (mode === 'register') {
                if (!auth) throw new Error("Firebase auth not initialized");
                
                if (!Object.values(passwordValidation).every(Boolean)) {
                    setError('密碼不符合安全要求。');
                    setShowPasswordRequirements(true);
                    setIsSubmitting(false);
                    return;
                }
                if (password !== confirmPassword) {
                    setError('兩次輸入的密碼不相符。');
                    setIsSubmitting(false);
                    return;
                }

                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                if (userCredential.user) {
                    
                    const finalAvatarUrl = `https://picsum.photos/200?random=${userCredential.user.uid}`;

                    try {
                        await userCredential.user.updateProfile({
                            displayName: name,
                            photoURL: finalAvatarUrl
                        });
                    } catch (profileErr) {
                        console.warn("Auth profile update failed", profileErr);
                    }

                    try {
                        const newProfile = await createUserProfileInDB(userCredential.user, name, finalAvatarUrl);
                        localStorage.setItem('userProfile', JSON.stringify(newProfile));
                        
                        const existingCoupons = JSON.parse(localStorage.getItem('userCoupons') || '[]');
                        const uniqueNewCoupons = WELCOME_COUPONS.filter(newC => 
                            !existingCoupons.some((existingC: Coupon) => existingC.title === newC.title)
                        );
                        localStorage.setItem('userCoupons', JSON.stringify([...uniqueNewCoupons, ...existingCoupons]));
                        
                        setSuccessMessage('註冊成功！正在登入...');
                        
                        setTimeout(() => {
                            onLoginSuccess(newProfile, true);
                            navigate('/');
                        }, 1500);

                    } catch (backendError: any) {
                        const errorMessage = (backendError.message || String(backendError)).toLowerCase();
                        if (errorMessage.includes("此暱稱已被使用")) {
                            setError('此暱稱已被使用，請換一個。');
                        } else {
                            setError('帳號建立時發生錯誤，請聯繫客服或稍後再試。');
                        }
                        userCredential.user.delete().catch(err => console.error("清除殘留帳號失敗", err));
                    }
                }

            } else if (mode === 'forgot') {
                 if (auth) {
                    await auth.sendPasswordResetEmail(email);
                    setResetEmailSent(true);
                 }
            }
        } catch (err: any) {
            if (err.code !== 'auth/invalid-credential' && err.code !== 'auth/user-not-found' && err.code !== 'auth/wrong-password') {
                console.error("Auth error:", err);
            } else {
                console.warn("Login failed:", err.code);
            }

            let msg = '發生錯誤，請稍後再試。';
            if (err.code === 'auth/network-request-failed') {
                msg = '網路連線失敗。請檢查您的網路連線、防火牆設定，或嘗試使用不同的網路環境。';
            } else if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                msg = '帳號或密碼錯誤。';
            } else if (err.code === 'auth/email-already-in-use') {
                msg = '此電子郵件已被註冊。';
            } else if (err.code === 'auth/weak-password') {
                msg = '密碼強度不足。';
            } else if (err.code === 'auth/invalid-email') {
                msg = '無效的電子郵件格式。';
            } else if (err.code === 'auth/popup-closed-by-user') {
                msg = '登入已取消。';
            } else if (err.code === 'auth/unauthorized-domain') {
                 msg = `網域未授權。請在 Firebase Console > Authentication > Settings > Authorized domains 中新增此網域 (${window.location.hostname})。`;
            }
            setError(msg);
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="min-h-screen w-full bg-brand-primary flex flex-col justify-center items-center p-4 font-sans animate-fade-in">
            <div className="w-full max-w-sm">
                <img src={logoUrl} alt="乾不揪 Logo" className="w-48 h-48 rounded-full object-contain mx-auto mb-6" />

                <div className="bg-brand-secondary p-8 rounded-2xl border-2 border-brand-accent/20 shadow-2xl shadow-brand-accent/10">
                    {mode === 'landing' ? (
                        <div className="text-center space-y-6 animate-fade-in">
                            <div>
                                <h1 className="text-3xl font-black text-brand-accent mb-2 tracking-wider">乾不揪</h1>
                                <p className="text-brand-muted font-medium">不怕沒人喝，只怕你不揪</p>
                            </div>
                            
                            <div className="space-y-3 pt-4">
                                <button 
                                    onClick={() => setMode('login')}
                                    className="w-full bg-brand-accent text-brand-primary font-bold py-3 px-4 rounded-lg hover:bg-opacity-90 transition-all transform hover:scale-105 shadow-lg shadow-brand-accent/20"
                                >
                                    登入
                                </button>
                                <button 
                                    onClick={() => setMode('register')}
                                    className="w-full bg-transparent border-2 border-brand-accent text-brand-accent font-bold py-3 px-4 rounded-lg hover:bg-brand-accent/5 transition-all transform hover:scale-105"
                                >
                                    註冊
                                </button>
                            </div>

                            <div className="pt-2">
                                <button 
                                    onClick={handleGuestLogin} 
                                    className="text-sm text-brand-muted font-semibold hover:text-brand-light transition-colors border-b border-transparent hover:border-brand-muted"
                                >
                                    訪客試用
                                </button>
                            </div>
                        </div>
                    ) : mode === 'forgot' ? (
                        resetEmailSent ? (
                            <div className="text-center animate-fade-in">
                                <svg className="w-16 h-16 text-brand-accent mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <h2 className="text-xl font-bold text-brand-light mb-2">已發送重設信件</h2>
                                <p className="text-brand-muted mb-6">如果 <span className="font-semibold text-brand-accent">{email}</span> 是有效帳號，您將會收到一封重設密碼的信件。</p>
                                <button onClick={() => setMode('login')} className="font-semibold text-brand-light hover:underline">
                                    返回登入
                                </button>
                            </div>
                        ) : (
                            <div className="animate-fade-in">
                                <div className="mb-6">
                                    <button onClick={() => setMode('login')} className="flex items-center text-brand-muted hover:text-brand-accent transition-colors">
                                        <BackIcon className="w-5 h-5 mr-1" /> 返回
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div>
                                        <h2 className="text-center text-2xl font-bold text-brand-light mb-1">忘記密碼</h2>
                                        <p className="text-center text-brand-muted text-sm">請輸入您的電子郵件以重設密碼。</p>
                                    </div>
                                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-2 text-brand-light" placeholder="電子郵件" required />
                                    {error && <p className="text-red-500 text-sm">{error}</p>}
                                    <button type="submit" disabled={isSubmitting} className="w-full bg-brand-accent text-brand-primary font-bold py-3 px-4 rounded-lg hover:bg-opacity-80 transition-colors disabled:bg-brand-muted">
                                        {isSubmitting ? '傳送中...' : '發送重設連結'}
                                    </button>
                                </form>
                            </div>
                        )
                    ) : (
                        <div className="animate-fade-in">
                            <div className="mb-4">
                                <button onClick={() => setMode('landing')} className="flex items-center text-brand-muted hover:text-brand-accent transition-colors">
                                    <BackIcon className="w-5 h-5 mr-1" /> 返回首頁
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <h2 className="text-center text-2xl font-bold text-brand-light">{mode === 'login' ? '登入' : '註冊'}</h2>
                                
                                {mode === 'register' && (
                                    <>
                                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-2 text-brand-light" placeholder="暱稱" required />
                                    </>
                                )}
                                
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-2 text-brand-light" placeholder="電子郵件" required />
                                
                                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => mode ==='register' && setShowPasswordRequirements(true)} className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-2 text-brand-light" placeholder="密碼" required />
                                
                                {mode === 'register' && (
                                    <>
                                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-2 text-brand-light" placeholder="確認密碼" required />
                                        {showPasswordRequirements && (
                                            <div className="bg-brand-primary/50 p-3 rounded-md border border-brand-accent/20 animate-fade-in">
                                                <ul className="space-y-1">
                                                    <PasswordRequirement isValid={passwordValidation.minLength} text="至少 8 個字元" />
                                                    <PasswordRequirement isValid={passwordValidation.hasLetter} text="包含至少一個字母" />
                                                    <PasswordRequirement isValid={passwordValidation.number} text="包含至少一個數字" />
                                                </ul>
                                            </div>
                                        )}
                                    </>
                                )}

                                {mode === 'login' && (
                                    <div className="text-right">
                                        <button type="button" onClick={() => setMode('forgot')} className="text-xs text-brand-muted hover:underline">忘記密碼？</button>
                                    </div>
                                )}

                                {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}
                                {successMessage && <p className="text-green-500 text-sm text-center">{successMessage}</p>}
                                
                                <button type="submit" disabled={isSubmitting} className="w-full bg-brand-accent text-brand-primary font-bold py-3 px-4 rounded-lg hover:bg-opacity-80 transition-colors disabled:bg-brand-muted">
                                    {isSubmitting ? '處理中...' : (mode === 'login' ? '登入' : '註冊')}
                                </button>
                            </form>

                            <p className="text-center text-sm text-brand-muted mt-6">
                                {mode === 'login' ? '還沒有帳號？' : '已經有帳號了？'}
                                <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="font-semibold text-brand-light hover:underline ml-1">
                                    {mode === 'login' ? '立即註冊' : '前往登入'}
                                </button>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;