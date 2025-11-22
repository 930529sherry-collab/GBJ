

import firebase, { db, functions, auth } from '../firebase/config';
// Removed modular import to fix SyntaxError: import { httpsCallableFromUrl } from 'firebase/functions';
import { UserProfile, SearchableUser, FeedItem, Comment, Notification, Store, Order, JournalEntry, FriendRequest } from '../types';
import { MOCK_STORES, WELCOME_COUPONS } from '../constants';

// ============================================================================
// 1. 核心工具 (Core Utilities)
// ============================================================================

/**
 * 通用 Cloud Function 呼叫器
 * 自動處理 Auth Token 與錯誤轉換
 */
const callFunction = async <T, R>(functionName: string, data?: T): Promise<R> => {
    try {
        // 確保已登入
        if (!auth.currentUser) {
            throw new Error("AUTH_REQUIRED");
        }
        
        const callable = functions.httpsCallable(functionName);
        const result = await callable(data);
        return result.data as R;
    } catch (error: any) {
        // Suppress logging for expected business logic errors to avoid alarming console noise
        const errorMsg = (error.message || String(error)).toLowerCase();
        const isExpectedError = errorMsg.includes('request already sent') || 
                                errorMsg.includes('already friends') ||
                                errorMsg.includes('already pending') ||
                                errorMsg.includes('not found') || 
                                errorMsg.includes('already processed') ||
                                errorMsg.includes('display name already taken') ||
                                (errorMsg.includes('internal') && functionName === 'respondfriendrequest'); // Ignore internal error for this function as we have fallback

        if (!isExpectedError) {
            console.error(`Cloud Function Error [${functionName}]:`, error);
        } else {
            console.warn(`Cloud Function Note [${functionName}]:`, error.message || String(error));
        }
        
        // 錯誤處理標準化
        if (error.code === 'functions/unauthenticated') {
            throw new Error("請先登入");
        }
        if (error.message === "AUTH_REQUIRED") {
             // Handle specific auth required logic if needed
        }
        throw error;
    }
};

const convertTimestamp = (ts: any): any => {
    if (!ts) return new Date().toISOString();
    
    // Firestore Timestamp
    if (typeof ts.toDate === 'function') {
        return ts.toDate().toISOString();
    }
    // Serialized Timestamp (seconds object)
    if (typeof ts === 'object' && ts !== null && 'seconds' in ts) {
        return new Date(ts.seconds * 1000).toISOString();
    }
    // Date object
    if (ts instanceof Date) {
        return ts.toISOString();
    }
    // String
    return String(ts);
};

// Helper to manually add notification to a user (Client-side fallback)
export const addNotificationToUser = async (targetUid: string, message: string, type: string = '系統通知') => {
    if (!db || !targetUid) return;
    
    const newNotification: Notification = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        type: type,
        message: message,
        timestamp: new Date().toISOString(),
        read: false,
    };

    try {
        const userRef = db.collection("users").doc(targetUid);
        await userRef.update({
            notifications: firebase.firestore.FieldValue.arrayUnion(newNotification)
        });
    } catch (e) {
        console.error("Failed to add notification:", e);
    }
};

// ============================================================================
// 2. 使用者資料 (User Profile)
// ============================================================================

