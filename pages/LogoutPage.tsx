import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase/config';

const LogoutPage: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const navigate = useNavigate();

  const isGuest = (() => {
    const profileData = localStorage.getItem('userProfile');
    if (profileData) {
        const profile = JSON.parse(profileData);
        return profile.id === 0 || profile.id === '0' || profile.isGuest;
    }
    return false;
  })();

  const handleLogout = async () => {
    try {
        await signOut(auth);
        console.log("Signed out from Firebase");
    } catch (error) {
        console.error("Error signing out from Firebase", error);
    }
    
    localStorage.removeItem('isAuthenticated');
    onLogout();
  };

  useEffect(() => {
    if (isGuest) {
        handleLogout();
    }
  }, [isGuest]);

  const handleCancel = () => {
    navigate('/profile');
  };

  if (isGuest) return null;

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-250px)] animate-fade-in">
      <div className="bg-brand-secondary p-8 rounded-2xl border-2 border-brand-accent/20 shadow-xl shadow-brand-accent/10 text-center w-full max-w-sm">
        <h2 className="text-2xl font-bold text-brand-light mb-4">確定要登出嗎？</h2>
        <p className="text-brand-muted mb-8">您將會被登出並返回登入頁面。</p>
        <div className="flex flex-col gap-4">
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-600 transition-colors"
          >
            確認登出
          </button>
          <button
            onClick={handleCancel}
            className="w-full bg-brand-primary border-2 border-brand-accent text-brand-light font-semibold py-3 px-4 rounded-lg hover:bg-brand-accent/10 transition-colors"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutPage;
