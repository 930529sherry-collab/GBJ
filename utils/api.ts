import firebase, { db, functions, auth } from '../firebase/config';
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
                                errorMsg.includes('display name already taken');

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
            try {
                const friendsSnapshot = await userDocRef.collection('Friendlist').get();
                if (!friendsSnapshot.empty) {
                    friendsList = friendsSnapshot.docs.map(doc => doc.id);
                }
            } catch (err) {
                console.warn("Failed to fetch Friendlist subcollection", err);
            }

            return { 
                id: userDocSnap.id, 
                ...data,
                friends: friendsList,
                notifications: data?.notifications || [],
                latlng: data?.latlng || { lat: 25.0330, lng: 121.5654 }, // Taipei 101 default
            } as UserProfile;
        }
        
        throw new Error("User profile not found");
    } catch (error: any) {
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

export const createUserProfileInDB = async (firebaseUser: firebase.User, displayName: string, photoURL?: string): Promise<UserProfile> => {
    try {
        // Call cloud function without retry logic
        return await callFunction('createUser', {
            uid: firebaseUser.uid,
            displayName: displayName,
            email: firebaseUser.email,
            avatarUrl: photoURL,
            missions: [] 
        });
    } catch (e: any) {
        // If it fails, check for specific "name taken" error
        const errorMessage = (e.message || String(e)).toLowerCase();
        if (errorMessage.includes("display name already taken")) {
            // Re-throw the specific error for the UI to handle
            throw new Error("此暱稱已被使用，請換一個。");
        }

        // For other errors, fall back to direct creation
        console.warn("Cloud function createUser failed, falling back to direct creation.", e);
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
        return stores.filter(s => s.latlng && typeof s.latlng.lat === 'number' && typeof s.latlng.lng === 'number');

    } catch (e: any) {
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
    
    try {
        const cloudResults = await callFunction<any, any[]>('searchUsers', { query: queryTerm });
        
        const results: SearchableUser[] = [];
        if (Array.isArray(cloudResults)) {
            cloudResults.forEach(cUser => {
                // Strictly filter out mock-like IDs (length < 5)
                const uidStr = String(cUser.id || cUser.uid);
                if (uidStr.length < 5) return;

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
        return []; 
    }
};

export const getFriends = async (userId: number | string): Promise<UserProfile[]> => {
    if (!auth.currentUser || !userId) return [];

    try {
        const uid = String(userId);
        let friendPromises: Promise<UserProfile | null>[] = [];

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

        if (friendPromises.length === 0) {
             try {
                 const cfFriends = await callFunction<undefined, UserProfile[]>('getFriends');
                 if (Array.isArray(cfFriends)) {
                     friendPromises = cfFriends.map(f => Promise.resolve(f));
                 }
             } catch (e) {
             }
        }

        const friendsData = await Promise.all(friendPromises);
        await new Promise(resolve => setTimeout(resolve, 1000));
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
            // Priority 1: Try Cloud Function
            console.log(`Attempting to send friend request to ${friendId} via Cloud Function...`);
            return await callFunction<any, { success: boolean }>('sendFriendRequest', { friendId: String(friendId) });
        } catch (error) {
            // Priority 2: Fallback to direct client-side write if function fails
            console.warn("sendFriendRequest Cloud Function failed, attempting client-side fallback.", error);
            try {
                if (!auth.currentUser) throw new Error("Not authenticated for fallback.");
                
                const currentUser = auth.currentUser;
                const requestDoc = {
                    fromUid: currentUser.uid,
                    from: currentUser.displayName || '一位用戶',
                    status: 'pending',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                };

                // Correct Path: Write to the TARGET user's subcollection
                const targetUserRequestRef = db.collection('users').doc(String(friendId)).collection('receivedFriendRequests').doc(currentUser.uid);
                
                // Use set with doc(uid) to prevent duplicates
                await targetUserRequestRef.set(requestDoc);
                console.log("Client-side fallback for sendFriendRequest succeeded.");

                return { success: true };
            } catch (fallbackError) {
                console.error("Client-side fallback for sendFriendRequest also failed:", fallbackError);
                throw fallbackError;
            }
        }
    },
    
    respondFriendRequest: async (requesterId: string, accept: boolean): Promise<{ success: boolean }> => {
        if (!requesterId) {
            const error = new Error("無效的邀請：缺少邀請者 ID。");
            console.error(error);
            throw error;
        }

        try {
            const result = await callFunction<any, { success: boolean }>(
                'respondfriendrequest', 
                { requesterId: String(requesterId), accept }
            );

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
            console.error("respondFriendRequest failed:", error);
            throw error;
        }
    },

    // ✅ 修正後的 createPost using fetch to bypass SDK version issues
    createPost: async (content: string, storeName: string | undefined, imageUrl?: string) => {
        const user = auth.currentUser;
        if (!user) {
            throw new Error("請先登入");
        }
        
        // Sanitize imageUrl to be null if undefined
        const finalImageUrl = imageUrl || null;

        // Auto-generate content if empty and storeName exists
        let finalText = content?.trim() || "";
        if (!finalText && storeName) {
            finalText = `在 ${storeName} 打卡！`;
        }

        // 2. 取得 ID Token
        const token = await user.getIdToken();

        // 3. Directly use fetch to call the API
        const response = await fetch("https://createpost-47xkuwj3aa-uc.a.run.app", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                data: {
                    text: finalText,
                    imageUrl: finalImageUrl
                }
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            console.error("Create Post API Error:", errData);
            throw new Error(errData.error?.message || `發布失敗 (${response.status})`);
        }

        const resData = await response.json();
        return resData.result;
    },
};

// ============================================================================
// 5. 動態牆 (Feed & Posts)
// ============================================================================

export const getFeedItems = async (): Promise<FeedItem[]> => {
    try {
        const feedItems = await callFunction<undefined, FeedItem[]>('getFeed');
        return Array.isArray(feedItems) ? feedItems : [];
    } catch (error) {
        console.error("getFeedItems failed:", error);
        return [];
    }
};

export const getUserFeed = async (userId: string | number): Promise<FeedItem[]> => {
    if (!userId) return [];
    
    try {
        const q = db.collection("posts")
            .where("authorId", "==", String(userId))
            .orderBy("timestamp", "desc");
        const snapshot = await q.get();
        
        return snapshot.docs.map(doc => {
            const data = doc.data();
            // Field Translation
            return {
                id: doc.id,
                ...data,
                content: data.text || data.content || "",
                friendName: data.authorName || data.friendName || "未知用戶",
                friendAvatarUrl: data.authorAvatar || data.friendAvatarUrl || "",
                friendId: data.authorId || data.friendId,
                timestamp: convertTimestamp(data.timestamp),
                likes: data.likes || 0,
                comments: data.comments || [],
                clientSideId: data.clientSideId 
            } as FeedItem;
        });

    } catch (error) {
        console.error("getUserFeed failed:", error);
        return [];
    }
};

export const subscribeToFeed = (currentUserId: string, callback: (items: FeedItem[]) => void) => {
    const q = db.collection("posts")
        .orderBy("timestamp", "desc")
        .limit(50);

    return q.onSnapshot((snapshot) => {
        const items = snapshot.docs.map(doc => {
            const data = doc.data();
            const likedBy = data.likedBy || [];
            
            // Field Translation
            return {
                id: doc.id,
                ...data,
                content: data.text || data.content || "",
                friendName: data.authorName || data.friendName || "未知用戶",
                friendAvatarUrl: data.authorAvatar || data.friendAvatarUrl || "",
                friendId: data.authorId || data.friendId,
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
        const errorMsg = error.message || String(error);
        if (error.code === 'permission-denied' || errorMsg.includes('Missing or insufficient permissions') || errorMsg.includes('permission-denied')) {
             console.warn("Feed subscription permission denied. Using empty feed.");
             callback([]); 
        } else {
             console.error("Feed subscription error:", error);
        }
    });
};

export const feedApi = {
    getFeed: getFeedItems,
    getUserFeed,

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