
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleGenAI, Type } from "@google/genai";
import { Store, UserProfile } from '../types';
import { BackIcon } from '../components/icons/ActionIcons';
import { useGuestGuard } from '../context/GuestGuardContext';
import { createStore } from '../utils/api'; // Import createStore

const TAIWAN_BOUNDS = {
    latMin: 21.8,
    latMax: 25.4,
    lngMin: 119.9,
    lngMax: 122.1,
};

const mapLatLngToPosition = (lat: number, lng: number) => {
    const clampedLat = Math.max(TAIWAN_BOUNDS.latMin, Math.min(lat, TAIWAN_BOUNDS.latMax));
    const clampedLng = Math.max(TAIWAN_BOUNDS.lngMin, Math.min(lng, TAIWAN_BOUNDS.lngMax));

    const top = 100 - ((clampedLat - TAIWAN_BOUNDS.latMin) / (TAIWAN_BOUNDS.latMax - TAIWAN_BOUNDS.latMin)) * 100;
    const left = ((clampedLng - TAIWAN_BOUNDS.lngMin) / (TAIWAN_BOUNDS.lngMax - TAIWAN_BOUNDS.lngMin)) * 100;

    return {
        top: `${top}%`,
        left: `${left}%`,
    };
};

const AddStorePage: React.FC = () => {
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [type, setType] = useState('雞尾酒吧');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [hours, setHours] = useState('');
    const [priceRange, setPriceRange] = useState('');
    const [description, setDescription] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [status, setStatus] = useState<'idle' | 'validating' | 'saving'>('idle');
    const [error, setError] = useState('');
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const { checkGuest } = useGuestGuard();

    useEffect(() => {
        const profile = localStorage.getItem('userProfile');
        if (profile) setCurrentUser(JSON.parse(profile));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        checkGuest(async () => {
            if (!name.trim() || !type.trim() || !address.trim()) {
                setError('店名、類型和地址為必填欄位。');
                return;
            }
            setError('');
            setStatus('validating');

            try {
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: `Is "${address}" a real, valid address in Taiwan? Please respond in JSON format.`,
                    config: {
                        responseMimeType: "application/json",
                        responseSchema: {
                            type: Type.OBJECT,
                            properties: {
                                isValid: { type: Type.BOOLEAN },
                                latitude: { type: Type.NUMBER },
                                longitude: { type: Type.NUMBER },
                            },
                            required: ['isValid'],
                        },
                    },
                });
                
                const result = JSON.parse(response.text);

                if (!result.isValid) {
                    setError('請輸入一個真實有效的台灣地址。Gemini AI 無法驗證此地址。');
                    setStatus('idle');
                    return;
                }
                
                setStatus('saving');

                // Generate a numeric ID for compatibility
                const newId = Date.now();

                const newStore: Store = {
                    id: newId,
                    name: name.trim(),
                    type: type.trim(),
                    address: address.trim(),
                    phone: phone.trim(),
                    hours: hours.trim(),
                    priceRange: priceRange.trim(),
                    description: description.trim(),
                    imageUrl: imageUrl.trim() || `https://picsum.photos/400/300?random=${newId}`,
                    position: mapLatLngToPosition(result.latitude, result.longitude),
                    latlng: { lat: result.latitude, lng: result.longitude },
                    rating: 0,
                    availability: 'Available',
                    distance: '未知',
                    reviews: [],
                    menu: [],
                };

                // Save to Firestore
                await createStore(newStore);

                setStatus('idle');
                navigate('/');

            } catch (err) {
                console.error("Error adding store:", err);
                setError('新增店家失敗，請稍後再試。');
                setStatus('idle');
            }
        });
    };
    
    const getButtonText = () => {
        switch (status) {
            case 'validating': return '正在驗證地址...';
            case 'saving': return '儲存中...';
            default: return '新增酒吧';
        }
    };

    const isSubmitting = status === 'validating' || status === 'saving';

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="relative">
                 <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-brand-muted hover:text-brand-light transition-colors font-semibold">
                    <BackIcon />
                    <span>返回</span>
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="bg-brand-secondary p-6 rounded-2xl border-2 border-brand-accent/20 space-y-6">
                <h2 className="text-2xl font-bold text-brand-accent text-center mb-4">分享你的私房酒吧</h2>
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-brand-light mb-1">酒吧名稱*</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-2 text-brand-light focus:ring-brand-accent focus:border-brand-accent"
                        placeholder="例如：角落小酒館"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="type" className="block text-sm font-medium text-brand-light mb-1">類型*</label>
                    <input
                        type="text"
                        id="type"
                        value={type}
                        onChange={(e) => setType(e.target.value)}
                        className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-2 text-brand-light focus:ring-brand-accent focus:border-brand-accent"
                        placeholder="例如：雞尾酒吧、Speakeasy"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-brand-light mb-1">地址*</label>
                    <input
                        type="text"
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-2 text-brand-light focus:ring-brand-accent focus:border-brand-accent"
                        placeholder="例如：台北市信義區市府路45號"
                        required
                    />
                </div>
                 <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-brand-light mb-1">電話</label>
                    <input
                        type="tel"
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-2 text-brand-light focus:ring-brand-accent focus:border-brand-accent"
                        placeholder="例如：02-1234-5678"
                    />
                </div>
                <div>
                    <label htmlFor="hours" className="block text-sm font-medium text-brand-light mb-1">營業時間</label>
                    <input
                        type="text"
                        id="hours"
                        value={hours}
                        onChange={(e) => setHours(e.target.value)}
                        className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-2 text-brand-light focus:ring-brand-accent focus:border-brand-accent"
                        placeholder="例如：週一至週五 18:00 - 02:00"
                    />
                </div>
                <div>
                    <label htmlFor="priceRange" className="block text-sm font-medium text-brand-light mb-1">價位</label>
                    <input
                        type="text"
                        id="priceRange"
                        value={priceRange}
                        onChange={(e) => setPriceRange(e.target.value)}
                        className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-2 text-brand-light focus:ring-brand-accent focus:border-brand-accent"
                        placeholder="例如：NT$400-600"
                    />
                </div>
                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-brand-light mb-1">簡短介紹</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-2 text-brand-light focus:ring-brand-accent focus:border-brand-accent"
                        placeholder="分享這家店的特色..."
                    />
                </div>
                <div>
                    <label htmlFor="imageUrl" className="block text-sm font-medium text-brand-light mb-1">圖片網址</label>
                    <input
                        type="text"
                        id="imageUrl"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-2 text-brand-light focus:ring-brand-accent focus:border-brand-accent"
                        placeholder="https://example.com/bar.png"
                    />
                </div>
                
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                 <div className="flex gap-4 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="flex-1 bg-brand-primary border-2 border-brand-accent text-brand-light py-3 px-4 rounded-lg hover:bg-brand-accent/10 transition-colors font-semibold"
                        disabled={isSubmitting}
                    >
                        取消
                    </button>
                    <button
                        type="submit"
                        className="flex-1 bg-brand-button-bg text-brand-light font-bold py-3 px-4 rounded-lg hover:bg-brand-button-bg-hover transition-colors disabled:bg-brand-muted/50 disabled:cursor-wait"
                        disabled={isSubmitting}
                    >
                        {getButtonText()}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddStorePage;