export const getUserProfile = async (uid: string | number): Promise<UserProfile> => {
    if (!uid) throw new Error("UID is required");
    
    // Handle guest user (ID 0) - Legacy check
    if (String(uid) === '0') {
        return {
            id: 0,
            name: '訪客',
            avatarUrl: 'https://picsum.photos/200?random=guest',
            level: 1,
            xp: 0,
            xpToNextLevel: 100,
            points: 0,
            missionsCompleted: 0,
            checkIns: 0,
            friends: [],
            notifications: [],
            latlng: { lat: 25.0330, lng: 121.5654 }, // Taipei 101 default
            isGuest: true
        } as unknown as UserProfile;
    }

    try {
        const userDocRef = db.collection("users").doc(String(uid));
        const userDocSnap = await userDocRef.get();
        
        if (userDocSnap.exists) {
            const data = userDocSnap.data();
            let friendsList = data?.friends || [];

            // Sync with Friendlist subcollection (Source of Truth)
            // If the user has migrated to Friendlist subcollection, we use that.
            try {
                const friendsSnapshot = await userDocRef.collection('Friendlist').get();
                if (!friendsSnapshot.empty) {
                    friendsList = friendsSnapshot.docs.map(doc => doc.id);
                }
            } catch (err) {
                console.warn("Failed to fetch Friendlist subcollection", err);
            }

            // Ensure arrays exist to prevent "undefined" errors
            return { 
                id: userDocSnap.id, 
                ...data,
                friends: friendsList,
                notifications: data?.notifications || [],
                latlng: data?.latlng || { lat: 25.0330, lng: 121.5654 }, // Taipei 101 default
            } as UserProfile;
        }
        
        // Removed fallback to mock users to prevent showing non-existent profiles
        throw new Error("User profile not found");
    } catch (error: any) {
        // Graceful fallback for permission errors (e.g. during auth transitions or rules issues)
        const errorMsg = error.message || String(error);
        if (error.code === 'permission-denied' || errorMsg.includes('Missing or insufficient permissions') || errorMsg.includes('permission-denied')) {
             console.warn("getUserProfile: Permission denied, returning basic profile.");
             return {
                id: uid,
                name: '用戶',
                avatarUrl: 'https://picsum.photos/200',
                level: 1,
                xp: 0,
                xpToNextLevel: 100,
                points: 0,
                missionsCompleted: 0,
                checkIns: 0,
                friends: [],
                latlng: { lat: 25.04, lng: 121.53 },
                friendCode: 'N/A',
                notifications: [],
             } as UserProfile;
        }

        throw error;
    }
};

/**
 * 建立使用者 (優先使用 Cloud Function，並處理名稱重複問題)
 */
export const createUserProfileInDB = async (firebaseUser: firebase.User, displayName: string, photoURL?: string): Promise<UserProfile> => {
    
    // Inner helper to handle cloud function call with potential retry
    const createWithCloudFunction = async (name: string, retry: boolean): Promise<UserProfile> => {
        try {
            return await callFunction('createUser', {
                uid: firebaseUser.uid,
                displayName: name,
                email: firebaseUser.email,
                avatarUrl: photoURL,
                missions: [] // 傳入初始任務
            });
        } catch (e: any) {
            const errorMessage = (e.message || String(e)).toLowerCase();
            // Handle name collision by retrying with suffix
            if (retry && errorMessage.includes("display name already taken")) {
                const newName = `${displayName}_${Math.floor(1000 + Math.random() * 9000)}`;
                console.log(`Display name '${name}' taken, retrying with '${newName}'...`);
                return createWithCloudFunction(newName, false); // Retry once
            }
            throw e;
        }
    };

    try {
        return await createWithCloudFunction(displayName, true);
    } catch (e) {
        console.warn("Cloud function createUser failed, falling back to direct creation.", e);
        
        // Fallback: Direct create if Cloud Function fails/not deployed or retry failed
        const newProfile: UserProfile = {
            id: firebaseUser.uid,
            name: displayName,
            displayName: displayName,
            avatarUrl: photoURL || firebaseUser.photoURL || `https://picsum.photos/200?random=${firebaseUser.uid}`,
            email: firebaseUser.email || '',
            level: 1,
            xp: 0,
            xpToNextLevel: 100,
            points: 0,
            missionsCompleted: 0,
            checkIns: 0,
            friends: [],
            latlng: { lat: 25.0330, lng: 121.5654 },
            friendCode: `GUNBOOJO-${firebaseUser.uid.substring(0, 6).toUpperCase()}`,
            notifications: [],
            hasReceivedWelcomeGift: false,
            isGuest: false,
            profileVisibility: 'friends',
        };
        await db.collection("users").doc(firebaseUser.uid).set(newProfile);
        return newProfile;
    }
};

export const createFallbackUserProfile = async (firebaseUser: firebase.User, displayName: string, photoURL?: string): Promise<UserProfile> => {
    return createUserProfileInDB(firebaseUser, displayName, photoURL);
};

/**
 * 更新使用者資料
 */
