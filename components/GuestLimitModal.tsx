
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XIcon } from './icons/ActionIcons';

interface GuestLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GuestLimitModal: React.FC<GuestLimitModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLoginRedirect = () => {
    onClose();
    navigate('/logout');
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-center items-center p-4 backdrop-blur-md animate-fade-in">
      <div className="bg-brand-secondary rounded-2xl p-6 w-full max-w-sm border-2 border-brand-accent/30 shadow-2xl shadow-brand-accent/10 text-center">
        <div className="flex justify-end">
            <button onClick={onClose} className="text-brand-muted hover:text-brand-light">
                <XIcon />
            </button>
        </div>
        
        <div className="mb-6 mt-2">
            <div className="w-16 h-16 bg-brand-primary rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-brand-accent/20">
                 <svg className="w-8 h-8 text-brand-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            </div>
            <h2 className="text-xl font-bold text-brand-light mb-2">訪客模式限制</h2>
            <p className="text-brand-muted">
                想探索更多功能嗎？<br/>請先登入或註冊帳號。
            </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-brand-primary border-2 border-brand-accent text-brand-light py-2 px-4 rounded-lg hover:bg-brand-accent/10 transition-colors font-semibold"
          >
            取消
          </button>
          <button
            onClick={handleLoginRedirect}
            className="flex-1 bg-brand-accent text-brand-primary font-bold py-2 px-4 rounded-lg hover:bg-opacity-80 transition-colors"
          >
            登入 / 註冊
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuestLimitModal;
