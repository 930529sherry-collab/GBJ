
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowPathIcon } from '../components/icons/ActionIcons';
import { MOCK_USERS } from '../constants';
import { MockUser, UserProfile } from '../types';

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

const LoginPage: React.FC<{ onLoginSuccess: (userProfile: UserProfile) => void }> = ({ onLoginSuccess }) => {
    const navigate = useNavigate();
    const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [captcha, setCaptcha] = useState('');
    const [captchaCode, setCaptchaCode] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resetEmailSent, setResetEmailSent] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
    
    interface PasswordValidation {
        minLength: boolean;
        hasLetter: boolean;
        number: boolean;
    }
    const [passwordValidation, setPasswordValidation] = useState<PasswordValidation>({
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
        // Initialize mock users in localStorage if not present
        if (!localStorage.getItem('users')) {
            localStorage.setItem('users', JSON.stringify(MOCK_USERS));
        }
        generateCaptcha();
    }, []);

    const getUsers = (): MockUser[] => {
        const users = localStorage.getItem('users');
        return users ? JSON.parse(users) : [];
    };

    const generateCaptcha = () => {
        const chars = '0123456789';
        let code = '';
        for (let i = 0; i < 4; i++) {
            code += chars[Math.floor(Math.random() * chars.length)];
        }
        setCaptchaCode(code);
        drawCaptcha(code);
    };

    const drawCaptcha = (code: string) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#F8F5EF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        for (let i = 0; i < 5; i++) {
            ctx.strokeStyle = `rgba(26, 26, 26, ${Math.random() * 0.3 + 0.1})`;
            ctx.beginPath();
            ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
            ctx.stroke();
        }
        
        ctx.font = 'bold 30px "Noto Sans TC", sans-serif';
        ctx.fillStyle = '#1A1A1A';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let i = 0; i < code.length; i++) {
            const char = code[i];
            const x = canvas.width / 5 * (i + 1);
            const y = canvas.height / 2 + (Math.random() - 0.5) * 8;
            const angle = (Math.random() - 0.5) * 0.4;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(angle);
            ctx.fillText(char, 0, 0);
            ctx.restore();
        }
    };
    
    useEffect(() => {
        setError('');
        setSuccessMessage('');
        setName('');
        setPassword('');
        setConfirmPassword('');
        setCaptcha('');
        setResetEmailSent(false);
        setShowPasswordRequirements(false);
        if (mode !== 'forgot') {
            generateCaptcha();
        }
    }, [mode]);

    const handleGuestLogin = () => {
        const guestProfile: UserProfile = {
            id: 0, // Guest ID
            name: '訪客',
            avatarUrl: `https://picsum.photos/200/200?random=guest`,
            level: 1,
            xp: 0,
            xpToNextLevel: 100,
            points: 0,
            missionsCompleted: 0,
            checkIns: 0,
            friends: [],
            latlng: { lat: 25.04, lng: 121.53 }, // Default location
        };
        onLoginSuccess(guestProfile);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        setIsSubmitting(true);

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setError('請輸入有效的電子郵件格式。');
            setIsSubmitting(false);
            return;
        }
        
        if (mode !== 'forgot' && captcha.trim() !== captchaCode) {
            setError('驗證碼不正確，請再試一次。');
            generateCaptcha();
            setCaptcha('');
            setIsSubmitting(false);
            return;
        }

        if (mode === 'login') {
            setTimeout(() => {
                const users = getUsers();
                const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
                
                if (!user) {
                    setError('找不到此電子郵件的帳號。');
                    setIsSubmitting(false);
                    generateCaptcha();
                    return;
                }

                if (user.password !== password) {
                    setError('密碼不正確。');
                    setIsSubmitting(false);
                    generateCaptcha();
                    return;
                }
                
                onLoginSuccess(user.profile);
            }, 1000);
        } else if (mode === 'register') {
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
            
            setTimeout(() => {
                const users = getUsers();
                const emailExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
                if (emailExists) {
                    setError('此電子郵件已被註冊。');
                    generateCaptcha();
                    setIsSubmitting(false);
                    return;
                }

                const newId = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 101;
                const newUserProfile: UserProfile = {
                    id: newId,
                    name: name.trim(),
                    avatarUrl: `https://picsum.photos/200/200?random=${newId}`,
                    level: 1,
                    xp: 0,
                    xpToNextLevel: 100,
                    points: 0,
                    missionsCompleted: 0,
                    checkIns: 0,
                    email: email.trim().toLowerCase(),
                    friends: [],
                    latlng: { lat: 25.04, lng: 121.53 }, // Default location
                    friendCode: `GUNBOOJO-${Math.random().toString(16).substr(2, 4).toUpperCase()}`
                };

                const newMockUser: MockUser = {
                    id: newId,
                    email: email.trim().toLowerCase(),
                    password: password,
                    profile: newUserProfile,
                };

                users.push(newMockUser);
                localStorage.setItem('users', JSON.stringify(users));

                setSuccessMessage('註冊成功！請使用您的新帳號登入。');
                setMode('login');
                setIsSubmitting(false);
            }, 1000);
        } else if (mode === 'forgot') {
            setTimeout(() => {
                const users = getUsers();
                const userIndex = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());

                if (userIndex > -1) {
                    const oneTimePassword = Math.floor(100000 + Math.random() * 900000).toString();
                    console.log(`One-time password for ${email}: ${oneTimePassword}`); // For demo purposes

                    users[userIndex].password = oneTimePassword;
                    
                    localStorage.setItem('users', JSON.stringify(users));
                }
                
                setResetEmailSent(true);
                setIsSubmitting(false);
            }, 1000);
        }
    };
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isLoginFormValid = emailRegex.test(email.trim()) && password.trim() !== '' && captcha.trim().length === 4;
    const isRegisterFormValid = name.trim() !== '' && emailRegex.test(email.trim()) && password.trim() !== '' && confirmPassword.trim() !== '' && captcha.trim().length === 4;
    const isForgotFormValid = emailRegex.test(email.trim());

    const renderBottomLink = () => {
        if (mode === 'login') {
            return (
                <p className="text-center text-sm text-brand-muted mt-6">
                    還沒有帳號？
                    <button onClick={() => setMode('register')} className="font-semibold text-brand-light hover:underline ml-1">
                        立即註冊
                    </button>
                </p>
            );
        }
        if (mode === 'register') {
            return (
                <p className="text-center text-sm text-brand-muted mt-6">
                    已經有帳號了？
                    <button onClick={() => setMode('login')} className="font-semibold text-brand-light hover:underline ml-1">
                        前往登入
                    </button>
                </p>
            );
        }
        // In 'forgot' mode, a different link is handled inside the component.
        return null;
    };

    return (
        <div className="min-h-screen w-full bg-brand-primary flex flex-col justify-center items-center p-4 font-sans animate-fade-in">
            <div className="w-full max-w-sm">
                <img src={logoUrl} alt="乾不揪 Logo" className="w-48 h-48 rounded-full object-contain mx-auto mb-8" />

                <div className="bg-brand-secondary p-8 rounded-2xl border-2 border-brand-accent/20 shadow-2xl shadow-brand-accent/10">
                    {mode === 'forgot' ? (
                        resetEmailSent ? (
                            <div className="text-center animate-fade-in">
                                <svg className="w-16 h-16 text-brand-accent mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <h2 className="text-xl font-bold text-brand-light mb-2">已發送一次性密碼</h2>
                                <p className="text-brand-muted mb-6">如果 <span className="font-semibold text-brand-accent">{email}</span> 是有效帳號，您將會收到一封包含一次性密碼的信件。請使用該密碼登入，並建議您登入後立即更改密碼。</p>
                                <button onClick={() => setMode('login')} className="font-semibold text-brand-light hover:underline">
                                    返回登入
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <h2 className="text-center text-2xl font-bold text-brand-light mb-1">忘記密碼</h2>
                                    <p className="text-center text-brand-muted text-sm">請輸入您的電子郵件以接收一次性密碼。</p>
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-brand-light mb-1">電子郵件</label>
                                    <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-2 text-brand-light focus:ring-brand-accent focus:border-brand-accent" required />
                                </div>
                                {error && <p className="text-red-500 text-sm">{error}</p>}
                                <button type="submit" disabled={isSubmitting || !isForgotFormValid} className="w-full bg-brand-accent text-brand-primary font-bold py-3 px-4 rounded-lg hover:bg-opacity-80 transition-colors disabled:bg-brand-muted">
                                    {isSubmitting ? '傳送中...' : '發送一次性密碼'}
                                </button>
                                <p className="text-center text-sm text-brand-muted mt-6">
                                    <button onClick={() => setMode('login')} className="font-semibold text-brand-light hover:underline ml-1">
                                        返回登入
                                    </button>
                                </p>
                            </form>
                        )
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <h2 className="text-center text-2xl font-bold text-brand-light">{mode === 'login' ? '登入' : '註冊'}</h2>
                             {mode === 'register' && (
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-brand-light mb-1">暱稱</label>
                                    <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-2 text-brand-light focus:ring-brand-accent focus:border-brand-accent" required />
                                </div>
                            )}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-brand-light mb-1">電子郵件</label>
                                <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-2 text-brand-light focus:ring-brand-accent focus:border-brand-accent" required />
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-brand-light mb-1">密碼</label>
                                <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} onFocus={() => mode ==='register' && setShowPasswordRequirements(true)} className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-2 text-brand-light focus:ring-brand-accent focus:border-brand-accent" required />
                            </div>
                            {mode === 'register' && (
                                <>
                                    <div>
                                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-brand-light mb-1">確認密碼</label>
                                        <input type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-2 text-brand-light focus:ring-brand-accent focus:border-brand-accent" required />
                                    </div>
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
                            <div>
                                 <label htmlFor="captcha" className="block text-sm font-medium text-brand-light mb-1">驗證碼</label>
                                <div className="flex gap-2">
                                    <input type="text" id="captcha" value={captcha} onChange={(e) => setCaptcha(e.target.value)} maxLength={4} className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-2 text-brand-light tracking-widest text-center focus:ring-brand-accent focus:border-brand-accent" required />
                                    <div className="flex-shrink-0 relative">
                                        <canvas ref={canvasRef} width="120" height="40" className="rounded-md border border-brand-accent/50 cursor-pointer" onClick={generateCaptcha}></canvas>
                                        <button type="button" onClick={generateCaptcha} className="absolute top-1/2 right-1 -translate-y-1/2 p-1 text-brand-muted hover:text-brand-light" aria-label="Refresh captcha">
                                            <ArrowPathIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            {mode === 'login' && <div className="text-right"><button type="button" onClick={() => setMode('forgot')} className="text-xs text-brand-muted hover:underline">忘記密碼？</button></div>}
                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                            {successMessage && <p className="text-green-500 text-sm text-center">{successMessage}</p>}
                            <button
                                type="submit"
                                disabled={isSubmitting || (mode === 'login' ? !isLoginFormValid : !isRegisterFormValid)}
                                className="w-full bg-brand-accent text-brand-primary font-bold py-3 px-4 rounded-lg hover:bg-opacity-80 transition-colors disabled:bg-brand-muted"
                            >
                                {isSubmitting ? '處理中...' : (mode === 'login' ? '登入' : '註冊')}
                            </button>
                        </form>
                    )}
                    {renderBottomLink()}
                </div>

                 <div className="mt-6 text-center">
                    <button onClick={handleGuestLogin} className="text-brand-muted font-semibold hover:text-brand-light transition-colors hover:underline">
                        以訪客身份繼續
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