export const updateUserProfile = async (uid: string, updates: Partial<UserProfile>): Promise<void> => {
    if (!uid || !db) return;
    const userDocRef = db.collection("users").doc(uid);
    await userDocRef.update(updates);
};

export const updateUserLocation = async (latlng: { lat: number; lng: number }): Promise<void> => {
    return callFunction('updateUserLocation', { latlng });
};

export const grantWelcomePackage = async (userId: string | number): Promise<boolean> => {
    if (!userId || !db) return false;
    const userRef = db.collection("users").doc(String(userId));

    try {
        const result = await db.runTransaction(async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists) {
                return false; 
            }

            const userData = userDoc.data();
            if (userData?.hasReceivedWelcomeGift) {
                return false; 
            }

            const currentPoints = userData?.points || 0;

            const updates: any = {
                hasReceivedWelcomeGift: true,
            };

            if (currentPoints === 0 || currentPoints < 50) {
                 updates.points = firebase.firestore.FieldValue.increment(50);
            }

            transaction.update(userRef, updates);
            return true;
        });
        return result;
    } catch (error) {
        console.error("Grant welcome package failed:", error);
        return false;
    }
};

export const checkAndBackfillCouponNotification = async (userId: string | number, profile: UserProfile): Promise<boolean> => {
    return checkAndBackfillWelcomeNotifications(userId, profile);
};

export const checkAndBackfillWelcomeNotifications = async (userId: string | number, profile: UserProfile): Promise<boolean> => {
    if (!userId || !db) return false;
    
    if (!profile.hasReceivedWelcomeGift) return false;
    
    let needsUpdate = false;
    const newNotifications = [];
    const currentNotifications = profile.notifications || [];

    const hasPointsNotif = currentNotifications.some(n => 
        n && typeof n.message === 'string' && n.message.includes('50 酒幣')
    );
    
    if (!hasPointsNotif) {
        newNotifications.push({
            id: `backfill-points-${Date.now()}`,
            type: '系統通知',
            message: '新手獎勵：獲得 50 酒幣！',
            timestamp: new Date().toISOString(),
            read: false,
        });
        needsUpdate = true;
    }

    const hasCouponNotif = currentNotifications.some(n => 
        n && typeof n.message === 'string' && (n.message.includes('優惠券') || n.message.includes('新客專屬'))
    );
    
    if (!hasCouponNotif) {
        newNotifications.push({
            id: `backfill-coupons-${Date.now()}`,
            type: '系統通知',
            message: '新手獎勵：已發送 3 張新客專屬優惠券至您的帳戶，請至「我的優惠券」查看！',
            timestamp: new Date().toISOString(),
            read: false,
        });
        needsUpdate = true;
    }

    if (needsUpdate) {
        try {
            const userRef = db.collection("users").doc(String(userId));
            await userRef.update({
                notifications: firebase.firestore.FieldValue.arrayUnion(...newNotifications)
            });
            return true;
        } catch(e) {
            console.error("Failed to backfill notifications", e);
        }
    }
    return false;
};

export const syncUserStats = async (userId: string | number): Promise<void> => {
    if (!userId) return;
    // No heavy sync needed for now
};


// ============================================================================
// 3. 店家資料 (Store Data) - Firestore Linked
// ============================================================================

export const getStores = async (): Promise<Store[]> => {
    if (!db) return MOCK_STORES;
    try {
        const colRef = db.collection("stores");
        const snapshot = await colRef.get();
        
        if (snapshot.empty) {
            return MOCK_STORES;
        }
        
        const stores = snapshot.docs.map(doc => {
             const data = doc.data();
             return { ...data, id: typeof data.id === 'number' ? data.id : Number(doc.id) } as Store;
        });
        // Filter out stores without valid latlng
        return stores.filter(s => s.latlng && typeof s.latlng.lat === 'number' && typeof s.latlng.lng === 'number');

    } catch (e: any) {
        // Handle missing permissions gracefully by using mock data
        const errorMsg = e.message || String(e);
        if (e.code === 'permission-denied' || errorMsg.includes('Missing or insufficient permissions') || errorMsg.includes('permission-denied')) {
            console.warn("getStores: Permission denied (using mock data).");
        } else {
            console.error("getStores failed:", e);
        }
        return MOCK_STORES;
    }
};

