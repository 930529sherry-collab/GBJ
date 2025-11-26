
import {
    doc,
    getDoc,
    updateDoc,
    setDoc,
    getDocs,
    collection,
    query,
    where,
    orderBy,
    limit,
    arrayUnion,
    addDoc,
    deleteDoc,
    onSnapshot,
    writeBatch,
    increment,
    arrayRemove,
    Timestamp,
} from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { User as FirebaseUser } from 'firebase/auth';

import { db, functions, storage, auth } from '../firebase/config';
import { UserProfile, SearchableUser, FeedItem, Comment, Notification, Store, Order, JournalEntry, FriendRequest, Deal, Mission, Review, CheckInHistoryItem } from '../types';
import { WELCOME_COUPONS, MOCK_DEALS, MOCK_STORES, INITIAL_MISSIONS } from '../constants';

// ============================================================================
// 1. 核心工具 (Core Utilities)
// ============================================================================

const callFunction = async <T, R>(functionName: string, data?: T): Promise<R> => {
    try {
        const callable = httpsCallable(functions, functionName);
        const result = await callable(data);
        return result.data as R;
    } catch (error: any) {
        console.error(`Cloud Function Error [${functionName}]:`, error.message || error);
        throw error;
    }
};

const convertTimestamp = (ts: any): any => {
    if (!ts) return new Date().toISOString();
    if (typeof ts.toDate === 'function') return ts.toDate().toISOString();
    if (typeof ts === 'object' && ts !== null && 'seconds' in ts) return new Date(ts.seconds * 1000).toISOString();
    if (ts instanceof Date) return ts.toISOString();
    return String(ts);
};

export const addNotificationToUser = async (targetUid: string, message: string, type: string = '系統通知') => {
    if (!targetUid) return;
    const newNotification: Notification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type, message, timestamp: new Date().toISOString(), read: false,
    };
    try {
        const userRef = doc(db, "users", targetUid);
        await updateDoc(userRef, {
            notifications: arrayUnion(newNotification)
        });
    } catch (e) { console.error("Failed to add notification:", e); }
};

export const uploadImage = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
};


// ============================================================================
// 2. 任務系統 (Mission System)
// ============================================================================

export const getSystemMissions = async (): Promise<Mission[]> => {
    try {
        const q = query(collection(db, 'system_missions'), where('isActive', '==', true));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            console.warn("No system missions found, returning local default.");
            return INITIAL_MISSIONS;
        }
        return snapshot.docs.map(doc => doc.data() as Mission);
    } catch (e) {
        console.error("getSystemMissions failed:", e);
        return INITIAL_MISSIONS;
    }
};

// ============================================================================
// 3. 使用者資料 (User Profile)
// ============================================================================

export const getUserProfile = async (uid: string | number): Promise<UserProfile> => {
    if (!uid || String(uid) === '0') throw new Error("UID is required or invalid");
    try {
        const userDocRef = doc(db, "users", String(uid));
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
            let data = userDoc.data() || {};
            
            if (!data.missions || data.missions.length === 0) {
                console.log(`User ${uid} has no missions. Backfilling from system_missions...`);
                const systemMissions = await getSystemMissions(); 
                data.missions = systemMissions.map(m => ({
                    ...m,
                    current: 0,
                    status: 'ongoing',
                    claimed: false,
                    ...(m.id === 'special_level_5' && { current: data.level || 1 })
                }));
                
                updateDoc(userDocRef, { missions: data.missions }).catch(err => {
                    console.error("Failed to backfill missions:", err);
                });
            }

            return { 
                id: userDoc.id, 
                ...data,
                friends: data.friends || [],
                notifications: data.notifications || [],
                coupons: data.coupons || [],
                checkInHistory: data.checkInHistory || [],
                latlng: data.latlng || { lat: 25.0330, lng: 121.5654 },
            } as UserProfile;
        }
        throw new Error("User profile not found");
    } catch (error: any) { throw error; }
};

const generateRandomString = (length: number) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

