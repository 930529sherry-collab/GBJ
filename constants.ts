
import { Store, Deal, Mission, UserProfile, FeedItem, Order, RedeemItem, Coupon, MockUser } from './types';

// Helper function to format date as YYYY-MM-DD
export const formatDate = (date: Date): string => {
    const d = new Date(date);
    const year = d.getFullYear();
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

// Helper to convert Firebase Timestamp or string to Date object
export const toDateObj = (dateInput: any): Date | null => {
    if (!dateInput) return null;
    
    if (typeof dateInput.toDate === 'function') return dateInput.toDate();
    if (typeof dateInput === 'object' && dateInput !== null && 'seconds' in dateInput) return new Date(dateInput.seconds * 1000);
    if (dateInput instanceof Date) return dateInput;
    return new Date(dateInput);
};

// Helper function to format date and time as YYYY/MM/DD HH:mm
export const formatDateTime = (dateInput: any): string => {
    const date = toDateObj(dateInput);
    if (!date || isNaN(date.getTime())) return '剛剛';

    return date.toLocaleString('zh-TW', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false,
        timeZone: 'Asia/Taipei'
    });
}

// Helper for Chat: Returns only time (e.g., 14:30)
export const formatTime = (dateInput: any): string => {
    const date = toDateObj(dateInput);
    if (!date || isNaN(date.getTime())) return '';

    return date.toLocaleString('zh-TW', {
        hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Taipei'
    });
};

// Helper for Chat: Returns only date (e.g., 2023/10/27) for headers
export const formatDateHeader = (dateInput: any): string => {
    const date = toDateObj(dateInput);
    if (!date || isNaN(date.getTime())) return '';

    return date.toLocaleString('zh-TW', {
        year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Taipei'
    });
};

const today = new Date();

// Helper to add/subtract days
export const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

export const MOCK_STORES: Store[] = [
  { 
    id: 1, name: 'Indulge Experimental Bistro', type: '實驗性餐酒館', distance: '1.0 公里', rating: 4.8, 
    // Image: Detailed cocktail with botanical elements (Tea/Nature theme)
    imageUrl: 'https://images.unsplash.com/photo-1599950755346-a3e58f84ca63?auto=format&fit=crop&w=800&q=80', 
    position: { top: '9.9%', left: '74.8%' }, availability: 'Available',
    address: '台北市大安區復興南路一段219巷11號',
    description: '同樣是亞洲50大酒吧的指標店家，將台灣茶葉與節氣融入調酒，提供精緻餐點，打造完整的感官饗宴。',
    reviews: [ {id: 1, author: '雪莉', rating: 5, comment: '環境優雅，調酒非常有創意！'} ],
    menu: [
      { id: 1, name: '節氣特調', price: 'NT$500', description: '根據當季的節氣設計的限定調酒。' },
      { id: 2, name: '炭焙烏龍', price: 'NT$480', description: '濃郁的茶香與烈酒的碰撞。' },
    ],
    latlng: { lat: 25.0416, lng: 121.5458 },
    hours: '週一至週日 18:00 - 02:00',
    phone: '02-2773-0080',
    priceRange: 'NT$500-800'
  },
  { 
    id: 2, name: 'AHA Saloon', type: '復古風格酒吧', distance: '1.2 公里', rating: 4.7, 
    // Image: Warm, vintage interior with bottles (Retro vibe)
    imageUrl: 'https://images.unsplash.com/photo-1543007630-9710e4a00a20?auto=format&fit=crop&w=800&q=80', 
    position: { top: '10.5%', left: '73.2%' }, availability: 'Busy',
    address: '台北市大安區復興南路二段138號',
    description: '亞洲50大酒吧常客，以台灣在地元素為靈感，創造出令人驚豔的調酒。店內裝潢充滿復古情懷。',
    reviews: [], menu: [], latlng: { lat: 25.0342, lng: 121.5435 },
  },
  { 
    id: 3, name: 'Bar Mood', type: '摩登雞尾酒吧', distance: '1.5 公里', rating: 4.9, 
    // Image: Sleek, high-end bar counter (Modern/Luxurious)
    imageUrl: 'https://images.unsplash.com/photo-1572116469696-958721b7d6ca?auto=format&fit=crop&w=800&q=80', 
    position: { top: '9.2%', left: '72.1%' }, availability: 'Full',
    address: '台北市大安區敦化南路一段160巷53號',
    description: '分為前後兩區，前區提供輕鬆的Tapas與雞尾酒，後區則是需要預約的隱密品飲空間，調酒極具深度。',
    reviews: [], menu: [], latlng: { lat: 25.0448, lng: 121.5487 }
  },
  {
    id: 4, name: 'Room by Le Kief', type: '實驗性雞尾酒吧', distance: '1.8 公里', rating: 4.8, 
    // Image: Moody, colorful drinks, dark background (Molecular/Experimental)
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80', 
    position: { top: '8.5%', left: '75.5%' }, availability: 'Available',
    address: '台北市大安區復興南路一段107巷5弄10號',
    description: '亞洲50大酒吧之一，以「分子料理」手法創作調酒，每一杯都是一場視覺與味覺的冒險。',
    reviews: [], menu: [], latlng: { lat: 25.0433, lng: 121.5441 }
  },
  {
    id: 5, name: 'Ounce Taipei', type: 'Speakeasy', distance: '2.0 公里', rating: 4.6, 
    // Image: Bartender pouring drink in dark setting (Speakeasy atmosphere)
    imageUrl: 'https://images.unsplash.com/photo-1566417713204-380160966333?auto=format&fit=crop&w=800&q=80', 
    position: { top: '11.2%', left: '72.8%' }, availability: 'Busy',
    address: '台北市大安區信義路四段30巷5號',
    description: '隱藏在咖啡店後的經典Speakeasy，無酒單，調酒師會根據你的喜好客製化專屬調酒。',
    reviews: [], menu: [], latlng: { lat: 25.0348, lng: 121.5524 }
  },
  {
    id: 6, name: 'CÉ LA VI Taipei', type: '高空景觀酒吧', distance: '3.5 公里', rating: 4.5, 
    // Image: City skyline at night (Rooftop/View)
    imageUrl: 'https://images.unsplash.com/photo-1533106958151-53e1d78d0e16?auto=format&fit=crop&w=800&q=80', 
    position: { top: '7.8%', left: '76.8%' }, availability: 'Available',
    address: '台北市信義區松智路17號48樓',
    description: '位於微風南山48樓，擁有絕佳的101夜景，是信義區最熱門的打卡聖地之一。',
    reviews: [], menu: [], latlng: { lat: 25.0336, lng: 121.5663 }
  }
];

