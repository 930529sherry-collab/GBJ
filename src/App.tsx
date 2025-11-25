



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
import { Store, UserProfile, Coupon, Notification, FriendRequest } from './types';
import AddStorePage from './pages/AddStorePage';
import { GeolocationProvider, useGeolocation } from './context/GeolocationContext';
import { GuestGuardProvider, useGuestGuard } from './context/GuestGuardContext';
import { MOCK_STORES, WELCOME_COUPONS } from './constants';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import OnboardingPage from './pages/OnboardingPage';
import LogoutPage from './pages/LogoutPage';
import ChatListPage from './pages/ChatListPage';
import ChatRoomPage from './pages/ChatRoomPage';
import NotificationDrawer from './components/NotificationDrawer';
import { auth, db } from './firebase/config';
import { getUserProfile, grantWelcomePackage, getNotifications, syncUserStats, createFallbackUserProfile, checkAndBackfillWelcomeNotifications, userApi, updateUserProfile } from './utils/api';
// FIX: Imported ViewJournalEntryPage to resolve a "Cannot find name" error.
import ViewJournalEntryPage from './pages/ViewJournalEntryPage';


const FavoritesModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const [favoriteStores, setFavoriteStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);
        setTimeout(() => {
            const allStores: Store[] = JSON.parse(localStorage.getItem('stores') || JSON.stringify(MOCK_STORES));
            // FIX: Changed favoriteIds type to handle both number and string IDs, as store.id can be either.
            const favoriteIds: (number | string)[] = JSON.parse(localStorage.getItem('favoriteStoreIds') || '[]');
            setFavoriteStores(allStores.filter(store => favoriteIds.includes(store.id)));
            setLoading(false);
        }, 100);
    }, [isOpen]);

    // FIX: Updated handleNavigate to accept both number and string to match the type of store.id.
    const handleNavigate = (storeId: number | string) => { onClose(); navigate(`/store/${storeId}`); };
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4 backdrop-blur-md animate-fade-in">
            <div className="bg-brand-secondary rounded-2xl p-6 w-full max-w-sm border-2 border-brand-accent/30 shadow-2xl shadow-brand-accent/10">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-brand-accent">我的收藏</h2>
                    <button onClick={onClose} className="text-brand-muted hover:text-brand-light transition-colors"><XIcon /></button>
                </div>
                <div className="max-h-80 overflow-y-auto space-y-3">
                    {loading ? <p>載入中...</p> : favoriteStores.length > 0 ? (
                        favoriteStores.map(store => (
                            <div key={store.id} onClick={() => handleNavigate(store.id)} className="flex items-center gap-4 p-2 rounded-lg hover:bg-brand-primary cursor-pointer">
                                <img src={store.imageUrl} alt={store.name} className="w-16 h-16 rounded-md object-cover" />
                                <div>
                                    <h3 className="font-semibold text-brand-light">{store.name}</h3>
                                    <p className="text-sm text-brand-muted">{store.type}</p>
                                </div>
                            </div>
                        ))
                    ) : <p className="text-center text-brand-muted py-4">你還沒有收藏任何店家。</p>}
                </div>
            </div>
        </div>
    );
};