export const createStore = async (store: Store): Promise<void> => {
    if (!db) return;
    await db.collection("stores").doc(String(store.id)).set(store);
};

export const storeApi = {
    getStores,
    createStore
};

// ============================================================================
// 4. 好友與社交 (Social & Friends)
// ============================================================================

export const searchUsers = async (queryTerm: string): Promise<SearchableUser[]> => {
    if (!queryTerm?.trim()) return [];
    
    // Cloud Search Only (Mock users removed)
    try {
        // If guest, this will throw and go to catch, returning empty
        const cloudResults = await callFunction<any, any[]>('searchUsers', { query: queryTerm });
        
        const results: SearchableUser[] = [];
        if (Array.isArray(cloudResults)) {
            cloudResults.forEach(cUser => {
                // Explicitly filter out mock-like IDs if they happen to sneak in
                if (String(cUser.id).length < 5 && !isNaN(Number(cUser.id))) return;

                // Ensure we handle potential missing fields from raw cloud data
                const safeUser: SearchableUser = {
                    id: cUser.id || cUser.uid,
                    name: cUser.displayName || cUser.name || '用戶',
                    avatarUrl: cUser.avatarUrl || cUser.photoURL || 'https://picsum.photos/200',
                    level: typeof cUser.level === 'number' ? cUser.level : 1,
                    isFriend: false
                };
                results.push(safeUser);
            });
        }
        return results;
    } catch (e) {
        // Suppress error for guests or network issues
        return []; 
    }
};

/**
 * 取得好友列表
 */
export const getFriends = async (userId: number | string): Promise<UserProfile[]> => {
    if (!auth.currentUser || !userId) return [];

    try {
        const uid = String(userId);
        let friendPromises: Promise<UserProfile | null>[] = [];

        // 1. 嘗試取得好友 ID 列表
        // 優先查 Friendlist 子集合 (Source of Truth)
        try {
            const friendsRef = db.collection('users').doc(uid).collection('Friendlist');
            const snapshot = await friendsRef.get();

            if (!snapshot.empty) {
                friendPromises = snapshot.docs.map(async (doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        name: data.name || data.displayName || 'Unknown',
                        avatarUrl: data.avatarUrl || data.photoURL || '',
                        level: data.level || 1,
                        ...data
                    } as unknown as UserProfile;
                });
            }
        } catch (e) {
            console.warn("Failed to read Friendlist subcollection:", e);
        }

        // 2. 如果子集合沒資料 (舊資料或延遲)，嘗試讀取 User Doc 的 friends 陣列
        if (friendPromises.length === 0) {
             try {
                const userDoc = await db.collection('users').doc(uid).get();
                const friendsArray: string[] = userDoc.data()?.friends || [];
                
                if (friendsArray.length > 0) {
                    friendPromises = friendsArray.map(async (fid) => {
                        try {
                            return await getUserProfile(fid);
                        } catch { return null; }
                    });
                }
             } catch (e) {
                 console.warn("Failed to read user friends array:", e);
             }
        }

        // 3. 若還是沒資料，嘗試 Cloud Function (舊版相容)
        if (friendPromises.length === 0) {
             try {
                 const cfFriends = await callFunction<undefined, UserProfile[]>('getFriends');
                 if (Array.isArray(cfFriends)) {
                     friendPromises = cfFriends.map(f => Promise.resolve(f));
                 }
             } catch (e) {
                 // Ignore CF error if not deployed or permissions issues
             }
        }

        // 在 getFriends 最後強制等 1 秒再讀（解決 Firestore 延遲）
        const friendsData = await Promise.all(friendPromises);
        await new Promise(resolve => setTimeout(resolve, 1000));  // 強制等一下下
        return friendsData.filter((f): f is UserProfile => Boolean(f));

    } catch (error) {
        console.warn("getFriends failed:", error);
        return [];
    }
};