export const MOCK_DEALS: Deal[] = [
    { id: 1, storeName: 'AHA Saloon', title: '週三特調之夜', description: '每週三指定特調買一送一，與好友共享微醺時光。', expiry: formatDate(addDays(today, 30)) },
    { id: 2, storeName: 'Ounce Taipei', title: 'Happy Hour 暢飲', description: '每日 18:00 - 20:00，精選經典調酒享 8 折優惠。', expiry: formatDate(addDays(today, 45)) },
    { id: 3, storeName: 'CÉ LA VI Taipei', title: '週末高空早午餐', description: '週末限定，點購任一早午餐套餐即贈送 Mimosa 一杯。', expiry: formatDate(addDays(today, 60)) },
    { id: 4, storeName: 'Indulge Experimental Bistro', title: '茶酒 pairings 優惠', description: '點購 tasting menu 並搭配全套茶酒 pairing，即可享 88 折優惠。', expiry: formatDate(addDays(today, 90)) },
    { id: 5, storeName: 'Bar Mood', title: '深夜食堂優惠', description: '晚上 11 點後，所有 Tapas 點心第二份半價。', expiry: formatDate(addDays(today, 35)) },
    { id: 6, storeName: 'Room by Le Kief', title: '分子調酒體驗組', description: '首次消費，點購任兩杯分子調酒，即贈送一份神秘實驗小點。', expiry: formatDate(addDays(today, 50)) },
    { id: 7, storeName: 'Indulge Experimental Bistro', title: '壽星專屬禮遇', description: '當月壽星憑證件消費，即可獲得主廚特製生日調酒一杯。', expiry: formatDate(addDays(today, 120)) },
    { id: 8, storeName: 'Bar Mood', title: '經典雞尾酒週', description: '本週限定，所有經典雞尾酒系列 (Old Fashioned, Negroni...) 享第二杯半價。', expiry: formatDate(addDays(today, 7)) },
];

