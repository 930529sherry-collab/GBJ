
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import { db, auth, functions, storage } from '../firebase/config';
import { UserProfile, SearchableUser, FeedItem, Comment, Notification, Store, Order, JournalEntry, FriendRequest, Deal, Mission, Review } from '../types';
import { WELCOME_COUPONS, MOCK_DEALS, MISSIONS_FOR_IMPORT, INITIAL_MISSIONS, MOCK_STORES } from '../constants';

// ============================================================================
// 1. 核心工具 (Core Utilities)
// ============================================================================

const callFunction = async <T, R>(functionName: string, data?: T): Promise<R> => {
    try {
        // @-fix: Use compat syntax for httpsCallable.
        const callable = functions.httpsCallable(functionName);
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
        // @-fix: Use compat syntax for firestore.
        const userRef = db.collection("users").doc(targetUid);
        await userRef.update({
            notifications: firebase.firestore.FieldValue.arrayUnion(newNotification)
        });
    } catch (e) { console.error("Failed to add notification:", e); }
};

export const uploadImage = async (file: File, path: string): Promise<string> => {
    // @-fix: Use compat syntax for storage.
    const storageRef = storage.ref(path);
    const snapshot = await storageRef.put(file);
    return await snapshot.ref.getDownloadURL();
};


// ============================================================================
// 2. 任務系統 (Mission System)
// ============================================================================

