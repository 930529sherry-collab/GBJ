
import firebase, { db, functions, auth, storage } from '../firebase/config';
import { UserProfile, SearchableUser, FeedItem, Comment, Notification, Store, Order, JournalEntry, FriendRequest, Deal, Mission } from '../types';
import { WELCOME_COUPONS, INITIAL_MISSIONS, toDateObj, MOCK_DEALS, MISSIONS_FOR_IMPORT, MOCK_STORES } from '../constants';
import { httpsCallable } from 'firebase/functions';

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
    if (!db || !targetUid) return;
    const newNotification: Notification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type, message, timestamp: new Date().toISOString(), read: false,
    };
    try {
        const userRef = db.collection("users").doc(targetUid);
        await userRef.update({
            notifications: firebase.firestore.FieldValue.arrayUnion(newNotification)
        });
    } catch (e) { console.error("Failed to add notification:", e); }
};

export const uploadImage = async (file: File, path: string): Promise<string> => {
    if (!storage) throw new Error("Storage not initialized");
    const storageRef = storage.ref().child(path);
    const snapshot = await storageRef.put(file);
    return await snapshot.ref.getDownloadURL();
};


// ============================================================================
// 2. 任務系統 (Mission System)
// ============================================================================

export const getSystemMissions = async (): Promise<Mission[]> => {
    if (!db) return INITIAL_MISSIONS; 
    try {
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
        const userDocRef = db.collection("users").doc(String(uid));
        const userDoc = await userDocRef.get();
        if (userDoc.exists) {
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
                
                userDocRef.update({ missions: data.missions }).catch(err => {
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

const initializeNewUserProfile = async (firebaseUser: firebase.User, displayName: string, photoURL?: string): Promise<UserProfile> => {
    return {
        id: firebaseUser.uid, name: displayName, displayName,
        avatarUrl: photoURL || `https://picsum.photos/200?random=${firebaseUser.uid}`,
        email: firebaseUser.email || '', level: 1, xp: 0, xpToNextLevel: 100, points: 50,
        missionsCompleted: 0, checkIns: 0, friends: [],
        latlng: { lat: 25.0330, lng: 121.5654 },
        friendCode: `GUNBOOJO-${firebaseUser.uid.substring(0, 4).toUpperCase()}`,
        notifications: [], hasReceivedWelcomeGift: true, isGuest: false,
        profileVisibility: 'friends',
        coupons: WELCOME_COUPONS,
        missions: [], // Missions will be populated by syncAndResetMissions
        checkInHistory: [],
    };
};

export const createFallbackUserProfile = async (firebaseUser: firebase.User, displayName: string, photoURL?: string): Promise<UserProfile> => {
    const newProfile = await initializeNewUserProfile(firebaseUser, displayName, photoURL);
    await db.collection("users").doc(firebaseUser.uid).set(newProfile);
    return newProfile;
};

export const createUserProfileInDB = async (firebaseUser: firebase.User, displayName: string, photoURL?: string): Promise<UserProfile> => {
    const newProfile = await initializeNewUserProfile(firebaseUser, displayName, photoURL);
    await db.collection("users").doc(firebaseUser.uid).set(newProfile);
    return newProfile;
};


export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
    if (!uid || !db) return;
    await db.collection("users").doc(uid).update(updates);
};

export const grantWelcomePackage = async (userId: string): Promise<boolean> => {
    const profile = await getUserProfile(userId);
    if (profile.hasReceivedWelcomeGift) return false;
    
    const updates: Partial<UserProfile> = {
        points: (profile.points || 0) + 50,
        coupons: [...(profile.coupons || []), ...WELCOME_COUPONS],
        hasReceivedWelcomeGift: true,
    };
    await updateUserProfile(userId, updates);
    return true;
};

export const checkAndBackfillWelcomeNotifications = async (userId: string, profile: UserProfile): Promise<boolean> => {
    if (!profile.hasReceivedWelcomeGift) return false;
    const notifications = profile.notifications || [];
    let addedNotifs = false;

    const hasPointsNotif = notifications.some(n => n.message.includes("50 酒幣"));
    const hasCouponsNotif = notifications.some(n => n.message.includes("新客優惠券"));

    const newNotifications: Notification[] = [];
    if (!hasPointsNotif) {
        newNotifications.push({ type: '系統通知', message: '歡迎加入！50 酒幣已發送至您的帳戶。', timestamp: new Date().toISOString(), read: false });
        addedNotifs = true;
    }
    if (!hasCouponsNotif) {
        newNotifications.push({ type: '系統通知', message: '3 張新客專屬優惠券已發送至您的帳戶。', timestamp: new Date().toISOString(), read: false });
        addedNotifs = true;
    }
    
    if (addedNotifs) {
        await updateUserProfile(userId, { notifications: [...notifications, ...newNotifications] });
    }
    return addedNotifs;
};

export const syncUserStats = async (userId: string): Promise<void> => {
    const userRef = db.collection('users').doc(userId);
    const [friendsSnapshot, userProfile] = await Promise.all([userRef.collection('Friendlist').get(), getUserProfile(userId)]);
    
    const friends = friendsSnapshot.docs.map(doc => doc.id);
    const checkIns = (userProfile.checkInHistory || []).length;
    
    await userRef.update({ friends, checkIns });
};

// ============================================================================
// 4. 店家與優惠 (Stores & Deals)
// ============================================================================

export const getStores = async (): Promise<Store[]> => {
    try {
        return await callFunction('getStores');
    } catch (error) {
        console.warn("Could not fetch stores from cloud function, falling back to mock data.", error);
        return MOCK_STORES;
    }
};

export const createStore = async (storeData: Store): Promise<void> => {
    if (!db) throw new Error("Firestore not initialized");
    const docRef = await db.collection('stores').add(storeData);
    await docRef.update({ id: docRef.id });
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

export const getFriends = async (userId: number | string): Promise<UserProfile[]> => {
    if (!userId) return [];
    try {
        const snapshot = await db.collection('users').doc(String(userId)).collection('Friendlist').get();
        if (!snapshot.empty) {
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
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
            await callFunction('sendFriendRequest', { targetUid: String(targetUid) });
        } catch (e) {
            console.warn("sendFriendRequest function failed, falling back to client-side write", e);
            const senderProfile = await getUserProfile(currentUser.uid);
            const requestDoc = {
                senderUid: currentUser.uid,
                senderName: senderProfile.displayName || senderProfile.name || '新用戶',
                senderAvatarUrl: senderProfile.avatarUrl,
                status: 'pending',
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            };
            await db.collection('users').doc(String(targetUid)).collection('friendRequests').doc(currentUser.uid).set(requestDoc);
        }
    },
    respondFriendRequest: async (requesterId: string, accept: boolean, requestId: string): Promise<void> => {
        await callFunction('respondFriendRequest', { requesterId, accept, requestId });
    },
    sendNotification: (targetUid: string, message: string, type: string) => {
        return callFunction('sendNotification', { targetUid, message, type });
    },
    // FIX: Renamed 'syncAndResetMissions' to 'checkDailyMissions' to align with its usage in other files, resolving a property access error.
    checkDailyMissions: async (): Promise<any> => {
        console.log("Syncing and resetting missions via backend...");
        return callFunction('syncAndResetMissions');
    },
    triggerMissionUpdate: (type: string, data: any = {}) => {
        return callFunction('triggerMissionProgress', { type, data });
    }
};

export const feedApi = {
    toggleLike: (item: FeedItem, currentUserId: string, isCurrentlyLiked: boolean): Promise<void> => {
        return callFunction('toggleLike', { postId: String(item.id) });
    },
    addComment: async (item: FeedItem, comment: Comment): Promise<void> => {
         try {
            await callFunction('addComment', { postId: String(item.id), comment });
        } catch(e) {
            console.warn("addComment function failed, falling back to client-side write", e);
            const commentRef = db.collection('posts').doc(String(item.id)).collection('comments');
            await commentRef.add({ ...comment, timestamp: firebase.firestore.FieldValue.serverTimestamp() });
        }
    },
    deletePost: async (postId: string | number): Promise<void> => {
         if (!db) return;
         await db.collection('posts').doc(String(postId)).delete();
    },
};

export const journalApi = {
    getJournalEntries: async (userId: string): Promise<JournalEntry[]> => {
        if (!db || !userId) return [];
        const snapshot = await db.collection('users').doc(userId).collection('journalEntries').orderBy('date', 'desc').get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JournalEntry));
    },
    getJournalEntry: async (userId: string, entryId: string): Promise<JournalEntry | null> => {
        if (!db || !userId || !entryId) return null;
        const docSnap = await db.collection('users').doc(userId).collection('journalEntries').doc(entryId).get();
        return docSnap.exists ? { id: docSnap.id, ...docSnap.data() } as JournalEntry : null;
    },
    createJournalEntry: async (userId: string, entryData: Omit<JournalEntry, 'id'>): Promise<string> => {
        if (!db || !userId) throw new Error('User not authenticated');
        const docRef = await db.collection('users').doc(userId).collection('journalEntries').add(entryData);
        return docRef.id;
    },
    updateJournalEntry: async (userId: string, entryId: string, updates: Partial<JournalEntry>): Promise<void> => {
        if (!db || !userId || !entryId) throw new Error('User or entry not specified');
        await db.collection('users').doc(userId).collection('journalEntries').doc(entryId).update(updates);
    },
    deleteJournalEntry: async (userId: string, entryId: string): Promise<void> => {
        if (!db || !userId || !entryId) throw new Error('User or entry not specified');
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

export const adminApi = {
    importMissions: async (): Promise<void> => {
        const user = auth.currentUser;
        if (!user) {
            alert("Please log in to import missions.");
            return;
        }
        try {
            await updateUserProfile(user.uid, { missions: INITIAL_MISSIONS });
            alert("Missions imported successfully!");
        } catch (error) {
            console.error("Failed to import missions:", error);
            alert("Failed to import missions.");
        }
    },
};


// ============================================================================
// 6. Data Fetching & Subscriptions
// ============================================================================

const mapFeedDataToItem = (doc: firebase.firestore.DocumentSnapshot, currentUserId: string): FeedItem => {
    const data = doc.data() as any;
    const likedBy = data.likedBy || [];
    return {
        id: doc.id,
        ...data,
        content: data.text || data.content || "",
        friendName: data.authorName || data.friendName || "用戶",
        friendAvatarUrl: data.authorAvatar || data.friendAvatarUrl || "",
        friendId: data.authorId || data.friendId,
        timestamp: convertTimestamp(data.timestamp),
        likes: likedBy.length,
        isLiked: likedBy.includes(currentUserId),
        comments: (data.comments || []).map((c: any) => ({ ...c, timestamp: convertTimestamp(c.timestamp) })),
    } as FeedItem;
};

export const getUserFeed = async (userId: string | number): Promise<FeedItem[]> => {
    if (!userId) return [];
    try {
        const q = db.collection("posts").where("authorId", "==", String(userId)).orderBy("timestamp", "desc");
        const snapshot = await q.get();
        return snapshot.docs.map(doc => mapFeedDataToItem(doc, String(userId)));
    } catch (error) {
        console.error("getUserFeed failed:", error);
        return [];
    }
};

export const subscribeToFeed = (currentUserId: string, callback: (items: FeedItem[]) => void) => {
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
    if (!userId || !db) return;
    const userRef = db.collection('users').doc(userId);
    const newRecord = { storeId, storeName, timestamp: new Date().toISOString() };
    try {
        await userRef.update({
            checkInHistory: firebase.firestore.FieldValue.arrayUnion(newRecord)
        });
    } catch (e) { console.error("Failed to add check-in record:", e); }
};

export const updateAllMissionProgress = async (userId: string | number): Promise<void> => {
    const uid = String(userId);
    if (!uid || uid === '0') return;
    
    try {
        const userProfile = await getUserProfile(uid);
        if (!userProfile?.missions) return;

        const updatedMissions: Mission[] = userProfile.missions.map(mission => {
            let current = 0;
            switch(mission.id) {
                case 'daily_check_in':
                     current = (userProfile.checkInHistory || []).filter(c => {
                        const checkinDate = new Date(c.timestamp).toLocaleDateString();
                        const todayDate = new Date().toLocaleDateString();
                        return checkinDate === todayDate;
                    }).length;
                    break;
                case 'special_first_friend':
                    current = (userProfile.friends || []).length;
                    break;
                case 'special_level_5':
                    current = userProfile.level;
                    break;
                 case 'special_reviewer':
                     // This needs a more efficient way, but for now...
                     // Let's assume this calculation is too slow and is handled by a backend trigger
                     current = mission.current; // Keep existing progress
                     break;
                 // Add other mission calculations here
            }

            const newStatus: 'ongoing' | 'completed' = current >= mission.target ? 'completed' : 'ongoing';

            return {
                ...mission,
                current: Math.min(current, mission.target),
                status: newStatus,
            };
        });
        
        await updateUserProfile(uid, { missions: updatedMissions });

    } catch (e) {
        console.error("Failed to update mission progress:", e);
    }
};