// FIX: Explicitly type MISSIONS_FOR_IMPORT to ensure 'type' property is '"daily" | "special"' and not 'string'.
// This resolves a TypeScript error when creating INITIAL_MISSIONS and allows it to be exported for use in other files like ProfilePage.
export const MISSIONS_FOR_IMPORT: Array<Omit<Mission, 'current' | 'status' | 'claimed'>> = [
    // --- 每日任務 ---
    { id: 'daily_check_in', title: '每日打卡', description: '發布一則動態即算打卡', xpReward: 50, type: 'daily', target: 1 },
    { id: 'daily_chat', title: '每日聊天', description: '在聊天室發送一則訊息', xpReward: 30, type: 'daily', target: 1 },
    { id: 'daily_night_owl', title: '夜貓子', description: '不醉不歸！在深夜時段（00:00 - 04:00）完成一次酒吧打卡，享受城市的寧靜。', xpReward: 80, type: 'daily', target: 1 },
    { id: 'daily_weekend_warrior', title: '週末戰士', description: '工作辛苦了！在週六或週日前往酒吧打卡，放鬆一週的疲憊。', xpReward: 60, type: 'daily', target: 1 },
    { id: 'daily_friday_fever', title: '週五狂熱夜', description: '在最期待的週五夜晚前往任何酒吧打卡，用一杯好酒迎接週末自由。', xpReward: 50, type: 'daily', target: 1 },
    { id: 'daily_early_bird', title: '早鳥優惠', description: '懂得把握時間的聰明酒客！在傍晚 5 點到 7 點的 Happy Hour 黃金時段完成打卡。', xpReward: 50, type: 'daily', target: 1 },
  
    // --- 特殊任務 ---
    { id: 'special_first_check_in', title: '初來乍到', description: '完成你的第一次酒吧打卡，為你的酒吧探險傳奇寫下精彩序幕。', xpReward: 100, pointsReward: 50, type: 'special', target: 1 },
    { id: 'special_first_friend', title: '廣結善緣', description: '新增第一位好友', xpReward: 100, type: 'special', target: 1 },
    { id: 'special_photo_post', title: '微醺留影', description: '用照片記錄歡樂瞬間！發布一則附帶照片的動態，讓大家看看你的微醺模樣。', xpReward: 50, type: 'special', target: 1 },
    { id: 'special_reviewer', title: '評論家', description: '你的舌尖是社群米其林指南。為 3 間造訪過的酒吧留下星級評論與心得。', xpReward: 80, type: 'special', target: 3 },
    { id: 'special_social_butterfly', title: '社交蝴蝶', description: '展現你的揪團魅力！一週內發布 5 篇與不同好友歡聚的動態，成為派對核心。', xpReward: 60, type: 'special', target: 5 },
    { id: 'special_loyal_customer', title: '忠實顧客', description: '在同一間心愛酒吧累積打卡 5 次，讓調酒師都記得你，成為店家認證 VIP！', xpReward: 100, type: 'special', target: 5 },
    { id: 'special_explorer', title: '探險家', description: '挑戰極限！在動態一晚內探訪 3 間不同風格酒吧並打卡，證明你是城市酒吧專家。', xpReward: 100, pointsReward: 20, type: 'special', target: 3 },
    { id: 'special_popular', title: '人氣王', description: '你是社群焦點！發布的一則動態獲得 30 個讚，證明你的高人氣！', xpReward: 80, type: 'special', target: 30 },
    { id: 'special_ultimate_explorer', title: '終極探險家', description: '城市霓虹都為你而亮！累積在 10 間完全不同的酒吧打卡，解鎖榮耀稱號。', xpReward: 150, pointsReward: 100, type: 'special', target: 10 },
    { id: 'special_level_5', title: '明日之星', description: '達到等級 5', xpReward: 500, type: 'special', target: 5 },
];

// This is what a new user gets. It includes progress fields.
export const INITIAL_MISSIONS: Mission[] = MISSIONS_FOR_IMPORT.map(mission => ({
    ...mission,
    current: 0,
    status: 'ongoing',
    claimed: false,
}));