const initializeNewUserProfile = (firebaseUser: FirebaseUser, displayName: string): Partial<UserProfile> => {
    const fallbackName = displayName || firebaseUser.displayName || (firebaseUser.email?.split('@')[0] || '用戶');
    const randomPart = generateRandomString(4);
    const fallbackAppId = `GUNBOOJO-${randomPart}`;
    
    return {
        id: firebaseUser.uid,
        appId: fallbackAppId,
        appId_upper: fallbackAppId.toUpperCase(),
        friendCode: fallbackAppId,
        displayName: fallbackName,
        displayName_lower: fallbackName.toLowerCase(),
        email: firebaseUser.email || "",
        avatarUrl: `https://picsum.photos/200/200?random=${firebaseUser.uid}`,
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        points: 0,
        checkIns: 0,
        latlng: { lat: 25.04, lng: 121.53 },
        friends: [],
        notifications: [],
        missions: [],
    };
};

export const createFallbackUserProfile = async (firebaseUser: FirebaseUser, displayName: string): Promise<UserProfile> => {
    const newProfile = initializeNewUserProfile(firebaseUser, displayName);
    await setDoc(doc(db, "users", firebaseUser.uid), newProfile, { merge: true });
    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
    return userDoc.data() as UserProfile;
};

export const createUserProfileInDB = async (firebaseUser: FirebaseUser, displayName: string): Promise<UserProfile> => {
    const newProfile = initializeNewUserProfile(firebaseUser, displayName);
    await setDoc(doc(db, "users", firebaseUser.uid), newProfile, { merge: true });
    const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
    return userDoc.data() as UserProfile;
};


export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
    if (!uid) return;
    await updateDoc(doc(db, "users", uid), updates);
};

export const grantWelcomePackage = async (userId: string): Promise<boolean> => {
    return false;
};

export const checkAndBackfillWelcomeNotifications = async (userId: string, profile: UserProfile): Promise<boolean> => {
    return false;
};

export const syncUserStats = async (userId: string): Promise<void> => {
    const userRef = doc(db, 'users', userId);
    const friendsSnapshot = await getDocs(collection(userRef, 'Friendlist'));
    const userProfile = await getUserProfile(userId);
    
    const friends = friendsSnapshot.docs.map(d => d.id);
    const checkIns = (userProfile.checkInHistory || []).length;
    
    await updateDoc(userRef, { friends, checkIns });
};

// ============================================================================
// 4. 店家與優惠 (Stores & Deals)
// ============================================================================

export const getStores = async (): Promise<Store[]> => {
    try {
        const snapshot = await getDocs(collection(db, "stores"));
        if (snapshot.empty) {
            console.warn("Firestore 'stores' collection is empty.");
            return [];
        }

        const storesFromDb = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Store));
        
        const uniqueStoresMap = new Map<string, Store>();
        storesFromDb.forEach(store => {
            const key = `${(store.name || '').trim().toLowerCase()}-${(store.address || '').trim().toLowerCase()}`;
            if (!uniqueStoresMap.has(key)) {
                uniqueStoresMap.set(key, store);
            }
        });
        const uniqueStores: Store[] = [...uniqueStoresMap.values()];

        const taipeiStores = uniqueStores.filter(store => store.address && store.address.includes('台北市'));
        return taipeiStores.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'));
    } catch (error) {
        console.error("Failed to fetch stores from Firestore:", error);
        return [];
    }
};

export const createStore = async (storeData: Store): Promise<void> => {
    const { id, ...data } = storeData;
    await setDoc(doc(db, 'stores', String(id)), data);
};

export const getDeals = async (): Promise<Deal[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'deals'));
        if (snapshot.empty) return MOCK_DEALS;
        const deals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Deal[];
        return deals.sort((a, b) => new Date(a.expiry).getTime() - new Date(b.expiry).getTime());
    } catch (error) {
        console.error("讀取優惠失敗:", error);
        return MOCK_DEALS;
    }
};

export const getFriends = async (userId: string): Promise<UserProfile[]> => {
    if (!userId) return [];
    try {
        const friendsRef = collection(db, 'users', userId, 'Friendlist');
        const snapshot = await getDocs(friendsRef);
        if (!snapshot.empty) {
            const friendIds = snapshot.docs.map(d => d.id);
            const friendProfiles = await Promise.all(
                friendIds.map(async (id) => {
                    try {
                        return await getUserProfile(id);
                    } catch (err) {
                        console.warn(`Failed to fetch friend profile for ${id}`, err);
                        return null;
                    }
                })
            );
            return friendProfiles.filter(Boolean) as UserProfile[];
        }
        return [];
    } catch (e) {
        console.error("Error fetching friends:", e);
        return [];
    }
};

