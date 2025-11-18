
import React from 'react';
import { useNavigate } from 'react-router-dom';

const LogoutPage: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear all user-related data from local storage
    localStorage.removeItem('userProfile');
    localStorage.removeItem('privacySettings');
    localStorage.removeItem('notificationSettings');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('lastLoggedInEmail');
    
    // Call the onLogout callback passed from App.tsx.
    // This will set isAuthenticated to false, and App.tsx's routing logic
    // will automatically handle the redirect to the login page.
    onLogout();
  };

  const handleCancel = () => {
    navigate('/profile');
  };

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