export const userApi = {
    searchUsers,
    getFriends,
    sendFriendRequest: async (friendId: string | number): Promise<{ success: boolean }> => {
        try {
            // Primary method: call Cloud Function
            return await callFunction<any, { success: boolean }>('sendFriendRequest', { friendId: String(friendId) });
        } catch (error) {
            console.warn("sendFriendRequest Cloud Function failed, attempting client-side fallback.", error);
            // Fallback method: direct Firestore write
            try {
                const profileStr = localStorage.getItem('userProfile');
                if (!profileStr) throw new Error("Current user profile not found for fallback.");
                const currentUser: UserProfile = JSON.parse(profileStr);

                const requestDoc = {
                    toUid: String(friendId), // Added for root collection filter
                    senderUid: String(currentUser.id),
                    senderName: currentUser.displayName || currentUser.name || '用戶',
                    senderAvatarUrl: currentUser.avatarUrl,
                    status: 'pending',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                };

                // Update to use root collection as requested
                const targetUserRequestsRef = db.collection('receivedFriendRequests');
                await targetUserRequestsRef.add(requestDoc);

                return { success: true }; // Return success on fallback success
            } catch (fallbackError) {
                console.error("Client-side fallback for sendFriendRequest also failed:", fallbackError);
                throw fallbackError; // Re-throw the fallback error
            }
        }
    },
    
    respondFriendRequest: async (requestId: string, requesterId: string, accept: boolean): Promise<{ success: boolean }> => {
        if (!requesterId || !requestId) {
            const error = new Error("無效的邀請：缺少邀請者或請求 ID。");
            console.error(error);
            throw error;
        }

        try {
            // Attempt Cloud Function call first
            const result = await callFunction<any, { success: boolean }>(
                'respondfriendrequest', 
                { requesterId: String(requesterId), requestId: String(requestId), accept }
            );

            // Update local cache if successful
            if (result && result.success && auth.currentUser) {
                const profileStr = localStorage.getItem('userProfile');
                if (profileStr) {
                    const profile: UserProfile = JSON.parse(profileStr);
                    if (accept) {
                        const currentFriends = profile.friends || [];
                        if (!currentFriends.some(f => String(f) === requesterId)) {
                            profile.friends = [...currentFriends, requesterId] as any;
                        }
                    }
                    localStorage.setItem('userProfile', JSON.stringify(profile));
                }
            }
            return result;

        } catch (error) {
            console.warn("respondFriendRequest Cloud Function failed, using Firestore fallback.", error);
            
            // FALLBACK: Client-side Firestore Operations
            if (!auth.currentUser) throw new Error("Not authenticated");
            const currentUid = auth.currentUser.uid;
            
            // Strategy 1: Try updating everything (might fail if strict rules on other user)
            try {
                const batch = db.batch();
                const requestRef = db.collection('receivedFriendRequests').doc(requestId);
                batch.update(requestRef, { status: accept ? 'accepted' : 'declined' });

                if (accept) {
                    // My Friendlist (Subcollection + Array)
                    const myFriendRef = db.collection('users').doc(currentUid).collection('Friendlist').doc(requesterId);
                    batch.set(myFriendRef, { timestamp: firebase.firestore.FieldValue.serverTimestamp(), friendId: requesterId }, { merge: true });
                    const myUserRef = db.collection('users').doc(currentUid);
                    batch.set(myUserRef, { friends: firebase.firestore.FieldValue.arrayUnion(requesterId) }, { merge: true });

                    // Their Friendlist (Optimistic - might fail if permissions prevent it)
                    const theirFriendRef = db.collection('users').doc(requesterId).collection('Friendlist').doc(currentUid);
                    batch.set(theirFriendRef, { timestamp: firebase.firestore.FieldValue.serverTimestamp(), friendId: currentUid }, { merge: true });
                    const theirUserRef = db.collection('users').doc(requesterId);
                    batch.set(theirUserRef, { friends: firebase.firestore.FieldValue.arrayUnion(currentUid) }, { merge: true });
                }

                await batch.commit();
            } catch (fullFallbackError) {
                console.warn("Full fallback failed (likely permissions), attempting partial fallback (local user only).", fullFallbackError);
                
                // Strategy 2: Update only my data and the request status
                const localBatch = db.batch();
                const requestRef = db.collection('receivedFriendRequests').doc(requestId);
                localBatch.update(requestRef, { status: accept ? 'accepted' : 'declined' });

                if (accept) {
                    const myFriendRef = db.collection('users').doc(currentUid).collection('Friendlist').doc(requesterId);
                    localBatch.set(myFriendRef, { timestamp: firebase.firestore.FieldValue.serverTimestamp(), friendId: requesterId }, { merge: true });
                    const myUserRef = db.collection('users').doc(currentUid);
                    localBatch.set(myUserRef, { friends: firebase.firestore.FieldValue.arrayUnion(requesterId) }, { merge: true });
                }
                await localBatch.commit();
            }
            
            // Update local cache manually after fallback success
            if (accept) {
                const profileStr = localStorage.getItem('userProfile');
                if (profileStr) {
                    const profile: UserProfile = JSON.parse(profileStr);
                    const currentFriends = profile.friends || [];
                    if (!currentFriends.some(f => String(f) === requesterId)) {
                        profile.friends = [...currentFriends, requesterId] as any;
                        localStorage.setItem('userProfile', JSON.stringify(profile));
                    }
                }
            }
            return { success: true };
        }
    },

    createPost: async (content: string, storeName: string, imageUrl?: string, visibility: string = 'public'): Promise<any> => {
        // Sanitize the payload to ensure no 'undefined' values are sent.
        // Firestore does not support 'undefined'. We use 'null' instead.
        const payload = {
            content: content,
            storeName: storeName,
            imageUrl: imageUrl === undefined ? null : imageUrl,
            visibility: visibility,
        };
        
        return await callFunction('createPost', payload);
    }
};