export const searchUsers = async (query: string): Promise<SearchableUser[]> => {
    return callFunction('searchUsers', { query });
};

// ============================================================================
// 5. API Objects (userApi, feedApi, etc.)
// ============================================================================

export const userApi = {
    createPost: (currentUser: UserProfile, content: string, store: Store, imageUrl?: string, visibility?: 'public' | 'friends' | 'private'): Promise<void> => {
        const payload = {
            text: content || `在 ${store.name} 打卡！`,
            storeId: store.id,
            storeName: store.name,
            imageUrl: imageUrl || null,
            visibility: visibility || 'public',
        };
        return callFunction('createPost', payload);
    },
    sendFriendRequest: async (targetUid: string | number): Promise<void> => {
        const currentUser = auth.currentUser;
        if (!currentUser) throw new Error("AUTH_REQUIRED");
        try {
            // Use friendId as required by the backend, ensuring it maps correctly
            await callFunction('sendFriendRequest', { friendId: String(targetUid) });
        } catch (e) {
            console.warn("sendFriendRequest function failed, falling back to client-side write", e);
            const senderProfile = await getUserProfile(currentUser.uid);
            const requestDoc = {
                // Aligning with backend schema for consistency
                fromUid: currentUser.uid,
                senderUid: currentUser.uid,
                toUid: String(targetUid),
                recipientId: String(targetUid),
                from: senderProfile.displayName || senderProfile.name || '新用戶',
                senderName: senderProfile.displayName || senderProfile.name || '新用戶',
                senderAvatarUrl: senderProfile.avatarUrl,
                status: 'pending',
                timestamp: Timestamp.now(),
            };
            await addDoc(collection(db, 'friendRequests'), requestDoc);
        }
    },
    respondFriendRequest: async (requesterId: string, accept: boolean, requestId: string): Promise<void> => {
        await callFunction('respondFriendRequest', { requesterId, accept, requestId });
    },
    sendNotification: (targetUid: string, message: string, type: string) => {
        return callFunction('sendNotification', { targetUid, message, type });
    },
    triggerMissionUpdate: (type: string, data: any = {}) => {
        return callFunction('triggerMissionProgress', { type, data });
    },
    claimMissionReward: (data: { missionId: string }): Promise<{ success: boolean; leveledUp?: boolean; newLevel?: number; message?: string; }> => {
        return callFunction('claimMissionReward', data);
    },
};

export const feedApi = {
    toggleLike: async (item: FeedItem, currentUserId: string, isCurrentlyLiked: boolean): Promise<void> => {
        if (!currentUserId || !item.id) return;
        const postRef = doc(db, 'posts', String(item.id));
        try {
            if (isCurrentlyLiked) {
                await updateDoc(postRef, {
                    likedBy: arrayRemove(currentUserId),
                    likes: increment(-1)
                });
            } else {
                await updateDoc(postRef, {
                    likedBy: arrayUnion(currentUserId),
                    likes: increment(1)
                });
            }
        } catch (error) {
            console.error("按讚失敗:", error);
            throw error;
        }
    },
    addComment: async (item: FeedItem, comment: Comment): Promise<void> => {
        return callFunction('addComment', { postId: String(item.id), comment });
    },
    deletePost: async (postId: string | number): Promise<void> => {
         await deleteDoc(doc(db, 'posts', String(postId)));
    },
};