export const getSystemMissions = async (): Promise<Mission[]> => {
    try {
        // @-fix: Use compat syntax for firestore query.
        const q = db.collection('system_missions').where('isActive', '==', true);
        const snapshot = await q.get();
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
        // @-fix: Use compat syntax for firestore.
        const userDocRef = db.collection("users").doc(String(uid));
        const userDoc = await userDocRef.get();
        if (userDoc.exists) {
            let data = userDoc.data() || {};
            
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

// @-fix: Use compat firebase.User type.
const initializeNewUserProfile = (firebaseUser: firebase.User, displayName: string): Partial<UserProfile> => {
    const fallbackName = displayName || firebaseUser.displayName || (firebaseUser.email?.split('@')[0] || '用戶');
    const randomPart = generateRandomString(4);
    const fallbackAppId = `GUNBOOJO-${randomPart}`;
    
    return {
        id: firebaseUser.uid,
        appId: fallbackAppId,
        appId_upper: fallbackAppId.toUpperCase(),
        friendCode: fallbackAppId, // For backwards compatibility if needed
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
        missions: [], // Missions will be populated by the backend now.
    };
};

// @-fix: Use compat firebase.User type.
export const createFallbackUserProfile = async (firebaseUser: firebase.User, displayName: string): Promise<UserProfile> => {
    const newProfile = initializeNewUserProfile(firebaseUser, displayName);
    // @-fix: Use compat syntax for firestore.
    await db.collection("users").doc(firebaseUser.uid).set(newProfile, { merge: true });
    const userDoc = await db.collection("users").doc(firebaseUser.uid).get();
    return userDoc.data() as UserProfile;
};

// @-fix: Use compat firebase.User type.
export const createUserProfileInDB = async (firebaseUser: firebase.User, displayName: string): Promise<UserProfile> => {
    const newProfile = initializeNewUserProfile(firebaseUser, displayName);
    // @-fix: Use compat syntax for firestore.
    await db.collection("users").doc(firebaseUser.uid).set(newProfile, { merge: true });
    const userDoc = await db.collection("users").doc(firebaseUser.uid).get();
    return userDoc.data() as UserProfile;
};


export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
    if (!uid) return;
    // @-fix: Use compat syntax for firestore.
    await db.collection("users").doc(uid).update(updates);
};

export const grantWelcomePackage = async (userId: string): Promise<boolean> => {
    // This is now handled by the backend `createUser` function.
    // This function can be kept for manual triggers or deprecated.
    return false;
};

export const checkAndBackfillWelcomeNotifications = async (userId: string, profile: UserProfile): Promise<boolean> => {
    // This is now handled by the backend `createUser` function.
    // This function can be kept for manual triggers or deprecated.
    return false;
};

export const syncUserStats = async (userId: string): Promise<void> => {
    // @-fix: Use compat syntax for firestore.
    const userRef = db.collection('users').doc(userId);
    const friendsSnapshot = await userRef.collection('Friendlist').get();
    const userProfile = await getUserProfile(userId);
    
    const friends = friendsSnapshot.docs.map(d => d.id);
    const checkIns = (userProfile.checkInHistory || []).length;
    
    await userRef.update({ friends, checkIns });
};

// ============================================================================
// 4. 店家與優惠 (Stores & Deals)
// ============================================================================

export const getStores = async (): Promise<Store[]> => {
    try {
        const stores = await callFunction<any, Store[]>('getStores');
        // If the backend returns null, undefined, or an empty array, we return an empty array.
        // The app will now strictly reflect the database state.
        return stores || [];
    } catch (error) {
        console.error("Failed to get stores via cloud function:", error);
        return []; // On error, return empty array instead of mock data.
    }
};

export const createStore = async (storeData: Store): Promise<void> => {
    // This should be an admin-only function
};

export const getDeals = async (): Promise<Deal[]> => {
    try {
        const cloudDeals = await callFunction<any, Deal[]>('getDeals');
        return cloudDeals.sort((a, b) => new Date(a.expiry).getTime() - new Date(b.expiry).getTime());
    } catch (error) {
        console.warn("Could not fetch deals from cloud function, falling back to mock data.", error);
        return MOCK_DEALS;
    }
};

export const getFriends = async (userId: string): Promise<UserProfile[]> => {
    if (!userId) return [];
    try {
        // @-fix: Use compat syntax for firestore.
        const snapshot = await db.collection('users').doc(userId).collection('Friendlist').get();
        if (!snapshot.empty) {
            const friendIds = snapshot.docs.map(d => d.id);
            const friendProfiles = await Promise.all(friendIds.map(id => getUserProfile(id)));
            return friendProfiles;
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
    sendFriendRequest: async (targetUid: string): Promise<void> => {
        await callFunction('sendFriendRequest', { targetUid });
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
    toggleLike: (item: FeedItem, currentUserId: string, isCurrentlyLiked: boolean): Promise<void> => {
        return callFunction('toggleLike', { postId: String(item.id) });
    },
    addComment: async (item: FeedItem, comment: Comment): Promise<void> => {
        return callFunction('addComment', { postId: String(item.id), comment });
    },
    deletePost: async (postId: string | number): Promise<void> => {
         // @-fix: Use compat syntax for firestore.
         await db.collection('posts').doc(String(postId)).delete();
    },
};

export const journalApi = {
    getJournalEntries: async (userId: string): Promise<JournalEntry[]> => {
        // @-fix: Use compat syntax for firestore.
        const snapshot = await db.collection('users').doc(userId).collection('journalEntries').orderBy('date', 'desc').get();
        return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as JournalEntry));
    },
    getJournalEntry: async (userId: string, entryId: string): Promise<JournalEntry | null> => {
        // @-fix: Use compat syntax for firestore.
        const docSnap = await db.collection('users').doc(userId).collection('journalEntries').doc(entryId).get();
        return docSnap.exists ? { id: docSnap.id, ...docSnap.data() } as JournalEntry : null;
    },
    createJournalEntry: async (userId: string, entryData: Omit<JournalEntry, 'id'>): Promise<string> => {
        // @-fix: Use compat syntax for firestore.
        const docRef = await db.collection('users').doc(userId).collection('journalEntries').add(entryData);
        return docRef.id;
    },
    updateJournalEntry: async (userId: string, entryId: string, updates: Partial<JournalEntry>): Promise<void> => {
        // @-fix: Use compat syntax for firestore.
        await db.collection('users').doc(userId).collection('journalEntries').doc(entryId).update(updates);
    },
    deleteJournalEntry: async (userId: string, entryId: string): Promise<void> => {
        // @-fix: Use compat syntax for firestore.
        await db.collection('users').doc(userId).collection('journalEntries').doc(entryId).delete();
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
        // @-fix: Use compat syntax for firestore.
        const q = db.collection("posts").where("authorId", "==", userId).orderBy("timestamp", "desc");
        const snapshot = await q.get();
        return snapshot.docs.map(doc => mapFeedDataToItem(doc, userId));
    } catch (error) {
        console.error("getUserFeed failed:", error);
        return [];
    }
};

export const subscribeToFeed = (currentUserId: string, callback: (items: FeedItem[]) => void) => {
    // @-fix: Use compat syntax for firestore.
    const q = db.collection("posts").orderBy("timestamp", "desc").limit(50);
    return q.onSnapshot((snapshot) => {
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
    // @-fix: Use compat syntax for firestore.
    const userRef = db.collection('users').doc(userId);
    const newRecord = { storeId, storeName, timestamp: new Date().toISOString() };
    try {
        await userRef.update({
            checkInHistory: firebase.firestore.FieldValue.arrayUnion(newRecord)
        });
    } catch (e) { console.error("Failed to add check-in record:", e); }
};

export const addReview = async (storeId: string, review: Review) => {
    if (!storeId) return;
    // @-fix: Use compat syntax for firestore.
    const storeRef = db.collection('stores').doc(storeId);
    try {
        await storeRef.update({
            reviews: firebase.firestore.FieldValue.arrayUnion(review)
        });
    } catch (e) { console.error("Failed to add review:", e); }
};


export const updateAllMissionProgress = async (userId: string | number): Promise<void> => {
    // This is now mainly handled by the backend trigger `triggerMissionProgress`
    // Kept here for specific, immediate client-side checks if needed
};
