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

const today = new Date();

// Helper to add/subtract days
export const addDays = (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

export const MOCK_STORES: Store[] = [
  { 
    id: 1, name: 'Indulge Experimental Bistro', type: '實驗性餐酒館', distance: '1.0 公里', rating: 4.8, imageUrl: 'https://picsum.photos/400/300?random=2', position: { top: '9.9%', left: '74.8%' }, availability: 'Available',
    address: '台北市大安區復興南路一段219巷11號',
    description: '同樣是亞洲50大酒吧的指標店家，將台灣茶葉與節氣融入調酒，提供精緻餐點，打造完整的感官饗宴。',
    reviews: [],
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
    id: 2, name: 'Draft Land (站著喝)', type: '汲飲式雞尾酒吧', distance: '0.8 公里', rating: 4.6, imageUrl: 'https://picsum.photos/400/300?random=3', position: { top: '10.1%', left: '75.2%' }, availability: 'Full',
    address: '台北市大安區忠孝東路四段248巷2號',
    description: '亞洲首間汲飲式雞尾酒吧，提供高品質且快速的雞尾酒體驗。隨性、自由的氛圍，適合下班後快速喝一杯。',
    reviews: [
      { id: 2, author: '小資族', rating: 4, comment: '價格實惠，很適合當作跑吧的第一站。' },
    ],
    menu: [
      { id: 1, name: '茉莉花 G&T', price: 'NT$250', description: '清爽的琴通寧，帶有淡雅花香。' },
      { id: 2, name: '鐵觀音 Sour', price: 'NT$280', description: '酸甜平衡，尾韻帶有茶感。' },
    ],
    latlng: { lat: 25.0410, lng: 121.5544 },
    hours: '週一至週日 18:00 - 01:00',
    phone: '02-2731-8975',
    priceRange: 'NT$250-350'
  },
  { 
    id: 3, name: 'Bar Mood Taipei 吧沐', type: '質感雞尾酒吧', distance: '1.2 公里', rating: 4.7, imageUrl: 'https://picsum.photos/400/300?random=4', position: { top: '9.8%', left: '75.1%' }, availability: 'Available',
    address: '台北市大安區敦化南路一段160巷53號',
    description: '分為前後兩區，提供截然不同的氛圍。前區輕鬆明亮，後區則是以茶、香草、木質調為主的沈穩空間。',
    reviews: [
      { id: 1, author: '設計師', rating: 5, comment: '空間設計超美，調酒也很有水準，拍照很好看。' },
    ],
    menu: [
      { id: 1, name: '花草系列特調', price: 'NT$420', description: '使用自種新鮮香草調製。' },
      { id: 2, name: '烏龍 Highball', price: 'NT$400', description: '清爽解渴，茶香四溢。' },
    ],
    latlng: { lat: 25.0448, lng: 121.5516 },
    hours: '週一至週日 18:00 - 02:00',
    phone: '02-2775-3592',
    priceRange: 'NT$400-600'
  },
  { 
    id: 4, name: 'Ounce Taipei', type: 'Speakeasy', distance: '0.5 公里', rating: 4.9, imageUrl: 'https://picsum.photos/400/300?random=5', position: { top: '11.8%', left: '75.0%' }, availability: 'Busy',
    address: '台北市大安區信義路四段30巷',
    description: '隱藏在咖啡廳後的道地 Speakeasy，主打經典調酒與客製化服務，是許多雞尾酒愛好者的口袋名單。',
    reviews: [],
    menu: [],
    latlng: { lat: 25.0345, lng: 121.5492 },
    hours: '週一至週六 19:00 - 02:00 (週日公休)',
    phone: '02-2703-7761',
    priceRange: 'NT$450-700'
  },
  { 
    id: 5, name: 'Fourplay Cuisine', type: '無酒單創意酒吧', distance: '1.8 公里', rating: 4.8, imageUrl: 'https://picsum.photos/400/300?random=6', position: { top: '11.5%', left: '74.9%' }, availability: 'Busy',
    address: '台北市大安區東豐街67號',
    description: '以創意、趣味的無酒單調酒聞名，告訴調酒師你喜歡的口味，他們會為你創造一杯驚喜。',
    reviews: [],
    menu: [],
    latlng: { lat: 25.0360, lng: 121.5490 },
    hours: '週一至週日 18:00 - 02:00',
    phone: '02-2708-3898',
    priceRange: 'NT$400-600'
  },
  { 
    id: 6, name: 'To Infinity and Beyond', type: '實驗性酒吧', distance: '0.9 公里', rating: 4.7, imageUrl: 'https://picsum.photos/400/300?random=7', position: { top: '9.8%', left: '75.0%' }, availability: 'Available',
    address: '台北市大安區敦化南路一段160巷13號',
    description: 'AHA Saloon 團隊的第二間店，風格更為前衛與實驗性，挑戰你對調酒的想像。',
    reviews: [],
    menu: [],
    latlng: { lat: 25.0440, lng: 121.5501 },
    hours: '週二至週日 19:00 - 01:00 (週一公休)',
    phone: '02-2771-3988',
    priceRange: 'NT$450-650'
  },
  { 
    id: 7, name: 'R&D Cocktail Lab', type: '實驗室主題酒吧', distance: '2.0 公里', rating: 4.6, imageUrl: 'https://picsum.photos/400/300?random=8', position: { top: '10.4%', left: '75.3%' }, availability: 'Full',
    address: '台北市大安區延吉街178號',
    description: '裝潢如同化學實驗室，調酒師身穿白袍，提供各種新奇有趣的客製化調酒。',
    reviews: [],
    menu: [],
    latlng: { lat: 25.0398, lng: 121.5568 },
    hours: '週一至週日 18:30 - 02:00',
    phone: '02-2731-0333',
    priceRange: 'NT$400-600'
  },
  { 
    id: 8, name: 'The Public House', type: '英式酒吧', distance: '0.7 公里', rating: 4.5, imageUrl: 'https://picsum.photos/400/300?random=10', position: { top: '11.9%', left: '75.1%' }, availability: 'Busy',
    address: '台北市大安區信義路四段143號',
    description: '提供舒適的英式酒吧氛圍，有精選的威士忌、啤酒以及經典的英式餐點。',
    reviews: [],
    menu: [],
    latlng: { lat: 25.0333, lng: 121.5532 },
    hours: '週一至週日 17:00 - 01:00',
    phone: '02-2708-0168',
    priceRange: 'NT$350-550'
  },
  { 
    id: 9, name: 'HANKO 60', type: '戲院主題 Speakeasy', distance: '3.0 公里', rating: 4.8, imageUrl: 'https://picsum.photos/400/300?random=13', position: { top: '9.6%', left: '73.1%' }, availability: 'Full',
    address: '台北市萬華區漢口街二段60號',
    description: '偽裝成老戲院的入口，內部裝潢充滿港式懷舊風情，調酒有趣且好拍。',
    reviews: [],
    menu: [],
    latlng: { lat: 25.0468, lng: 121.5080 },
    hours: '週一至週日 18:00 - 02:00',
    phone: '02-2381-0808',
    priceRange: 'NT$350-550'
  },
  { 
    id: 10, name: 'CÉ LA VI Taipei', type: '高空景觀酒吧', distance: '3.5 公里', rating: 4.7, imageUrl: 'https://picsum.photos/400/300?random=15', position: { top: '12.0%', left: '75.7%' }, availability: 'Busy',
    address: '台北市信義區松智路17號48樓',
    description: '位於微風南山48樓，坐擁101百萬夜景，是台北最具代表性的高空酒吧之一。',
    reviews: [],
    menu: [],
    latlng: { lat: 25.0329, lng: 121.5663 },
    hours: '週日至週四 21:00 - 02:30, 週五六 21:00 - 03:00',
    phone: '0909-956-000',
    priceRange: 'NT$500-800'
  },
  { 
    id: 11, name: '榕 Xinyi', type: '複合式音樂酒吧', distance: '1.9 公里', rating: 4.5, imageUrl: 'https://picsum.photos/400/300?random=16', position: { top: '11.5%', left: '75.5%' }, availability: 'Available',
    address: '台北市信義區基隆路二段12號',
    description: '結合音樂、美食與調酒的空間，氣氛輕鬆自在，時常有獨立樂團或 DJ 表演。',
    reviews: [],
    menu: [],
    latlng: { lat: 25.0359, lng: 121.5615 },
    hours: '週日至週四 12:00 - 02:00, 週五六 12:00 - 03:00',
    phone: '02-2720-0028',
    priceRange: 'NT$350-550'
  },
  {
    id: 12, name: 'TCRC 前科累累俱樂部', type: 'Speakeasy', distance: '298 公里', rating: 4.9, imageUrl: 'https://picsum.photos/400/300?random=17', position: { top: '68.7%', left: '13.7%' }, availability: 'Full',
    address: '台南市中西區新美街117號',
    description: '台南傳奇性的無酒單酒吧，也是亞洲50大酒吧的常客。以其強烈的本地特色和高品質的客製化調酒而聞名。',
    reviews: [],
    menu: [],
    latlng: { lat: 22.9951, lng: 120.2017 },
    hours: '週一至週六 20:00 - 02:00 (週日公休)',
    phone: '06-222-8716',
    priceRange: 'NT$400-600'
  },
  {
    id: 13, name: 'Vender Bar', type: '自動販賣機主題 Speakeasy', distance: '165 公里', rating: 4.7, imageUrl: 'https://picsum.photos/400/300?random=18', position: { top: '39.6%', left: '35.6%' }, availability: 'Busy',
    address: '台中市西區向上路一段79巷56號',
    description: '入口隱藏在一台復古自動販賣機後面，店內空間不大但氛圍極佳，提供許多創意且有趣的調酒。',
    reviews: [],
    menu: [],
    latlng: { lat: 24.1457, lng: 120.6670 },
    hours: '週一至週日 20:00 - 03:00',
    phone: '04-2301-1180',
    priceRange: 'NT$350-550'
  },
  {
    id: 14, name: 'Bar Gaz', type: '日式雞尾酒吧', distance: '350 公里', rating: 4.8, imageUrl: 'https://picsum.photos/400/300?random=19', position: { top: '76.5%', left: '18.0%' }, availability: 'Available',
    address: '高雄市前金區自強一路159巷19號',
    description: '隱身在巷弄中的低調酒吧，主理人來自日本，提供非常正統且細膩的日式調酒服務，氛圍沉靜舒適。',
    reviews: [],
    menu: [],
    latlng: { lat: 22.622, lng: 120.297 },
    hours: '週二至週日 19:00 - 01:00 (週一公休)',
    phone: '07-251-1770',
    priceRange: 'NT$400-600'
  },
  {
    id: 15, name: 'Lasa', type: '原住民風格酒吧', distance: '120 公里', rating: 4.6, imageUrl: 'https://picsum.photos/400/300?random=20', position: { top: '44.4%', left: '77.5%' }, availability: 'Busy',
    address: '花蓮縣花蓮市博愛街104-1號',
    description: '將花蓮在地與原住民文化融入調酒之中，使用小米酒、馬告等特殊食材，創造出獨一無二的風味。',
    reviews: [],
    menu: [],
    latlng: { lat: 23.976, lng: 121.605 },
    hours: '週三至週一 19:00 - 01:00 (週二公休)',
    phone: '03-832-6469',
    priceRange: 'NT$300-500'
  },
  { 
    id: 16, name: 'Another Round', type: '經典雞尾酒吧', distance: '1.1 公里', rating: 4.7, imageUrl: 'https://picsum.photos/400/300?random=21', position: { top: '10.9%', left: '75.0%' }, availability: 'Available',
    address: '台北市大安區敦化南路一段233巷49號1樓',
    description: '輕鬆的美式氛圍，提供專業的經典調酒與精釀啤酒，是與朋友聚會的好去處。',
    reviews: [], menu: [], latlng: { lat: 25.0418, lng: 121.5510 },
    hours: '週一至週日 18:00 - 02:00',
    phone: '02-2778-0080',
    priceRange: 'NT$350-550'
  },
  { 
    id: 17, name: 'East End Bar', type: '飯店特色酒吧', distance: '1.3 公里', rating: 4.8, imageUrl: 'https://picsum.photos/400/300?random=22', position: { top: '10.9%', left: '75.2%' }, availability: 'Busy',
    address: '台北市大安區忠孝東路四段216巷11弄16號',
    description: '位於賦樂旅居頂樓，與世界頂級調酒師合作，提供全球指標性的調酒，視野絕佳。',
    reviews: [], menu: [], latlng: { lat: 25.0415, lng: 121.5543 },
    hours: '週日至週四 14:00 - 01:00, 週五六 14:00 - 02:00',
    phone: '0903-531-851',
    priceRange: 'NT$450-700'
  },
  { 
    id: 18, name: 'Geography Bar', type: '威士忌酒吧', distance: '0.9 公里', rating: 4.6, imageUrl: 'https://picsum.photos/400/300?random=23', position: { top: '10.1%', left: '74.7%' }, availability: 'Available',
    address: '台北市大安區復興南路一段107巷5弄16號',
    description: '藏酒豐富，尤其以威士忌收藏聞名。店內氛圍沉穩，適合威士忌愛好者探索品飲。',
    reviews: [], menu: [], latlng: { lat: 25.0445, lng: 121.5439 },
    hours: '週一至週六 19:00 - 01:00 (週日公休)',
    phone: '02-2776-0066',
    priceRange: 'NT$400-800'
  },
  { 
    id: 19, name: 'Wa-Shu 和酒', type: '日式利口酒酒吧', distance: '1.5 公里', rating: 4.9, imageUrl: 'https://picsum.photos/400/300?random=24', position: { top: '11.4%', left: '75.1%' }, availability: 'Full',
    address: '台北市大安區安和路二段76巷40號',
    description: '專注於使用自製的日本水果酒與利口酒，創造出獨特風味的調酒，充滿和風情懷。',
    reviews: [], menu: [], latlng: { lat: 25.0298, lng: 121.5522 },
    hours: '週一至週六 19:00 - 01:00 (週日公休)',
    phone: '02-2707-0809',
    priceRange: 'NT$450-650'
  },
  { 
    id: 20, name: 'Tei by O’bond', type: '茶酒吧', distance: '1.6 公里', rating: 4.8, imageUrl: 'https://picsum.photos/400/300?random=27', position: { top: '11.4%', left: '75.2%' }, availability: 'Busy',
    address: '台北市大安區光復南路240巷51號',
    description: 'O’bond團隊的茶酒吧，將台灣茶道精神融入調酒，創造出細膩優雅的品飲體驗。',
    reviews: [
      { id: 1, author: '茶藝愛好者', rating: 5, comment: '茶與酒的平衡做得非常好，每一杯都像藝術品。' },
    ],
    menu: [], latlng: { lat: 25.0400, lng: 121.5560 },
    hours: '週二至週日 19:00 - 01:00 (週一公休)',
    phone: '02-2771-0260',
    priceRange: 'NT$450-650'
  },
  { 
    id: 21, name: 'KOR Taipei', type: '時尚 Lounge Bar', distance: '3.6 公里', rating: 4.5, imageUrl: 'https://picsum.photos/400/300?random=25', position: { top: '11.2%', left: '75.7%' }, availability: 'Full',
    address: '台北市信義區松壽路12號ATT 4 FUN 5樓',
    description: '結合嘻哈音樂與高級訂製酒單，是台北夜生活的指標之一，氛圍時尚且充滿活力。',
    reviews: [], menu: [], latlng: { lat: 25.0354, lng: 121.5661 },
    hours: '週三至週日 22:30 - 04:30 (週一二公休)',
    phone: '0966-331-033',
    priceRange: 'NT$500-800'
  },
  { 
    id: 22, name: 'FRANK Taipei', type: '高空景觀酒吧', distance: '3.6 公里', rating: 4.6, imageUrl: 'https://picsum.photos/400/300?random=26', position: { top: '11.2%', left: '75.7%' }, availability: 'Busy',
    address: '台北市信義區松壽路12號ATT 4 FUN 10樓',
    description: '擁有絕佳的101景觀，分為室內與戶外區，音樂與調酒都極具水準，是派對的熱門地點。',
    reviews: [], menu: [], latlng: { lat: 25.0354, lng: 121.5661 },
    hours: '週日至週四 18:00 - 02:00, 週五六 18:00 - 03:00',
    phone: '0909-0 FRANK',
    priceRange: 'NT$500-800'
  },
  { 
    id: 23, name: 'Asia 49', type: '高空景觀餐酒館', distance: '8.5 公里', rating: 4.7, imageUrl: 'https://picsum.photos/400/300?random=28', position: { top: '10.9%', left: '71.1%' }, availability: 'Busy',
    address: '新北市板橋區新站路16號百揚大樓49樓',
    description: '新北第一高樓景觀餐廳，擁有360度環繞視野，提供亞洲風味美食與特色調酒。',
    reviews: [], menu: [], latlng: { lat: 25.0135, lng: 121.4645 },
    hours: '週日至週四 11:30 - 23:00, 週五六 11:30 - 01:00',
    phone: '02-7705-9717',
    priceRange: 'NT$600-1000'
  },
  { 
    id: 24, name: 'The 58 Bar', type: 'Speakeasy', distance: '8.3 公里', rating: 4.6, imageUrl: 'https://picsum.photos/400/300?random=29', position: { top: '10.9%', left: '71.2%' }, availability: 'Available',
    address: '新北市板橋區縣民大道二段275號',
    description: '隱藏在公寓中的神秘酒吧，提供無酒單的客製化調酒服務，氛圍舒適有格調。',
    reviews: [], menu: [], latlng: { lat: 25.0142, lng: 121.4658 },
    hours: '週一至週日 19:00 - 02:00',
    phone: '0933-345-582',
    priceRange: 'NT$350-550'
  },
  { 
    id: 25, name: 'Reviver', type: '復古風格酒吧', distance: '72.5 公里', rating: 4.7, imageUrl: 'https://picsum.photos/400/300?random=30', position: { top: '16.8%', left: '48.9%' }, availability: 'Busy',
    address: '新竹市東區民族路173號',
    description: '新竹知名的無酒單酒吧，店內充滿復古藥房風格，調酒師會根據你的喜好創造驚喜。',
    reviews: [], menu: [], latlng: { lat: 24.8055, lng: 120.9715 },
    hours: '週一至週日 19:00 - 02:00',
    phone: '03-532-5857',
    priceRange: 'NT$350-550'
  },
  { 
    id: 26, name: 'Liquid Art', type: '藝術感酒吧', distance: '72.8 公里', rating: 4.8, imageUrl: 'https://picsum.photos/400/300?random=31', position: { top: '16.8%', left: '48.6%' }, availability: 'Available',
    address: '新竹市東區民族路33巷62號',
    description: '結合藝術與調酒，空間極具設計感，提供視覺與味覺的雙重饗宴。',
    reviews: [], menu: [], latlng: { lat: 24.8043, lng: 120.9702 },
    hours: '週一至週日 19:00 - 02:00',
    phone: '03-533-3990',
    priceRange: 'NT$400-600'
  },
  { 
    id: 27, name: 'TABLE JOE', type: '餐酒館', distance: '71.9 公里', rating: 4.6, imageUrl: 'https://picsum.photos/400/300?random=32', position: { top: '16.7%', left: '49.1%' }, availability: 'Full',
    address: '新竹市東區三民路一段60號',
    description: '提供精緻的歐陸料理與多樣化的酒單，是用餐與小酌的絕佳選擇。',
    reviews: [], menu: [], latlng: { lat: 24.8077, lng: 120.9806 },
    hours: '週二至週日 18:00 - 00:00 (週一公休)',
    phone: '03-535-6120',
    priceRange: 'NT$600-1000'
  },
  {
    id: 28, name: 'Bar Bridge', type: '經典雞尾酒吧', distance: '3.7 公里', rating: 4.7, imageUrl: 'https://picsum.photos/400/300?random=33', position: { top: '10.0%', left: '75.7%' }, availability: 'Available',
    address: '台北市信義區基隆路一段147巷5弄1號', description: '位於信義區的隱密角落，以橋樑為名，象徵人與人之間的連結，提供溫暖且專業的服務。',
    reviews: [], menu: [], latlng: { lat: 25.040, lng: 121.565 },
    hours: '週一至週日 19:00 - 02:00',
    phone: '02-2767-1610',
    priceRange: 'NT$400-600'
  },
  {
    id: 29, name: 'Reply Bar', type: 'Speakeasy', distance: '4.1 公里', rating: 4.8, imageUrl: 'https://picsum.photos/400/300?random=34', position: { top: '9.7%', left: '73.9%' }, availability: 'Busy',
    address: '台北市中山區中山北路二段42巷12號', description: '偽裝成辦公室的有趣酒吧，需要解謎才能進入，提供創意十足的調酒體驗。',
    reviews: [], menu: [], latlng: { lat: 25.050, lng: 121.525 },
    hours: '週一至週六 19:00 - 01:00 (週日公休)',
    phone: '02-2563-3698',
    priceRange: 'NT$400-600'
  },
  {
    id: 30, name: 'Intention', type: '日式酒吧', distance: '4.3 公里', rating: 4.9, imageUrl: 'https://picsum.photos/400/300?random=35', position: { top: '9.8%', left: '73.7%' }, availability: 'Available',
    address: '台北市中山區中山北路二段36巷18號', description: '專注於呈現食材的原始風味，調酒風格細膩純粹，是許多資深酒客的愛店。',
    reviews: [], menu: [], latlng: { lat: 25.048, lng: 121.521 },
    hours: '週一至週六 19:00 - 02:00 (週日公休)',
    phone: '02-2563-6613',
    priceRange: 'NT$450-700'
  },
  {
    id: 31, name: '爛泥 ooze bar', type: '復古風格酒吧', distance: '2.5 公里', rating: 4.6, imageUrl: 'https://picsum.photos/400/300?random=36', position: { top: '10.6%', left: '74.3%' }, availability: 'Full',
    address: '台北市中正區羅斯福路三段284巷19號', description: '位於公館商圈，充滿台式復古情懷，提供輕鬆的氛圍與平易近人的調酒。',
    reviews: [], menu: [], latlng: { lat: 25.018, lng: 121.535 },
    hours: '週一至週日 18:00 - 01:00',
    phone: '02-2368-2369',
    priceRange: 'NT$300-500'
  },
  {
    id: 32, name: 'A Train Leads To Lincoln Center', type: '爵士音樂酒吧', distance: '4.5 公里', rating: 4.7, imageUrl: 'https://picsum.photos/400/300?random=37', position: { top: '9.6%', left: '73.8%' }, availability: 'Busy',
    address: '台北市中山區中山北路二段42巷20號', description: '以爵士樂為主題的酒吧，現場時常有音樂表演，氛圍極佳，適合喜愛音樂的酒客。',
    reviews: [], menu: [], latlng: { lat: 25.055, lng: 121.523 },
    hours: '週一至週日 18:00 - 02:00',
    phone: '02-2523-8282',
    priceRange: 'NT$400-600'
  },
  {
    id: 33, name: 'Drinkage', type: '餐酒館', distance: '164 公里', rating: 4.8, imageUrl: 'https://picsum.photos/400/300?random=38', position: { top: '34.7%', left: '35.1%' }, availability: 'Available',
    address: '台中市西區中興街81巷13號', description: '台中的熱門餐酒館，提供創意義大利麵與燉飯，調酒也極具特色與水準。',
    reviews: [], menu: [], latlng: { lat: 24.151, lng: 120.672 },
    hours: '週二至週日 17:30 - 01:00 (週一公休)',
    phone: '04-2301-0919',
    priceRange: 'NT$500-800'
  },
  {
    id: 34, name: 'ISLA', type: '島嶼風情酒吧', distance: '166 公里', rating: 4.7, imageUrl: 'https://picsum.photos/400/300?random=39', position: { top: '34.4%', left: '34.1%' }, availability: 'Busy',
    address: '台中市西區五權西四街118號', description: '以島嶼度假為主題，空間寬敞舒適，提供充滿熱帶風情的Tiki系列調酒。',
    reviews: [], menu: [], latlng: { lat: 24.16, lng: 120.65 },
    hours: '週一至週日 18:00 - 02:00',
    phone: '04-2372-0118',
    priceRange: 'NT$350-550'
  },
  {
    id: 35, name: 'Goût Bar 好吧', type: '法式小酒館', distance: '163 公里', rating: 4.6, imageUrl: 'https://picsum.photos/400/300?random=40', position: { top: '35.0%', left: '35.5%' }, availability: 'Available',
    address: '台中市西區存中街161巷1弄2號', description: '充滿法式風情的小酒館，提供精緻的法式料理與葡萄酒，氣氛浪漫優雅。',
    reviews: [], menu: [], latlng: { lat: 24.14, lng: 120.68 },
    hours: '週二至週日 18:00 - 00:00 (週一公休)',
    phone: '04-2376-5599',
    priceRange: 'NT$600-1000'
  },
  {
    id: 36, name: 'Bar INFU', type: '茶酒館', distance: '299 公里', rating: 4.8, imageUrl: 'https://picsum.photos/400/300?random=41', position: { top: '66.9%', left: '13.8%' }, availability: 'Full',
    address: '台南市中西區忠義路二段84巷6弄11號', description: '專注於將台灣茶融入調酒之中，每一杯都有獨特的茶香尾韻，是台南必訪的特色酒吧。',
    reviews: [], menu: [], latlng: { lat: 22.993, lng: 120.203 },
    hours: '週一至週日 20:00 - 03:00',
    phone: '06-221-5569',
    priceRange: 'NT$350-550'
  },
  {
    id: 37, name: 'Long Bar', type: '飯店酒吧', distance: '299 公里', rating: 4.7, imageUrl: 'https://picsum.photos/400/300?random=42', position: { top: '66.9%', left: '13.5%' }, availability: 'Available',
    address: '台南市中西區海安路一段255號', description: '位於台南晶英酒店，提供專業的經典調酒與舒適的氛圍，是商務或約會的好選擇。',
    reviews: [], menu: [], latlng: { lat: 22.991, lng: 120.198 },
    hours: '週一至週日 17:00 - 00:00',
    phone: '06-223-9911',
    priceRange: 'NT$400-600'
  },
  {
    id: 38, name: 'Bar Freedom', type: '威士忌酒吧', distance: '352 公里', rating: 4.8, imageUrl: 'https://picsum.photos/400/300?random=43', position: { top: '77.3%', left: '18.2%' }, availability: 'Busy',
    address: '高雄市苓雅區青年一路135號', description: '高雄知名的威士忌酒吧，藏酒豐富，老闆專業親切，是威士忌愛好者的天堂。',
    reviews: [], menu: [], latlng: { lat: 22.616, lng: 120.301 },
    hours: '週一至週日 19:00 - 02:00',
    phone: '07-338-0388',
    priceRange: 'NT$400-800'
  },
  {
    id: 39, name: 'Gallery 20.5', type: '藝廊風格酒吧', distance: '351 公里', rating: 4.7, imageUrl: 'https://picsum.photos/400/300?random=44', position: { top: '77.0%', left: '17.5%' }, availability: 'Available',
    address: '高雄市新興區文橫二路121巷22號', description: '結合藝術展覽的複合式空間，調酒也如同藝術品般充滿創意與美感。',
    reviews: [], menu: [], latlng: { lat: 22.628, lng: 120.286 },
    hours: '週三至週一 19:00 - 02:00 (週二公休)',
    phone: '07-281-2245',
    priceRange: 'NT$350-550'
  },
  {
    id: 40, name: '上善若水 Goodness Bistro', type: '中式餐酒館', distance: '351 公里', rating: 4.8, imageUrl: 'https://picsum.photos/400/300?random=45', position: { top: '76.8%', left: '18.4%' }, availability: 'Full',
    address: '高雄市左營區明誠二路369號', description: '以中式料理搭配特色調酒聞名，餐點與調酒都極具水準，是高雄的熱門排隊店家。',
    reviews: [], menu: [], latlng: { lat: 22.635, lng: 120.305 },
    hours: '週一至週日 18:00 - 01:30',
    phone: '07-556-9836',
    priceRange: 'NT$600-1000'
  },
  {
    id: 41, name: 'The Hangar', type: '工業風酒吧', distance: '98 公里', rating: 4.6, imageUrl: 'https://picsum.photos/400/300?random=46', position: { top: '18.1%', left: '84.1%' }, availability: 'Available',
    address: '宜蘭縣宜蘭市新民路112號', description: '宜蘭知名的工業風酒吧，提供多款精釀啤酒與經典調酒，氛圍輕鬆自在。',
    reviews: [], menu: [], latlng: { lat: 24.75, lng: 121.75 },
    hours: '週一至週日 19:00 - 02:00',
    phone: '03-936-9993',
    priceRange: 'NT$250-450'
  },
  {
    id: 42, name: 'Wootp', type: '無酒單酒吧', distance: '4.2 公里', rating: 4.9, imageUrl: 'https://picsum.photos/400/300?random=47', position: { top: '9.8%', left: '73.7%' }, availability: 'Full',
    address: '台北市中山區南京西路23巷5號', description: '藏身在赤峰街的無酒單酒吧，空間雖小但氛圍極佳，調酒師會為你特製專屬飲品。',
    reviews: [], menu: [], latlng: { lat: 25.049, lng: 121.520 },
    hours: '週一至週日 18:00 - 01:00',
    phone: '02-2521-9520',
    priceRange: 'NT$400-600'
  },
  {
    id: 43, name: 'Tender Land', type: '日式酒吧', distance: '3.9 公里', rating: 4.8, imageUrl: 'https://picsum.photos/400/300?random=48', position: { top: '9.7%', left: '73.9%' }, availability: 'Busy',
    address: '台北市中山區中山北路二段39巷6-1號', description: '氛圍沈穩的日式酒吧，提供細膩的服務與高品質的經典調酒，適合靜靜品飲。',
    reviews: [], menu: [], latlng: { lat: 25.051, lng: 121.524 },
    hours: '週一至週六 19:00 - 01:00 (週日公休)',
    phone: '02-2521-5991',
    priceRange: 'NT$450-700'
  },
];

export const MOCK_DEALS: Deal[] = [
  { id: 1, storeName: 'Draft Land (站著喝)', title: '歡樂時光：精選雞尾酒 200元', description: '平日下午5-7點，享受我們最受歡迎的汲飲式雞尾酒。', expiry: formatDate(addDays(today, 90)) },
  { id: 2, storeName: 'The Public House', title: '週二漢堡之夜', description: '任選漢堡搭配精選生啤只要500元。', expiry: formatDate(addDays(today, 60)) },
  { id: 3, storeName: 'Fourplay Cuisine', title: '當月壽星特調', description: '當月壽星憑證件消費，即可獲得一杯免費的特製驚喜調酒。', expiry: formatDate(addDays(today, 7)) },
  { id: 4, storeName: '榕 Xinyi', title: '週三淑女之夜', description: '女性顧客可享指定調酒買一送一優惠。', expiry: formatDate(addDays(today, 35)) },
];

export const MOCK_MISSIONS: Mission[] = [
  { id: 1, title: '探險家', description: '一晚在3家不同的酒吧打卡。', reward: { xp: 100 }, progress: 0, goal: 3 },
  { id: 2, title: '雞尾酒鑑賞家', description: '品嚐5種不同的雞尾酒。', reward: { xp: 150 }, progress: 0, goal: 5 },
  { id: 3, title: '啤酒好夥伴', description: '與朋友分享一杯啤酒並標記他們。', reward: { xp: 50 }, progress: 0, goal: 1 },
  { id: 4, title: '初來乍到', description: '完成你的第一次酒吧打卡。', reward: { xp: 100, points: 50 }, progress: 0, goal: 1 },
  { id: 5, title: '忠實顧客', description: '在同一家酒吧打卡 5 次。', reward: { xp: 200 }, progress: 0, goal: 5 },
  { id: 6, title: '威士忌行家', description: '品嚐 3 種不同的單一麥芽威士忌。', reward: { xp: 150 }, progress: 0, goal: 3 },
  { id: 7, title: '社交蝴蝶', description: '一週內與 5 位不同的好友一起打卡。', reward: { xp: 250 }, progress: 0, goal: 5 },
  { id: 8, title: '週五狂熱夜', description: '在週五晚上打卡。', reward: { xp: 50 }, progress: 0, goal: 1 },
  { id: 9, title: '評論家', description: '為 3 家不同的酒吧留下評論。', reward: { xp: 120 }, progress: 0, goal: 3 },
  { id: 10, title: 'Speakeasy 獵人', description: '在任一 Speakeasy 酒吧打卡。', reward: { xp: 80 }, progress: 0, goal: 1 },
  { id: 11, title: '早鳥優惠', description: '在歡樂時光 (Happy Hour) 期間打卡。', reward: { xp: 60 }, progress: 0, goal: 1 },
  { id: 12, title: '終極探險家', description: '總共在 10 家不同的酒吧打卡。', reward: { xp: 500, points: 100 }, progress: 0, goal: 10 },
];

export const MOCK_USER_PROFILE: UserProfile = {
  id: 101,
  name: '小明',
  avatarUrl: 'https://picsum.photos/200/200?random=99',
  level: 12,
  xp: 450,
  xpToNextLevel: 1000,
  points: 750,
  missionsCompleted: 28,
  checkIns: 112,
  email: 'ming@example.com',
  phone: '0912-345-678',
  friends: [],
  latlng: { lat: 25.0340, lng: 121.5645 }, // Taipei 101
  friendCode: 'GUNBOOJO-A1B2',
};

export const MOCK_USERS: MockUser[] = [
  {
    id: 101,
    email: 'ming@example.com',
    password: 'password123',
    profile: MOCK_USER_PROFILE,
  },
  {
    id: 102,
    email: 'alice@example.com',
    password: 'password123',
    profile: {
      id: 102,
      name: 'Alice',
      avatarUrl: 'https://picsum.photos/200/200?random=11',
      level: 15,
      xp: 200,
      xpToNextLevel: 1200,
      points: 1250,
      missionsCompleted: 35,
      checkIns: 150,
      email: 'alice@example.com',
      phone: '0911-111-111',
      friends: [],
      latlng: { lat: 25.032, lng: 121.543 }, // Daan Park
      friendCode: 'GUNBOOJO-C3D4',
    },
  },
  {
    id: 103,
    email: 'bob@example.com',
    password: 'password123',
    profile: {
      id: 103,
      name: 'Bob',
      avatarUrl: 'https://picsum.photos/200/200?random=12',
      level: 8,
      xp: 850,
      xpToNextLevel: 900,
      points: 400,
      missionsCompleted: 18,
      checkIns: 95,
      email: 'bob@example.com',
      phone: '0922-222-222',
      friends: [],
      latlng: { lat: 25.047, lng: 121.517 }, // Taipei Main Station
      friendCode: 'GUNBOOJO-E5F6',
    },
  },
  {
    id: 104,
    email: 'charlie@example.com',
    password: 'password123',
    profile: {
      id: 104,
      name: 'Charlie',
      avatarUrl: 'https://picsum.photos/200/200?random=13',
      level: 10,
      xp: 100,
      xpToNextLevel: 1000,
      points: 600,
      missionsCompleted: 22,
      checkIns: 105,
      email: 'charlie@example.com',
      phone: '0933-333-333',
      friends: [],
      latlng: { lat: 25.022, lng: 121.554 }, // NTU
      friendCode: 'GUNBOOJO-G7H8',
    },
  },
  {
    id: 105,
    email: 'david@example.com',
    password: 'password123',
    profile: {
      id: 105,
      name: 'David',
      avatarUrl: 'https://picsum.photos/200/200?random=14',
      level: 5,
      xp: 300,
      xpToNextLevel: 500,
      points: 200,
      missionsCompleted: 10,
      checkIns: 50,
      email: 'david@example.com',
      phone: '0944-444-444',
      friends: [],
      latlng: { lat: 25.052, lng: 121.548 }, // Taipei Arena
      friendCode: 'GUNBOOJO-I9J0',
    },
  }
];

// All mock feed items are removed to provide a clean slate for the user.
export const MOCK_FEED_ITEMS: FeedItem[] = [];

export const MOCK_ORDERS: Order[] = [
  { id: 'ORD002', storeName: 'Draft Land (站著喝)', date: '2024-08-10', time: '20:30', people: 4, status: 'Completed' },
  { id: 'ORD003', storeName: 'CÉ LA VI Taipei', date: '2024-08-05', time: '21:00', people: 3, status: 'Cancelled' },
  { id: 'ORD004', storeName: 'Ounce Taipei', date: '2024-07-28', time: '22:00', people: 5, status: 'Completed' },
];

export const MOCK_REDEEM_ITEMS: RedeemItem[] = [
    { id: 1, title: '店家 9 折優惠券', description: '可在任何合作店家使用，享受單次消費總金額九折優惠。', cost: 250 },
    { id: 2, title: '免費薯條一份', description: '在「The Public House」兌換一份招牌松露薯條。', cost: 150 },
    { id: 3, title: '專屬頭像外框', description: '解鎖一個稀有的「傳奇酒鬼」頭像外框，在好友中脫穎而出。', cost: 800 },
    { id: 4, title: '合作店家 $100 折價券', description: '可在任何合作店家使用，消費滿 $500 即可折抵 $100。', cost: 400 },
];

export const MOCK_COUPONS: Coupon[] = [
  { id: 1, storeName: 'Indulge Experimental Bistro', title: '店家 9 折優惠券', description: '單次消費總金額九折優惠。', expiry: formatDate(addDays(today, 60)), status: 'valid' },
  { id: 2, storeName: 'The Public House', title: '免費小點一份', description: '兌換一份免費的炸魚薯條。', expiry: formatDate(addDays(today, 30)), status: 'valid' },
  { id: 3, storeName: 'HANKO 60', title: '第二杯半價', description: '購買任一杯經典調酒，第二杯享半價優惠。', expiry: formatDate(addDays(today, 15)), status: 'used' },
  { id: 4, storeName: 'Bar Mood Taipei 吧沐', title: '免費shot一杯', description: '消費滿千即贈送一杯當日特選shot。', expiry: formatDate(addDays(today, -10)), status: 'expired' },
];

export const MOCK_REDEMPTION_CODES: Record<string, { couponTemplate: Omit<Coupon, 'id' | 'status' | 'expiry'>, daysValid: number }> = {
    'WELCOME2024': {
        couponTemplate: {
            storeName: '乾不揪官方',
            title: '新用戶專屬折價券',
            description: '全平台合作店家消費滿 $500 折 $50。',
        },
        daysValid: 30,
    },
    'BARHOPPER': {
        couponTemplate: {
            storeName: 'Indulge Experimental Bistro',
            title: '特調雞尾酒一杯',
            description: '免費兌換一杯價值 $450 以下的特調雞尾酒。',
        },
        daysValid: 14,
    },
};