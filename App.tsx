
import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Link, Navigate, useNavigate } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import MapPage from './pages/MapPage';
import FriendsMapPage from './pages/FriendsMapPage';
import DealsPage from './pages/DealsPage';
import MissionsPage from './pages/MissionsPage';
import ProfilePage from './pages/ProfilePage';
import BackgroundMap from './components/BackgroundMap';
import FeedPage from './pages/FeedPage';
import SplashScreen from './components/SplashScreen';
import OrdersPage from './pages/OrdersPage';
import EditProfilePage from './pages/EditProfilePage';
import PrivacySettingsPage from './pages/PrivacySettingsPage';
import NotificationSettingsPage from './pages/NotificationSettingsPage';
import FriendProfilePage from './pages/FriendProfilePage';
import AddFriendPage from './pages/AddFriendPage';
import FriendsListPage from './pages/FriendsListPage';
import RedeemPage from './pages/RedeemPage';
import CouponsPage from './pages/CouponsPage';
import StoreDetailPage from './pages/StoreDetailPage';
import JournalPage from './pages/JournalPage';
import { UserPlusIcon } from './components/icons/NavIcons';
import { HeartIcon, XIcon, ArrowPathIcon } from './components/icons/ActionIcons';
import { Store, UserProfile } from './types';
import AddStorePage from './pages/AddStorePage';
import { GeolocationProvider, useGeolocation } from './context/GeolocationContext';
import { MOCK_STORES, MOCK_USERS } from './constants';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import LogoutPage from './pages/LogoutPage';

const FavoritesModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const [favoriteStores, setFavoriteStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isOpen) return;

        setLoading(true);
        setTimeout(() => {
            const savedStores = localStorage.getItem('stores');
            const allStores: Store[] = savedStores ? JSON.parse(savedStores) : MOCK_STORES;
            const favoriteIds: number[] = JSON.parse(localStorage.getItem('favoriteStoreIds') || '[]');
            const favorites = allStores.filter(store => favoriteIds.includes(store.id));
            setFavoriteStores(favorites);
            setLoading(false);
        }, 100);

    }, [isOpen]);

    const handleNavigate = (storeId: number) => {
        onClose();
        navigate(`/store/${storeId}`);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-brand-secondary rounded-2xl p-6 w-full max-w-md border-2 border-brand-accent/30 shadow-2xl shadow-brand-accent/10 flex flex-col max-h-[80vh]">
                <div className="flex justify-between items-center mb-4 flex-shrink-0">
                    <h2 className="text-xl font-bold text-brand-accent">我的收藏</h2>
                    <button onClick={onClose} className="text-brand-muted hover:text-brand-light">
                        <XIcon />
                    </button>
                </div>
                <div className="flex-grow overflow-y-auto pr-2">
                    {loading ? (
                        <p className="text-center text-brand-muted py-10">讀取中...</p>
                    ) : favoriteStores.length > 0 ? (
                        <div className="space-y-3">
                            {favoriteStores.map(store => (
                                <div
                                    key={store.id}
                                    onClick={() => handleNavigate(store.id)}
                                    className="flex items-center gap-4 p-3 bg-brand-primary rounded-lg cursor-pointer hover:bg-brand-accent/10 border border-brand-accent/20"
                                >
                                    <img src={store.imageUrl} alt={store.name} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
                                    <div className="flex-grow">
                                        <h3 className="font-bold text-brand-light">{store.name}</h3>
                                        <p className="text-sm text-brand-muted">{store.type}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-brand-muted mb-4">您還沒有收藏任何店家。</p>
                            <button onClick={() => { onClose(); navigate('/'); }} className="bg-brand-accent text-brand-primary font-bold py-2 px-6 rounded-lg hover:bg-opacity-80">
                                去探索
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const AppLayout: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const location = useLocation();
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const { requestLocation, loading: isGeolocating } = useGeolocation();
  
  useEffect(() => {
    // Ensure we have the full user list for friend features.
    if (!localStorage.getItem('users')) {
        localStorage.setItem('users', JSON.stringify(MOCK_USERS));
    }
  }, []);

  const pageTitles: { [key: string]: string } = {
    '/': '快速搜位',
    '/list': '酒吧列表',
    '/friends': '好友地圖',
    '/feed': '好友動態',
    '/deals': '店家優惠',
    '/missions': '喝酒任務',
    '/profile': '個人檔案',
    '/orders': '我的訂單',
    '/profile/edit': '編輯個人檔案',
    '/profile/privacy': '隱私設定',
    '/profile/notifications': '通知設定',
    '/add-friend': '新增好友',
    '/friends-list': '我的好友',
    '/redeem': '積分兌換',
    '/coupons': '我的優惠券',
    '/add-store': '新增酒吧',
    '/journal': '我的品飲筆記',
    '/logout': '登出',
  };

  const getPageTitle = (pathname: string): string => {
    if (/^\/friends\/\d+$/.test(pathname)) {
        return '好友檔案';
    }
    if (/^\/store\/\d+$/.test(pathname)) {
        return '店家資訊';
    }
    return pageTitles[pathname] || '乾不揪';
  };

  const currentTitle = getPageTitle(location.pathname);

  return (
      <div className="min-h-screen w-full bg-brand-primary flex flex-col font-sans relative">
        <BackgroundMap />
        
        <header className="bg-brand-secondary/80 backdrop-blur-sm sticky top-0 z-10 text-center p-4 shadow-lg shadow-brand-accent/10 relative">
          <h1 className="text-xl font-bold text-brand-accent tracking-wider">{currentTitle}</h1>
          {location.pathname === '/' && (
            <div className="absolute top-1/2 -translate-y-1/2 right-4 flex items-center gap-2">
                <button
                    onClick={requestLocation}
                    className="text-brand-light p-1.5 rounded-full hover:bg-brand-button-bg transition-colors disabled:opacity-75 disabled:cursor-wait"
                    aria-label="刷新定位"
                    disabled={isGeolocating}
                >
                    {isGeolocating ? (
                        <ArrowPathIcon className="w-7 h-7 animate-spin" />
                    ) : (
                        <ArrowPathIcon className="w-7 h-7" />
                    )}
                </button>
                <button
                    onClick={() => setIsFavoritesModalOpen(true)}
                    className="text-red-500 p-1.5 rounded-full hover:bg-brand-button-bg transition-colors"
                    aria-label="查看收藏店家"
                >
                    <HeartIcon className="w-7 h-7" filled />
                </button>
            </div>
          )}
          {location.pathname === '/feed' && (
              <Link to="/add-friend" className="absolute top-1/2 -translate-y-1/2 right-4 text-brand-accent hover:text-brand-light transition-colors" aria-label="Add Friend">
                  <UserPlusIcon className="w-7 h-7" />
              </Link>
          )}
        </header>

        <main className="flex-grow container mx-auto p-4 pb-24 z-[1]">
          <Routes>
            <Route path="/" element={<MapPage />} />
            <Route path="/list" element={<HomePage />} />
            <Route path="/map" element={<Navigate to="/" replace />} />
            <Route path="/friends" element={<FriendsMapPage />} />
            <Route path="/friends/:id" element={<FriendProfilePage />} />
            <Route path="/feed" element={<FeedPage />} />
            <Route path="/deals" element={<DealsPage />} />
            <Route path="/missions" element={<MissionsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/profile/edit" element={<EditProfilePage />} />
            <Route path="/profile/privacy" element={<PrivacySettingsPage />} />
            <Route path="/profile/notifications" element={<NotificationSettingsPage />} />
            <Route path="/add-friend" element={<AddFriendPage />} />
            <Route path="/friends-list" element={<FriendsListPage />} />
            <Route path="/redeem" element={<RedeemPage />} />
            <Route path="/coupons" element={<CouponsPage />} />
            <Route path="/store/:id" element={<StoreDetailPage />} />
            <Route path="/add-store" element={<AddStorePage />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/logout" element={<LogoutPage onLogout={onLogout} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        
        <BottomNav />
        <FavoritesModal isOpen={isFavoritesModalOpen} onClose={() => setIsFavoritesModalOpen(false)} />
      </div>
  );
};

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => localStorage.getItem('isAuthenticated') === 'true');
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(() => localStorage.getItem('hasCompletedOnboarding') === 'true');
    const [showSplash, setShowSplash] = useState(true);
    const [isExitingSplash, setIsExitingSplash] = useState(false);

    useEffect(() => {
        const splashTimer = setTimeout(() => {
            setIsExitingSplash(true);
            const exitTimer = setTimeout(() => {
                setShowSplash(false);
            }, 500); // Corresponds to fade-out animation duration
            return () => clearTimeout(exitTimer);
        }, 3000); // Splash screen duration

        return () => clearTimeout(splashTimer);
    }, []);

    const handleLoginSuccess = (userProfile: UserProfile) => {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        setIsAuthenticated(true);
    };

    const handleOnboardingComplete = () => {
        localStorage.setItem('hasCompletedOnboarding', 'true');
        setHasCompletedOnboarding(true);
    };

    const handleLogout = () => {
        // The LogoutPage component handles clearing localStorage.
        // This function just updates the app's state.
        setIsAuthenticated(false);
    };

    if (showSplash) {
        return <SplashScreen isExiting={isExitingSplash} />;
    }

    if (!isAuthenticated) {
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }


    if (!hasCompletedOnboarding) {
        return <OnboardingPage onComplete={handleOnboardingComplete} />;
    }

    return (
        <GeolocationProvider>
            <AppLayout onLogout={handleLogout} />
        </GeolocationProvider>
    );
}

export default App;