export const journalApi = {
    getJournalEntries: async (userId: string): Promise<JournalEntry[]> => {
        const q = query(collection(db, 'users', userId, 'journalEntries'), orderBy('date', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as JournalEntry));
    },
    getJournalEntry: async (userId: string, entryId: string): Promise<JournalEntry | null> => {
        const docSnap = await getDoc(doc(db, 'users', userId, 'journalEntries', entryId));
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as JournalEntry : null;
    },
    createJournalEntry: async (userId: string, entryData: Omit<JournalEntry, 'id'>): Promise<string> => {
        const docRef = await addDoc(collection(db, 'users', userId, 'journalEntries'), entryData);
        return docRef.id;
    },
    updateJournalEntry: async (userId: string, entryId: string, updates: Partial<JournalEntry>): Promise<void> => {
        await updateDoc(doc(db, 'users', userId, 'journalEntries', entryId), updates);
    },
    deleteJournalEntry: async (userId: string, entryId: string): Promise<void> => {
        await deleteDoc(doc(db, 'users', userId, 'journalEntries', entryId));
    },
};

export const chatApi = {
    sendMessage: (chatId: string, text: string, senderId: string | number, recipientId: string | number): Promise<void> => {
        return callFunction('sendMessage', { chatId, text, senderId: String(senderId), recipientId: String(recipientId) });
    },
    markChatsAsRead: (userId: string | number): Promise<void> => {
        return callFunction('markChatsAsRead', { userId: String(userId) });
    },
};

// ============================================================================
// 6. Data Fetching & Subscriptions
// ============================================================================

const mapFeedDataToItem = (docSnap: any, currentUserId: string): FeedItem => {
    const data = docSnap.data() as any;
    const likedBy = data.likedBy || [];
    return {
        id: docSnap.id,
        ...data,
        content: data.text || data.content || "",
        friendName: data.authorName || data.friendName || "用戶",
        friendAvatarUrl: data.authorAvatar || data.friendAvatarUrl || "",
        friendId: data.authorId || data.friendId,
        timestamp: convertTimestamp(data.timestamp || data.createdAt),
        likes: likedBy.length,
        isLiked: likedBy.includes(currentUserId),
        comments: (data.comments || []).map((c: any) => ({ ...c, timestamp: convertTimestamp(c.timestamp) })),
    } as FeedItem;
};

export const getUserFeed = async (userId: string): Promise<FeedItem[]> => {
    if (!userId) return [];
    try {
        const q = query(collection(db, "posts"), where("authorId", "==", userId), orderBy("timestamp", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => mapFeedDataToItem(doc, userId));
    } catch (error) {
        console.error("getUserFeed failed:", error);
        return [];
    }
};

export const subscribeToFeed = (currentUserId: string, callback: (items: FeedItem[]) => void) => {
    const q = query(collection(db, "posts"), orderBy("timestamp", "desc"), limit(50));
    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => mapFeedDataToItem(doc, currentUserId));
        callback(items);
    }, (error) => { console.error("Feed subscription error:", error); });
};

export const getNotifications = async (): Promise<Notification[]> => {
    const user = auth.currentUser;
    if (!user) return [];
    try {
        const profile = await getUserProfile(user.uid);
        return (profile.notifications || []).sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
    } catch (e) { console.error("getNotifications error", e); return []; }
};

export const addCheckInRecord = async (userId: string, storeId: string | number, storeName: string) => {
    if (!userId) return;
    const userRef = doc(db, 'users', userId);
    const newRecord = { storeId, storeName, timestamp: new Date().toISOString() };
    try {
        await updateDoc(userRef, {
            checkInHistory: arrayUnion(newRecord)
        });
    } catch (e) { console.error("Failed to add check-in record:", e); }
};

export const addReview = async (storeId: string, review: Review) => {
    if (!storeId) return;
    const storeRef = doc(db, 'stores', storeId);
    try {
        await updateDoc(storeRef, {
            reviews: arrayUnion(review)
        });
    } catch (e) { console.error("Failed to add review:", e); }
};


