
export interface Review {
  id: number | string;
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
  id: number;
  title: string;
  description: string;
  reward: {
    xp: number;
    points?: number;
  };
  progress: number;
  goal: number;
  type: 'daily' | 'special';
}

// FIX: Export CheckInHistoryItem to be used in other files.
export interface CheckInHistoryItem {
  storeId: string | number;
  storeName: string;
  timestamp: string;
}

export interface UserProfile {
  id: string; // Firebase UID
  name?: string;
  avatarUrl: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  points: number;
  checkIns: number;
  email?: string;
  phone?: string;
  friends: (string | number)[];
  latlng: { lat: number; lng: number };
  friendCode?: string; // Legacy
  appId?: string;
  appId_upper?: string;
  displayName?: string;
  displayName_lower?: string;
  notifications?: Notification[];
  hasReceivedWelcomeGift?: boolean;
  isGuest?: boolean;
  profileVisibility?: 'public' | 'friends' | 'private';
  coupons?: Coupon[];
  // FIX: Use the exported CheckInHistoryItem type.
  checkInHistory?: CheckInHistoryItem[];
  missionProgress?: { [key: number]: number };
  completedMissionIds?: number[];
  // FIX: Add 'missions' property to support new mission structure.
  missions?: (Mission & { claimed: boolean; status?: string })[];
  hasReceivedWelcomeNotifications?: boolean;
  dailyMissionLastReset?: string; // YYYY-MM-DD
  hasUnreadChats?: boolean;
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
    timestamp: any;
    storeName?: string;
}

export interface FeedItem {
  id: number | string;
  clientSideId?: string;
  friendId: number | string;
  friendName: string;
  friendAvatarUrl: string;
  type?: 'check-in' | 'mission-complete' | 'new-friend';
  content: string;
  storeId?: number | string;
  storeName?: string;
  missionTitle?: string;
  imageUrl?: string;
  timestamp: any;
  likes: number;
  isLiked: boolean;
  comments: Comment[];
  likedBy?: (string | number)[];
  authorId?: string | number;
  visibility?: 'public' | 'friends' | 'private';
}


export interface Order {
  id: string;
  userId: string | number;
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
  userId: string | number;
  storeId: number | string;
  storeName: string;
  drinkName: string;
  rating: number;
  notes: string;
  date: string;
  imageUrl?: string;
}

export interface FriendRequest {
    id: string; 
    senderUid: string;
    recipientId: string;
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