// ============================================================================
// 5. 動態牆 (Feed & Posts)
// ============================================================================

/**
 * 取得動態牆
 */
export const getFeedItems = async (): Promise<FeedItem[]> => {
    try {
        const feedItems = await callFunction<undefined, FeedItem[]>('getFeed');
        return Array.isArray(feedItems) ? feedItems : [];
    } catch (error) {
        console.error("getFeedItems failed:", error);
        return [];
    }
};

/**
 * 取得特定使用者的動態
 */
export const getUserFeed = async (userId: string | number): Promise<FeedItem[]> => {
    if (!userId) return [];
    
    try {
        const q = db.collection("posts")
            .where("friendId", "==", userId)
            .orderBy("timestamp", "desc");
        const snapshot = await q.get();
        
        return snapshot.docs.map(doc => {
            const data = doc.data();
            const likedBy = data.likedBy || [];
            return {
                id: doc.id,
                ...data,
                timestamp: convertTimestamp(data.timestamp),
                likes: data.likes || 0,
                likedBy: likedBy,
                comments: data.comments || [],
                clientSideId: data.clientSideId 
            } as FeedItem;
        });

    } catch (error) {
        console.error("getUserFeed failed:", error);
        return [];
    }
};

/**
 * 訂閱動態牆
 */
export const subscribeToFeed = (currentUserId: string, callback: (items: FeedItem[]) => void) => {
    const q = db.collection("posts")
        .orderBy("timestamp", "desc")
        .limit(50);

    return q.onSnapshot((snapshot) => {
        const items = snapshot.docs.map(doc => {
            const data = doc.data();
            const likedBy = data.likedBy || [];
            
            return {
                id: doc.id,
                ...data,
                timestamp: convertTimestamp(data.timestamp),
                likes: likedBy.length,
                isLiked: likedBy.includes(currentUserId),
                likedBy: likedBy,
                comments: data.comments || [],
                clientSideId: data.clientSideId
            } as FeedItem;
        });
        callback(items);
    }, (error) => {
        // Gracefully handle permission errors to prevent app crash
        const errorMsg = error.message || String(error);
        if (error.code === 'permission-denied' || errorMsg.includes('Missing or insufficient permissions') || errorMsg.includes('permission-denied')) {
             console.warn("Feed subscription permission denied. Using empty feed.");
             callback([]); // Return empty list to stop loading state
        } else {
             console.error("Feed subscription error:", error);
        }
    });
};