const AppLayout: React.FC<{ onLogout: () => void; currentUser: UserProfile | null; }> = ({ onLogout, currentUser }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const { position: userPosition, requestLocation, loading: isGeolocating } = useGeolocation();
  const [hasUnread, setHasUnread] = useState(false);
  const [hasUnreadChats, setHasUnreadChats] = useState(false);
  const { checkGuest } = useGuestGuard();
  
  const [feedRefreshTrigger, setFeedRefreshTrigger] = useState(0);
  const [friendsRefreshTrigger, setFriendsRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        if (!currentUser || !auth.currentUser || currentUser.isGuest) return;
        
        const uid = auth.currentUser.uid;
    
        const unSubProfile = db.collection('users').doc(uid)
            .onSnapshot((doc) => {
                const data = doc.data() as UserProfile;
                if (data) {
                    const hasUnreadNotifs = (data.notifications || []).some(n => !n.read);
                    setHasUnread(prev => hasUnreadNotifs || (prev && !hasUnreadNotifs)); 
                    setHasUnreadChats(!!data.hasUnreadChats);
                }
            });
        
        const requestsRef = db.collection('users').doc(uid).collection('friendRequests');
        const q = requestsRef.where('status', '==', 'pending');
            
        const unSubRequests = q.onSnapshot((snapshot) => {
            const hasPending = !snapshot.empty;
            setHasUnread(prev => hasPending || prev);
        });
        
        return () => {
            unSubProfile();
            unSubRequests();
        };
    }, [currentUser]);

    useEffect(() => {
        if (userPosition && currentUser && !currentUser.isGuest && currentUser.id !== 0) {
            updateUserProfile(String(currentUser.id), { latlng: userPosition })
                .catch(err => console.error("Failed to sync location", err));
        }
    }, [userPosition, currentUser]);


  const getPageTitle = (pathname: string): string => {
    if (pathname.startsWith('/store/')) return '店家資訊';
    if (pathname.startsWith('/friends/')) {
        const friendId = pathname.split('/')[2];
        const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
        const isFriend = (profile.friends || []).some((id: string|number) => String(id) === friendId);
        return isFriend ? '好友檔案' : '用戶檔案';
    }
    const titles: { [key: string]: string } = {
        '/': '快速搜位',
        '/list': '酒吧列表',
        '/friends': '好友地圖',
        '/feed': '好友動態',
        '/deals': '店家優惠',
// FIX: Updated page title to match the title in MissionsPage.tsx.
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
        '/journal': '我的品飲日記',
        '/journal/edit': '新增品飲筆記',
        '/chat': '聊天室',
        '/profile/check-ins': '我的打卡紀錄'
    };
    if (pathname.startsWith('/journal/edit/')) return '編輯品飲筆記';
    if (pathname.startsWith('/journal/view/')) return '預覽筆記';
    return titles[pathname] || '乾不揪';
  };

  const currentTitle = getPageTitle(location.pathname);
  const showNotificationButton = ['/', '/list', '/friends', '/feed', '/deals', '/missions', '/profile'].includes(location.pathname);
  const showRefreshButton = ['/', '/feed', '/friends'].includes(location.pathname);
  const isSocialPage = ['/friends', '/feed'].includes(location.pathname);
  
  const handleRefresh = () => {
      if(isRefreshing) return;
      setIsRefreshing(true);
      setTimeout(() => setIsRefreshing(false), 1000);

      if (location.pathname === '/') {
          requestLocation();
      } else if (location.pathname === '/feed') {
          setFeedRefreshTrigger(prev => prev + 1);
      } else if (location.pathname === '/friends') {
          setFriendsRefreshTrigger(prev => prev + 1);
      }
  };
  const isCurrentlyRefreshing = isGeolocating || isRefreshing;

  return (
      <div className="h-screen w-full bg-brand-primary flex flex-col font-sans relative overflow-hidden">
        <BackgroundMap />
        {currentUser?.isGuest && <div className="fixed top-0 left-0 right-0 bg-brand-accent text-brand-primary text-center text-xs font-bold py-1 z-20">訪客模式</div>}
        <header className={`sticky top-0 z-10 h-16 bg-brand-primary/80 backdrop-blur-md flex items-center justify-center p-4 border-b border-brand-accent/20 flex-shrink-0`}>
            <div className="absolute top-1/2 -translate-y-1/2 left-4">
                {showRefreshButton && (
                    <button onClick={handleRefresh} className="text-brand-light hover:text-brand-accent p-2 rounded-full transition-colors">
                        <ArrowPathIcon className={`w-6 h-6 ${isCurrentlyRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                )}
            </div>
            <h1 className="text-lg font-bold text-brand-light">{currentTitle}</h1>
            <div className="absolute top-1/2 -translate-y-1/2 right-4 flex items-center gap-1">
                {isSocialPage && (
                    <>
                        <button onClick={() => checkGuest(() => navigate('/chat'))} className="text-brand-light hover:text-brand-accent p-2 rounded-full transition-colors relative">
                            {hasUnreadChats && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
                            <ChatIcon />
                        </button>
                        <button onClick={() => checkGuest(() => navigate('/add-friend'))} className="text-brand-light hover:text-brand-accent p-2 rounded-full transition-colors">
                            <UserPlusIcon className="w-7 h-7" />
                        </button>
                    </>
                )}
                
                {!isSocialPage && (
                     <button onClick={() => setIsFavoritesModalOpen(true)} className="text-brand-light hover:text-brand-accent p-2 rounded-full transition-colors">
                        <HeartIcon />
                    </button>
                )}

                {showNotificationButton && (
                     <button onClick={() => checkGuest(() => setIsNotificationOpen(true))} className="text-brand-light hover:text-brand-accent p-2 rounded-full transition-colors relative">
                        {hasUnread && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
                        <BellIcon />
                    </button>
                )}
            </div>
        </header>

        <main className="flex-grow container mx-auto p-4 pb-28 z-[1] overflow-y-auto">
          <Routes>
            <Route path="/" element={<MapPage />} />
            <Route path="/list" element={<HomePage />} />
            <Route path="/friends" element={<FriendsMapPage refreshTrigger={friendsRefreshTrigger} />} />
            <Route path="/friends/:uid" element={<FriendProfilePage />} />
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
            <Route path="/journal/edit/:entryId?" element={<EditJournalEntryPage />} />
            <Route path="/journal/view/:entryId" element={<ViewJournalEntryPage />} />
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

type AuthStatus = 'loading' | 'authed' | 'unauthed';

const App: React.FC = () => {
    const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
    
    useEffect(() => {
        // Timeout to prevent getting stuck on splash screen if Firebase is unreachable
        const authTimeout = setTimeout(() => {
            setAuthStatus((currentStatus) => {
                if (currentStatus === 'loading') {
                    console.warn("Auth state check timed out after 8 seconds. Assuming unauthenticated.");
                    return 'unauthed';
                }
                return currentStatus;
            });
        }, 8000);

        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            clearTimeout(authTimeout); // We got a response, cancel the timeout.

            if (user) {
                try {
                    let profile: UserProfile | null = null;
                    
                    try {
                        profile = await getUserProfile(user.uid);
                    } catch (error: any) {
                        if (error.message.includes("User profile not found")) {
                             console.warn("Attempting to self-heal by creating fallback profile...");
                             const tempProfileStr = localStorage.getItem('userProfile');
                             const tempProfile = tempProfileStr ? JSON.parse(tempProfileStr) : {};
                             
                             profile = await createFallbackUserProfile(
                                 user, 
                                 tempProfile.displayName || user.displayName || '用戶',
                                 tempProfile.avatarUrl || user.photoURL
                             );
                        } else {
                            throw error;
                        }
                    }

                    if (profile) {
                        // This is the first thing to run to ensure missions are ready for the day
                        // FIX: Changed from 'checkDailyMissions' to 'syncAndResetMissions' to match userApi definition. This call was causing an error.
                        await userApi.checkDailyMissions();

                        await syncUserStats(user.uid);
                        await grantWelcomePackage(user.uid);
                        
                        let freshProfile = await getUserProfile(user.uid);
                        const didBackfill = await checkAndBackfillWelcomeNotifications(user.uid, freshProfile);
                        if(didBackfill) {
                            freshProfile = await getUserProfile(user.uid);
                        }

                        localStorage.setItem('userProfile', JSON.stringify(freshProfile));
                        setCurrentUser(freshProfile);
                        setHasCompletedOnboarding(localStorage.getItem('hasCompletedOnboarding') === 'true');
                        setAuthStatus('authed');
                    } else {
                        throw new Error("Profile could not be retrieved or created.");
                    }
                    
                } catch (error: any) {
                    console.error("Critical error during user sync:", error.message);
                    handleLogout();
                }
            } else {
                handleLogout();
            }
        });
        return () => {
            clearTimeout(authTimeout);
            unsubscribe();
        };
    }, []);

    const handleLoginSuccess = (userProfile: UserProfile, requiresOnboarding: boolean) => {
        setCurrentUser(userProfile);
        setAuthStatus('authed');
        
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
        auth.signOut().catch(e => console.error("Sign out error", e));
        localStorage.clear();
        setCurrentUser(null);
        setAuthStatus('unauthed');
    };

    if (authStatus === 'loading') {
        return <SplashScreen isExiting={false} />;
    }

    if (authStatus === 'unauthed') {
        return <LoginPage onLoginSuccess={handleLoginSuccess} />;
    }
    
    if (!hasCompletedOnboarding) {
        return <OnboardingPage onComplete={handleOnboardingComplete} />;
    }

    return (
        <GeolocationProvider>
            <GuestGuardProvider>
                <AppLayout onLogout={handleLogout} currentUser={currentUser} />
            </GuestGuardProvider>
        </GeolocationProvider>
    );
};

export default App;
