

import { UserProfile, SearchableUser, MockUser } from '../types';
import { MOCK_USERS } from '../constants';

// Helper to get users from localStorage, initializing if not present.
const getUsersFromStorage = (): MockUser[] => {
    const users = localStorage.getItem('users');
    if (users) {
        return JSON.parse(users);
    }
    localStorage.setItem('users', JSON.stringify(MOCK_USERS));
    return MOCK_USERS;
};

// Helper to save users back to localStorage.
const saveUsersToStorage = (users: MockUser[]) => {
    localStorage.setItem('users', JSON.stringify(users));
};

/**
 * NOTE: This function is part of the original API and is no longer used
 * in the simplified, login-less version of the app.
 */
export const createUser = async (email: string, displayName: string): Promise<UserProfile> => {
  if (!email || !displayName) {
    throw new Error('Email and display name are required');
  }

  try {
    const res = await fetch("https://createuser-47xkuwj3aa-uc.a.run.app", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, displayName }),
    });

    const responseBody = await res.json();

    if (!res.ok) {
      console.error("Create user failed with status:", res.status, "body:", responseBody);
      const errorMsg = responseBody?.error?.message || 'Bad Request';
      throw new Error(`Failed to create user: ${errorMsg}`);
    }

    return responseBody;
  } catch (err) {
    console.error("Error in createUser:", err);
    if (err instanceof Error) {
        throw err;
    }
    throw new Error('An unknown error occurred during user creation.');
  }
};


/**
 * Adds a friend to a user's friend list using localStorage.
 * @param userId - The ID of the user adding a friend.
 * @param friendId - The ID of the user to add as a friend.
 * @returns A promise that resolves when the friend is added.
 */
export const addFriend = async (userId: number, friendId: number): Promise<void> => {
    return new Promise((resolve, reject) => {
        setTimeout(() => { // Simulate async latency
            try {
                const users = getUsersFromStorage();
                const userIndex = users.findIndex(u => u.id === userId);
                const friendIndex = users.findIndex(u => u.id === friendId);

                if (userIndex === -1 || friendIndex === -1) {
                    throw new Error("User or friend not found");
                }

                // Add friend to user's list (if not already present)
                const user = users[userIndex];
                if (!user.profile.friends.includes(friendId)) {
                    user.profile.friends.push(friendId);
                }
                
                // Make friendship symmetric
                const friend = users[friendIndex];
                if (!friend.profile.friends.includes(userId)) {
                    friend.profile.friends.push(userId);
                }

                saveUsersToStorage(users);
                resolve();
            } catch (e) {
                reject(e);
            }
        }, 300);
    });
};

/**
 * Retrieves a user's friend list from localStorage.
 * @param userId - The ID of the user whose friends to retrieve.
 * @returns A promise that resolves to an array of friend profiles.
 */
export const getFriends = async (userId: number): Promise<UserProfile[]> => {
     return new Promise((resolve, reject) => {
        setTimeout(() => { // Simulate async latency
            try {
                const users = getUsersFromStorage();
                const user = users.find(u => u.id === userId);
                if (!user) {
                    resolve([]);
                    return;
                }
                
                const friendIds = user.profile.friends;
                const friendProfiles = users
                    .filter(u => friendIds.includes(u.id))
                    .map(u => u.profile);

                resolve(friendProfiles);
            } catch (e) {
                reject(e);
            }
        }, 300);
    });
};

/**
 * Searches for users in localStorage.
 * @param query - The search term (e.g., name or friend code).
 * @returns A promise that resolves to an array of searchable user objects.
 */
export const searchUsers = async (query: string): Promise<Omit<SearchableUser, 'isFriend'>[]> => {
    return new Promise((resolve) => {
        setTimeout(() => { // Simulate async latency
            const users = getUsersFromStorage();
            const lowerCaseQuery = query.toLowerCase();
            if (!lowerCaseQuery) {
                resolve([]);
                return;
            }
            const results = users
                .filter(u => 
                    u.profile.name.toLowerCase().includes(lowerCaseQuery) || 
                    u.profile.friendCode?.toLowerCase().includes(lowerCaseQuery)
                )
                .map(u => ({
                    id: u.id,
                    name: u.profile.name,
                    avatarUrl: u.profile.avatarUrl,
                    level: u.profile.level,
                }));
            resolve(results);
        }, 300);
    });
};