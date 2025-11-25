
import { FirebaseFirestore } from "@firebase/firestore-types";

export interface Review {
  id: number | string; // Allow string for firestore
  authorId?: string | number;
  author: string;
  rating: number;
  comment: string;
}

export interface MenuItem {
  id: number;
  name: string;
  price: string;
  description: string;
}

export interface Store {
  id: number | string;
  name: string;
  type: string;
  distance: string;
  rating: number;
  imageUrl: string;
  position: { top: string; left: string };
  availability: 'Available' | 'Busy' | 'Full';
  address: string;
  description: string;
  reviews: Review[];
  menu: MenuItem[];
  latlng: { lat: number; lng: number };
  hours?: string;
  phone?: string;
  priceRange?: string;
}

export interface Friend {
  id: number | string;
  name: string;
  lastCheckIn: string;
  avatarUrl: string;
  position: { top: string; left: string };
  latlng: { lat: number; lng: number };
  distance?: number;
  onlineStatus?: boolean;
}

export interface Deal {
  id: number | string;
  storeName: string;
  title: string;
  description: string;
  expiry: string;
}

export interface Mission {
  id: string; // e.g. 'daily_check_in'
  title: string;
  description: string;
  xpReward: number;
  pointsReward?: number;
  type: 'daily' | 'special';
  target: number; 
  current: number;
  status: 'ongoing' | 'completed';
  claimed?: boolean; // For special missions that are permanently done
}

export interface UserProfile {
  id: number | string;
  name?: string;
  avatarUrl: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  points: number;
  missionsCompleted: number;
  checkIns: number;
  email?: string;
  phone?: string;
  friends: (number | string)[];
  latlng: { lat: number; lng: number };
  friendCode?: string;
  appId?: string;
  displayName?: string;
  displayName_lower?: string;
  notifications?: Notification[];
  hasReceivedWelcomeGift?: boolean;
  hasReceivedWelcomeNotifications?: boolean; // New flag
  isGuest?: boolean; // New flag to identify guest users
  missions: Mission[]; // New mission system
  lastResetDate?: string; // YYYY-MM-DD
  hasUnreadChats?: boolean; // Flag to show red dot on chat icon
  profileVisibility?: 'public' | 'friends' | 'private';
  coupons?: Coupon[]; // Store coupons in the cloud
  checkInHistory?: { storeId: string | number; storeName: string; timestamp: string; }[]; // Permanent check-in log
}


export interface Notification {
    id?: string;
    type: string;
    message: string;
    timestamp: any;
    read: boolean;
}

export interface MockUser {
    id: number | string;
    email: string;
    password: string;
    profile: UserProfile;
}

export interface Comment {
    id: number | string;
    authorId?: string | number;
    authorName: string;
    authorAvatarUrl: string;
    text: string;
    timestamp: any; // Can be string or Firestore Timestamp
    storeName?: string;
}

export interface FeedItem {
  id: number | string;
  clientSideId?: string; // Unique ID generated on client to match local/cloud posts
  friendId: number | string;
  friendName: string;
  friendAvatarUrl: string;
  type?: 'check-in' | 'mission-complete' | 'new-friend';
  content: string;
  storeId?: number | string; // NEW: Store ID for direct linking
  storeName?: string;
  missionTitle?: string;
  imageUrl?: string;
  timestamp: any; // Can be string or Firestore Timestamp
  likes: number;
  isLiked: boolean;
  comments: Comment[];
  likedBy?: (string | number)[];
  authorId?: string | number; // Explicit author ID for ownership checks
  visibility?: 'public' | 'friends' | 'private'; // New visibility field
}


export interface Order {
  id: string;
  userId: string | number; // Owner ID
  storeName: string;
  date: string;
  time: string;
  people: number;
  status: 'Confirmed' | 'Completed' | 'Cancelled';
}

export interface FriendProfile extends UserProfile {
    recentActivity: FeedItem[];
}

export interface FriendDetail {
    id: number | string;
    name: string;
    avatarUrl: string;
    level: number;
    lastCheckIn: string;
}

export interface SearchableUser {
    id: number | string;
    name: string;
    avatarUrl: string;
    level: number;
    isFriend: boolean;
}

export interface RedeemItem {
    id: number;
    title: string;
    description: string;
    cost: number;
}

export interface Coupon {
    id: number;
    storeName: string;
    title: string;
    description: string;
    expiry: string;
    status: 'valid' | 'used' | 'expired';
}

export interface JournalEntry {
  id: string;
  userId: string | number; // Owner ID
  storeId: number | string; // Allow string
  storeName: string;
  drinkName: string;
  rating: number;
  notes: string;
  date: string; // YYYY-MM-DD format
  imageUrl?: string;
}

// New type for real-time friend requests from the subcollection
export interface FriendRequest {
    id: string; // This will be the document ID from receivedFriendRequests subcollection
    senderUid: string;
    senderName: string;
    senderAvatarUrl: string;
    status: 'pending' | 'accepted' | 'declined';
    timestamp: any;
}

export interface ChatMessage {
  id: string;
  text: string;
  senderId: string | number;
  timestamp: any;
}
