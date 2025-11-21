
import React, { createContext, useContext, useState, ReactNode } from 'react';
import GuestLimitModal from '../components/GuestLimitModal';

interface GuestGuardContextType {
  checkGuest: (callback: () => void) => void;
}

const GuestGuardContext = createContext<GuestGuardContextType | undefined>(undefined);

export const GuestGuardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const checkGuest = (callback: () => void) => {
    const profileData = localStorage.getItem('userProfile');
    if (profileData) {
        const profile = JSON.parse(profileData);
        // Check if user is guest (id 0 or isGuest flag)
        if (profile.id === 0 || profile.id === '0' || profile.isGuest) {
            setIsModalOpen(true);
            return;
        }
    }
    // If not guest (or no profile found which implies auth flow handles it, but safely run callback)
    callback();
  };

  return (
    <GuestGuardContext.Provider value={{ checkGuest }}>
      {children}
      <GuestLimitModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </GuestGuardContext.Provider>
  );
};

export const useGuestGuard = (): GuestGuardContextType => {
  const context = useContext(GuestGuardContext);
  if (!context) {
    throw new Error('useGuestGuard must be used within a GuestGuardProvider');
  }
  return context;
};