// @google/genai-migration-fix: Refactor `updateAllMissionProgress` to use `INITIAL_MISSIONS` and the new mission structure, fixing the `MOCK_MISSIONS is not defined` error and aligning with the rest of the application's refactored mission system.
export const updateAllMissionProgress = async (userId: string | number): Promise<void> => {
    const uid = String(userId);
    if (!uid || uid === '0') return;
    
    try {
        const userProfile = await getUserProfile(uid);
        const { checkInHistory = [], friends = [], level = 1 } = userProfile;
        const userMissions = userProfile.missions || [];

        const allStores = await getStores();
        const allFeedItems = await getUserFeed(uid);

        const updatedMissions = INITIAL_MISSIONS.map(sysMission => {
            const userMission = userMissions.find(m => m.id === sysMission.id) || { ...sysMission, current: 0, status: 'ongoing', claimed: false };
            if (userMission.claimed) return userMission;

            let progress = 0;
            switch(sysMission.id) {
                case 'daily_check_in': {
                    const todayStr = new Date().toDateString();
                    progress = allFeedItems.some(item => new Date(item.timestamp).toDateString() === todayStr) ? 1 : 0;
                    break;
                }
                case 'daily_chat': break; // Triggered elsewhere
                case 'daily_night_owl': {
                    const now = new Date();
                    progress = checkInHistory.some(c => {
                        const checkinDate = new Date(c.timestamp);
                        const h = checkinDate.getHours();
                        return checkinDate.toDateString() === now.toDateString() && (h >= 0 && h < 4);
                    }) ? 1: 0;
                    break;
                }
                case 'daily_weekend_warrior': {
                    const now = new Date();
                    progress = checkInHistory.some(c => {
                        const checkinDate = new Date(c.timestamp);
                        const d = checkinDate.getDay();
                        return checkinDate.toDateString() === now.toDateString() && (d === 0 || d === 6);
                    }) ? 1: 0;
                    break;
                }
                case 'daily_friday_fever': {
                     const now = new Date();
                     progress = checkInHistory.some(c => {
                         const checkinDate = new Date(c.timestamp);
                         const d = checkinDate.getDay();
                         return checkinDate.toDateString() === now.toDateString() && d === 5;
                     }) ? 1: 0;
                     break;
                }
                case 'daily_early_bird': {
                    const now = new Date();
                    progress = checkInHistory.some(c => {
                        const checkinDate = new Date(c.timestamp);
                        const h = checkinDate.getHours();
                        return checkinDate.toDateString() === now.toDateString() && (h >= 17 && h < 19);
                    }) ? 1: 0;
                    break;
                }
                case 'special_first_check_in':
                    progress = checkInHistory.length > 0 ? 1 : 0;
                    break;
                case 'special_first_friend':
                    progress = (friends || []).length;
                    break;
                case 'special_photo_post':
                    progress = allFeedItems.some(item => item.imageUrl) ? 1 : 0;
                    break;
                case 'special_reviewer': {
                    let reviewCount = 0;
                    allStores.forEach(s => {
                        reviewCount += (s.reviews || []).filter(r => String(r.authorId) === uid).length;
                    });
                    progress = reviewCount;
                    break;
                }
                case 'special_social_butterfly': // Complex logic, using friend count as placeholder.
                     progress = (friends || []).length;
                     break;
                case 'special_loyal_customer': {
                    const counts: { [key: string]: number } = {};
                    checkInHistory.forEach(c => { counts[c.storeName] = (counts[c.storeName] || 0) + 1; });
                    progress = Math.max(0, ...Object.values(counts));
                    break;
                }
                case 'special_explorer': {
                    const checkInsByDate: { [key: string]: Set<string> } = {};
                    checkInHistory.forEach(c => {
                        const dateKey = new Date(c.timestamp).toDateString();
                        if (!checkInsByDate[dateKey]) checkInsByDate[dateKey] = new Set();
                        checkInsByDate[dateKey].add(c.storeName);
                    });
                    progress = Math.max(0, ...Object.values(checkInsByDate).map(s => s.size));
                    break;
                }
                case 'special_popular':
                    progress = Math.max(0, ...allFeedItems.map(item => item.likes));
                    break;
                case 'special_ultimate_explorer': {
                     const uniqueStores = new Set(checkInHistory.map(c => c.storeName));
                     progress = uniqueStores.size;
                     break;
                }
                case 'special_level_5':
                    progress = level;
                    break;
            }
                     
            const newProgress = Math.max(userMission.current, progress);
            const newStatus = (newProgress >= sysMission.target) ? 'completed' : 'ongoing';

            return { ...userMission, ...sysMission, current: newProgress, status: newStatus };
        });
        
        await updateUserProfile(uid, { missions: updatedMissions });

    } catch (e) {
        console.error("Failed to update mission progress:", e);
    }
};