export const MOCK_USER_PROFILE: UserProfile = {
  id: '101',
  name: '雪莉',
  displayName: '雪莉',
  avatarUrl: 'https://picsum.photos/200/200?random=101',
  level: 5,
  xp: 120,
  xpToNextLevel: 300,
  points: 250,
  missionsCompleted: 8,
  checkIns: 15,
  email: 'sherry@example.com',
  phone: '0987-654-321',
  friends: ['102', '103'],
  friendCode: 'GUNBOOJO-SHERRY',
  latlng: { lat: 25.0479, lng: 121.5318 },
  missions: INITIAL_MISSIONS,
} as UserProfile;

export const MOCK_USERS: MockUser[] = [
  { id: '101', email: 'sherry@example.com', password: 'password123', profile: MOCK_USER_PROFILE },
  {
    id: '102',
    email: 'brian@example.com',
    password: 'password123',
    profile: {
      id: '102', name: '布萊恩', displayName: '布萊恩', avatarUrl: 'https://picsum.photos/200/200?random=102', level: 3, xp: 50, xpToNextLevel: 150,
      points: 120, missionsCompleted: 4, checkIns: 8, friends: ['101'], friendCode: 'GUNBOOJO-BRIAN', latlng: { lat: 25.051, lng: 121.545 }, missions: INITIAL_MISSIONS,
    } as UserProfile
  },
  {
    id: '103',
    email: 'cathy@example.com',
    password: 'password123',
    profile: {
      id: '103', name: '凱西', displayName: '凱西', avatarUrl: 'https://picsum.photos/200/200?random=103', level: 7, xp: 400, xpToNextLevel: 500,
      points: 500, missionsCompleted: 12, checkIns: 22, friends: ['101'], friendCode: 'GUNBOOJO-CATHY', latlng: { lat: 25.033, lng: 121.565 }, missions: INITIAL_MISSIONS,
    } as UserProfile
  },
];

export const MOCK_FEED_ITEMS: FeedItem[] = [];

export const MOCK_ORDERS: Order[] = [];

export const MOCK_REDEEM_ITEMS: RedeemItem[] = [
  { id: 1, title: '獨家貼紙組', description: '乾不揪吉祥物「阿揪」的限量防水貼紙，讓你的筆電、手機與眾不同。', cost: 100 },
  { id: 2, title: 'Shot 杯一只', description: '印有「乾不揪」Logo 的經典 Shot 杯，適合在家獨飲或與友同歡。', cost: 250 },
  { id: 3, title: '指定店家 $100 折價券', description: '可於「AHA Saloon」、「Bar Mood」兌換使用的 $100 現金折價券。', cost: 500 },
  { id: 4, title: '乾不揪限量 T-Shirt', description: '高品質純棉 T-Shirt，印有「不怕沒人喝，只怕你不揪」標語，潮流又有型。', cost: 1200 },
];

// Defined Welcome Coupons to be used across the app
export const WELCOME_COUPONS: Coupon[] = [
    {
        id: 999001, storeName: '乾不揪官方', title: '新戶見面禮：$50 折價券',
        description: '全平台合作店家消費滿 $500 現折 $50。',
        expiry: formatDate(addDays(today, 30)), status: 'valid'
    },
    {
        id: 999002, storeName: '乾不揪官方', title: '新戶微醺禮：免費 Shot 一杯',
        description: '憑券至指定合作酒吧兌換迎賓 Shot 一杯。',
        expiry: formatDate(addDays(today, 30)), status: 'valid'
    },
    {
        id: 999003, storeName: '乾不揪官方', title: '好友歡聚：整單 9 折',
        description: '與至少一位好友同行消費，即可享受整單九折優惠。',
        expiry: formatDate(addDays(today, 45)), status: 'valid'
    }
];

export const MOCK_COUPONS: Coupon[] = [...WELCOME_COUPONS];

export const MOCK_REDEMPTION_CODES: { [key: string]: { couponTemplate: Omit<Coupon, 'id' | 'expiry' | 'status'>, daysValid: number } } = {
    'WELCOME2024': {
        couponTemplate: {
            storeName: '乾不揪官方',
            title: '獨家活動：全平台 85 折',
            description: '使用 WELCOME2024 兌換碼，全平台合作店家消費享 85 折優惠。',
        },
        daysValid: 60,
    },
};
