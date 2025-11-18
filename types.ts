
export interface Review {
  id: number;
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
  id: number;
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
  id: number;
  name: string;
  lastCheckIn: string;
  avatarUrl: string;
  position: { top: string; left: string };
  latlng: { lat: number; lng: number };
}

export interface Deal {
  id: number;
  storeName: string;
  title: string;
  description: string;
  expiry: string;
}

export interface Mission {
  id: number;
  title: string;
  description: string;
  reward: { xp?: number; points?: number };
  progress: number;
  goal: number;
  claimed?: boolean;
}

export interface UserProfile {
  id: number;
  name: string;
  avatarUrl: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  points: number;
  missionsCompleted: number;
  checkIns: number;
  email?: string;
  phone?: string;
  friends: number[];
  latlng: { lat: number; lng: number };
  friendCode?: string;
}

export interface MockUser {
    id: number;
    email: string;
    password: string;
    profile: UserProfile;
}

export interface Comment {
    id: number;
    authorName: string;
    authorAvatarUrl: string;
    text: string;
    timestamp: string;
    storeName?: string;
}

export interface FeedItem {
  id: number;
  friendId: number;
  friendName: string;
  friendAvatarUrl: string;
  type: 'check-in' | 'mission-complete' | 'new-friend';
  content: string;
  storeName?: string;
  missionTitle?: string;
  imageUrl?: string;
  timestamp: string;
  likes: number;
  isLiked: boolean;
  comments: Comment[];
}

export interface Order {
  id: string;
  storeName: string;
  date: string;
  time: string;
  people: number;
  status: 'Confirmed' | 'Completed' | 'Cancelled';
}

export interface FriendProfile {
    id: number;
    name: string;
    avatarUrl: string;
    level: number;
    xp: number;
    xpToNextLevel: number;
    points: number;
    missionsCompleted: number;
    checkIns: number;
    recentActivity: FeedItem[];
    friends: number[];
}

export interface FriendDetail {
    id: number;
    name: string;
    avatarUrl: string;
    level: number;
    lastCheckIn: string;
}

export interface SearchableUser {
    id: number;
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
  id: number;
  storeId: number;
  storeName: string;
  drinkName: string;
  rating: number;
  notes: string;
  date: string; // YYYY-MM-DD format
  imageUrl?: string;
}