export const feedApi = {
    getFeed: getFeedItems,
    getUserFeed,

    /**
     * 建立貼文
     */
    createPost: async (postData: any): Promise<FeedItem> => {
        if (!db) throw new Error("Database not initialized");

        const clientSideId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const timestamp = new Date().toISOString();
        
        const newPost: any = {
            authorId: auth.currentUser?.uid || String(postData.friendId),
            friendId: postData.friendId,
            friendName: postData.friendName || '用戶', 
            friendAvatarUrl: postData.friendAvatarUrl || '',
            type: postData.type || 'check-in',
            content: postData.content || '',
            storeName: postData.storeName || null,
            imageUrl: postData.imageUrl || null,
            missionTitle: postData.missionTitle || null,
            visibility: postData.visibility || 'public',
            likes: 0,
            likedBy: [],
            comments: [],
            clientSideId: clientSideId,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        // 清理 undefined 欄位
        const cleanedPost = Object.fromEntries(
            Object.entries(newPost).filter(([_, v]) => v !== undefined)
        );

        try {
            await db.collection("posts").add(cleanedPost);
        } catch (e) {
            console.error("Firestore write failed:", e);
        }

        return {
            id: clientSideId,
            ...newPost,
            timestamp: timestamp,
            isLiked: false
        } as FeedItem;
    },

    /**
     * 按讚 / 取消讚
     */
    toggleLike: async (postId: string | number, userId: string | number, isCurrentlyLiked: boolean) => {
        if (!postId) return;
        const postRef = db.collection("posts").doc(String(postId));

        try {
            if (isCurrentlyLiked) {
                await postRef.update({
                    likes: firebase.firestore.FieldValue.increment(-1),
                    likedBy: firebase.firestore.FieldValue.arrayRemove(String(userId))
                });
            } else {
                await postRef.update({
                    likes: firebase.firestore.FieldValue.increment(1),
                    likedBy: firebase.firestore.FieldValue.arrayUnion(String(userId))
                });
            }
        } catch (e) {
            console.error("toggleLike failed:", e);
        }
    },

    /**
     * 新增留言
     */
    addComment: async (postId: string | number, comment: Comment) => {
        if (!db || !auth.currentUser) return { success: false };
        
        const pid = String(postId);

        const safeComment = {
            id: String(comment.id || Date.now()), 
            authorName: comment.authorName || '用戶',
            authorAvatarUrl: comment.authorAvatarUrl || '',
            text: comment.text || '',
            storeName: comment.storeName ?? null, 
            authorId: auth.currentUser.uid,
            timestamp: new Date().toISOString(),
        };

        try {
            const postRef = db.collection("posts").doc(pid);
            await postRef.update({
                comments: firebase.firestore.FieldValue.arrayUnion(safeComment)
            });
            return { success: true };
        } catch (e) {
            console.error("Direct comment update failed:", e);
            return { success: false };
        }
    }
};

// ============================================================================
// 6. 通知與遊戲化 (Notifications & Game)
// ============================================================================

export const getNotifications = async (): Promise<Notification[]> => {
    if (!auth.currentUser) return [];
    
    const userRef = db.collection("users").doc(auth.currentUser.uid);
    
    try {
        const userSnap = await userRef.get();
        if (!userSnap.exists) return [];
        const data = userSnap.data();
        
        let allNotifications = (data?.notifications || []) as Notification[];
        
        allNotifications.sort((a, b) => {
             const timeA = new Date(convertTimestamp(a.timestamp)).getTime();
             const timeB = new Date(convertTimestamp(b.timestamp)).getTime();
             return timeB - timeA; 
        });

        return allNotifications;

    } catch (e) {
        console.error("getNotifications failed:", e);
        return [];
    }
};

export const gameApi = {
    completeMission: async (missionName: string, xpReward: number) => {
        return callFunction('triggerMissionComplete', { missionName, xpReward });
    },
    levelUp: async (newLevel: number) => {
        return callFunction('triggerLevelUp', { newLevel });
    },
    receiveCoupon: async (couponName: string) => {
        return callFunction('triggerCouponNotification', { couponName });
    }
};