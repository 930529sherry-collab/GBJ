
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
import EditJournalEntryPage from './pages/EditJournalEntryPage';
import CheckInHistoryPage from './pages/CheckInHistoryPage';
import { UserPlusIcon } from './components/icons/NavIcons';
import { HeartIcon, XIcon, ArrowPathIcon, ChatIcon, BellIcon } from './components/icons/ActionIcons';
import { Store, UserProfile, Coupon, Notification } from './types';
import AddStorePage from './pages/AddStorePage';
import { GeolocationProvider, useGeolocation } from './context/GeolocationContext';
import { GuestGuardProvider, useGuestGuard } from './context/GuestGuardContext';
import { MOCK_STORES, MOCK_USERS, WELCOME_COUPONS } from './constants';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import LogoutPage from './pages/LogoutPage';
import ChatListPage from './pages/ChatListPage';
import ChatRoomPage from './pages/ChatRoomPage';
import NotificationDrawer from './components/NotificationDrawer';
import { auth, db } from './firebase/config';
import { getUserProfile, grantWelcomePackage, getNotifications, syncUserStats, checkAndBackfillCouponNotification, createFallbackUserProfile, checkAndBackfillWelcomeNotifications } from './utils/api';

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
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4 backdrop-blur-md animate-fade-in">
            <div className="bg-brand-secondary rounded-2xl p-6 w-full max-w-sm border-2 border-brand-accent/30 shadow-2xl shadow-brand-accent/10 flex flex-col max-h-[80vh]">
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
  const navigate = useNavigate();
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const { requestLocation, loading: isGeolocating } = useGeolocation();
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [hasPendingRequests, setHasPendingRequests] = useState(false);
  const [hasUnreadChats, setHasUnreadChats] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const { checkGuest } = useGuestGuard();
  
  // Refresh Triggers for pages
  const [feedRefreshTrigger, setFeedRefreshTrigger] = useState(0);
  const [friendsRefreshTrigger, setFriendsRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Real-time listener for friend requests to control red dot
  useEffect(() => {
    if (auth.currentUser) {
        const requestsRef = db.collection('receivedFriendRequests');
        const q = requestsRef.where('toUid', '==', auth.currentUser.uid).where('status', '==', 'pending');
        const unsubscribe = q.onSnapshot((snapshot) => {
            setHasPendingRequests(!snapshot.empty);
        }, (error) => {
            console.error("Friend request listener error:", error);
        });
        return () => unsubscribe();
    }
  }, [auth.currentUser]);

  useEffect(() => {
    // Check for unread notifications on mount and when location changes
    const checkUnread = () => {
        const profileData = localStorage.getItem('userProfile');
        if (profileData) {
            const profile: UserProfile = JSON.parse(profileData);
            
            // Check general notifications
            const unreadNotif = profile.notifications?.some(n => !n.read);
            setHasUnreadNotifications(!!unreadNotif);
            
            // Check for unread chats
            setHasUnreadChats(!!profile.hasUnreadChats);
            
            // Check if guest
            setIsGuest(!!profile.isGuest || profile.id === 0);
        }
    };

    checkUnread();
    
    // Polling for local changes (e.g. caused by user actions in other tabs/components)
    const localInterval = setInterval(checkUnread, 2000);

    return () => {
        clearInterval(localInterval);
    };

  }, [location]);

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
    '/profile/check-ins': '打卡紀錄',
    '/add-friend': '新增好友',
    '/friends-list': '我的好友',
    '/redeem': '積分兌換',
    '/coupons': '我的優惠券',
    '/add-store': '新增酒吧',
    '/journal': '我的品飲筆記',
    '/journal/edit': '編輯筆記',
    '/chat': '聊天室',
    '/logout': '登出',
  };

  const getPageTitle = (pathname: string): string => {
    if (/^\/friends\/.+$/.test(pathname)) {
        try {
            const profileData = localStorage.getItem('userProfile');
            if (profileData) {
                const profile = JSON.parse(profileData);
                const viewedId = pathname.split('/').pop();
                const isFriend = (profile.friends || []).some((fid: any) => String(fid) === String(viewedId));
                return isFriend ? '好友檔案' : '用戶檔案';
            }
        } catch (e) {
            // Ignore parse errors
        }
        return '用戶檔案';
    }
    if (/^\/store\/\d+$/.test(pathname)) {
        return '店家資訊';
    }
    if (/^\/chat\/.+$/.test(pathname)) {
        return '聊天室';
    }
    if (/^\/journal\/edit/.test(pathname)) {
        return '編輯筆記';
    }
    return pageTitles[pathname] || '乾不揪';
  };

  const currentTitle = getPageTitle(location.pathname);
  
  // Pages where the notification bell should appear
  const showNotificationButton = ['/', '/list', '/friends', '/feed', '/deals', '/missions', '/profile'].includes(location.pathname);

  // Pages where the refresh button should appear
  const showRefreshButton = ['/', '/feed', '/friends'].includes(location.pathname);
  
  const handleRefresh = () => {
        setIsRefreshing(true);
        switch (location.pathname) {
            case '/':
                requestLocation();
                break;
            case '/feed':
                setFeedRefreshTrigger(prev => prev + 1);
                break;
            case '/friends':
                setFriendsRefreshTrigger(prev => prev + 1);
                break;
        }
        // Give visual feedback for a short period
        setTimeout(() => setIsRefreshing(false), 1000);
  };
  
  const isCurrentlyRefreshing = isGeolocating || isRefreshing;


  return (
      <div className="min-h-screen w-full bg-brand-primary flex flex-col font-sans relative">
        <BackgroundMap />
        
        {isGuest && (
            <div className="bg-brand-accent text-brand-primary text-center text-xs font-bold py-1 px-2 z-50 sticky top-0">
                訪客模式 (僅供預覽) - <Link to="/logout" className="underline hover:text-white/80">立即註冊</Link> 以解鎖完整功能
            </div>
        )}
        
        <header className={`bg-brand-secondary/80 backdrop-blur-sm sticky ${isGuest ? 'top-6' : 'top-0'} z-10 text-center p-4 shadow-lg shadow-brand-accent/10 relative`}>
          
          {/* Left Actions (Refresh) */}
          <div className="absolute top-1/2 -translate-y-1/2 left-4 flex items-center gap-2">
              {showRefreshButton && (
                 <button
                    onClick={handleRefresh}
                    className="text-brand-light p-1.5 rounded-full hover:bg-brand-button-bg transition-colors disabled:opacity-75 disabled:cursor-wait"
                    aria-label="重新整理"
                    disabled={isCurrentlyRefreshing}
                >
                    <ArrowPathIcon className={`w-7 h-7 ${ isCurrentlyRefreshing ? 'animate-spin' : ''}`} />
                </button>
              )}
          </div>

          <h1 className="text-xl font-bold text-brand-accent tracking-wider">{currentTitle}</h1>
          
          {/* Right Actions */}
          <div className="absolute top-1/2 -translate-y-1/2 right-4 flex items-center gap-2">
              {location.pathname === '/' && (
                    <button
                        onClick={() => setIsFavoritesModalOpen(true)}
                        className="text-red-500 p-1.5 rounded-full hover:bg-brand-button-bg transition-colors"
                        aria-label="查看收藏店家"
                    >
                        <HeartIcon className="w-7 h-7" filled />
                    </button>
              )}
              
              {(location.pathname === '/feed' || location.pathname === '/friends') && (
                  <button 
                        onClick={() => checkGuest(() => navigate('/chat'))}
                        className="text-brand-accent hover:text-brand-light transition-colors p-1.5 relative" 
                        aria-label="Chat"
                    >
                      <ChatIcon className="w-7 h-7" />
                      {hasUnreadChats && (
                          <span className="absolute top-1 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-brand-secondary"></span>
                      )}
                    </button>
              )}

              {location.pathname === '/feed' && (
                    <button 
                        onClick={() => checkGuest(() => navigate('/add-friend'))} 
                        className="text-brand-accent hover:text-brand-light transition-colors" 
                        aria-label="Add Friend"
                    >
                        <UserPlusIcon className="w-7 h-7" />
                    </button>
              )}

              {showNotificationButton && (
                   <button 
                        onClick={() => setIsNotificationOpen(true)}
                        className="text-brand-accent hover:text-brand-light transition-colors p-1.5 relative" 
                        aria-label="Notifications"
                   >
                      <BellIcon className="w-7 h-7" />
                      {(hasUnreadNotifications || hasPendingRequests) && (
                          <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-brand-secondary"></span>
                      )}
                   </button>
              )}
          </div>
        </header>

        <main className="flex-grow container mx-auto p-4 pb-28 z-[1]">
          <Routes>
            <Route path="/" element={<MapPage />} />
            <Route path="/list" element={<HomePage />} />
            <Route path="/map" element={<Navigate to="/" replace />} />
            <Route path="/friends" element={<FriendsMapPage refreshTrigger={friendsRefreshTrigger} />} />
            <Route path="/friends/:id" element={<FriendProfilePage />} />
            <Route path="/feed" element={<FeedPage refreshTrigger={feedRefreshTrigger} />} />
            <Route path="/deals" element={<DealsPage />} />
            <Route path="/missions" element={<MissionsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/profile/edit" element={<EditProfilePage />} />
            <Route path="/profile/privacy" element={<PrivacySettingsPage />} />
            <Route path="/profile/notifications" element={<NotificationSettingsPage />} />
            <Route path="/profile/check-ins" element={<CheckInHistoryPage />} />
            <Route path="/add-friend" element={<AddFriendPage />} />
            <Route path="/friends-list" element={<FriendsListPage />} />
            <Route path="/redeem" element={<RedeemPage />} />
            <Route path="/coupons" element={<CouponsPage />} />
            <Route path="/store/:id" element={<StoreDetailPage />} />
            <Route path="/add-store" element={<AddStorePage />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/journal/edit" element={<EditJournalEntryPage />} />
            <Route path="/journal/edit/:entryId" element={<EditJournalEntryPage />} />
            <Route path="/chat" element={<ChatListPage />} />
            <Route path="/chat/:friendId" element={<ChatRoomPage />} />
            <Route path="/logout" element={<LogoutPage onLogout={onLogout} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        
        <BottomNav />
        <FavoritesModal isOpen={isFavoritesModalOpen} onClose={() => setIsFavoritesModalOpen(false)} />
        <NotificationDrawer isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />
      </div>
  );
};

const App: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => localStorage.getItem('isAuthenticated') === 'true');
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(() => localStorage.getItem('hasCompletedOnboarding') === 'true');
    
    // Always show splash on initial load
    const [showSplash, setShowSplash] = useState<boolean>(true);
    const [isExitingSplash, setIsExitingSplash] = useState(false);

    useEffect(() => {
        let splashTimer: ReturnType<typeof setTimeout>;
        
        if (showSplash) {
            // Reset exit state if splash is triggered again
            setIsExitingSplash(false);
            
            splashTimer = setTimeout(() => {
                setIsExitingSplash(true);
                const exitTimer = setTimeout(() => {
                    setShowSplash(false);
                }, 500); 
                return () => clearTimeout(exitTimer);
            }, 3000); 
        }

        return () => {
            if (splashTimer) clearTimeout(splashTimer);
        };
    }, [showSplash]);

    // Listen for Firebase Auth changes
    useEffect(() => {
        if (auth) {
            const unsubscribe = auth.onAuthStateChanged(async (user) => {
                if (user) {
                    try {
                        let profile: UserProfile;
                        try {
                            profile = await getUserProfile(user.uid);
                        } catch (err: any) {
                            // Auto-heal: Create profile if it's missing for an auth user
                            if (err.message === "User profile not found") {
                                console.warn("User profile not found in DB, attempting recovery...");
                                
                                // 1. Check Local Storage for recent registration data
                                const cached = localStorage.getItem('userProfile');
                                let fallbackName = user.displayName || '用戶';
                                let fallbackPhoto = user.photoURL;

                                if (cached) {
                                    try {
                                        const cp = JSON.parse(cached);
                                        // Only use cached if ID matches (avoids guest/wrong user pollution)
                                        if (String(cp.id) === String(user.uid)) {
                                            console.log("Recovering profile data from local storage cache.");
                                            fallbackName = cp.name || fallbackName;
                                            fallbackPhoto = cp.avatarUrl || fallbackPhoto;
                                        }
                                    } catch (parseErr) {
                                        console.warn("Failed to parse local profile for recovery", parseErr);
                                    }
                                }

                                // 2. Create Fallback with best available data
                                profile = await createFallbackUserProfile(user, fallbackName, fallbackPhoto || undefined);
                            } else {
                                throw err;
                            }
                        }
                        
                        // Clean up ghost data (Sync check-ins and friends)
                        await syncUserStats(user.uid);
                        
                        // Reload profile after sync to get fresh stats
                        profile = await getUserProfile(user.uid);

                        // Check if user needs retro-active welcome gift
                        // Step 1: Grant Rewards (only happens once)
                        const granted = await grantWelcomePackage(user.uid);
                        if (granted) {
                            console.log("Retroactive welcome gift granted!");
                            
                            // Inject 3 Welcome Coupons into localStorage using CONSTANT
                            const existingCoupons = JSON.parse(localStorage.getItem('userCoupons') || '[]');
                            const uniqueNewCoupons = WELCOME_COUPONS.filter(newC => 
                                !existingCoupons.some((existingC: Coupon) => existingC.title === newC.title)
                            );
                            localStorage.setItem('userCoupons', JSON.stringify([...uniqueNewCoupons, ...existingCoupons]));
                            
                            // Force refresh profile to get new points/flag
                            profile = await getUserProfile(user.uid);
                        }
                        
                        // Step 2: ALWAYS Check & Backfill Notifications
                        const backfilled = await checkAndBackfillWelcomeNotifications(user.uid, profile);
                        if (backfilled) {
                             console.log("Backfilled missing welcome notifications");
                             // Fetch one last time to ensure local storage has the new notifications
                             profile = await getUserProfile(user.uid);
                        }
                        
                        // Save to localStorage
                        localStorage.setItem('userProfile', JSON.stringify(profile));
                        localStorage.setItem('isAuthenticated', 'true');
                        setIsAuthenticated(true);
                        
                    } catch (error) {
                        console.error("Error syncing user data:", error);
                    }
                } else {
                    // User logged out
                    setIsAuthenticated(false);
                    localStorage.removeItem('userProfile');
                    localStorage.removeItem('isAuthenticated');
                }
            });
            return () => unsubscribe();
        }
    }, []);

    const handleLoginSuccess = (userProfile: UserProfile, requiresOnboarding: boolean) => {
        setIsAuthenticated(true);
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userProfile', JSON.stringify(userProfile));
        
        if (requiresOnboarding) {
            setHasCompletedOnboarding(false);
            localStorage.removeItem('hasCompletedOnboarding');
        } else {
            setHasCompletedOnboarding(true);
            localStorage.setItem('hasCompletedOnboarding', 'true');
        }
    };

    const handleOnboardingComplete = () => {
        setHasCompletedOnboarding(true);
        localStorage.setItem('hasCompletedOnboarding', 'true');
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setHasCompletedOnboarding(false);
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('hasCompletedOnboarding');
        localStorage.removeItem('userProfile');
        localStorage.removeItem('userCoupons');
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
            <GuestGuardProvider>
                <AppLayout onLogout={handleLogout} />
            </GuestGuardProvider>
        </GeolocationProvider>
    );
};

export default App;
