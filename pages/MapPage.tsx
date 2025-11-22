
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import * as L from 'leaflet';
import { Store, UserProfile } from '../types';
import { CrosshairsIcon, SparklesIcon } from '../components/icons/ActionIcons';
import MapPlaceholder from '../components/MapPlaceholder';
import { useGeolocation } from '../context/GeolocationContext';
import { getDistance } from '../utils/distance';
import { GoogleGenAI, Type } from "@google/genai";
import { getStores } from '../utils/api'; // Import getStores

interface AiRecommendation {
    storeName: string;
    reason: string;
    store: Store;
}

const AiRecCard: React.FC<{ recommendation: AiRecommendation; onSelect: (store: Store) => void; }> = ({ recommendation, onSelect }) => {
    return (
        <div 
            onClick={() => onSelect(recommendation.store)}
            className="flex-shrink-0 w-64 bg-brand-primary p-3 rounded-lg border-2 border-brand-accent/30 shadow-md cursor-pointer transition-transform hover:scale-105"
            role="button"
        >
            <img src={recommendation.store.imageUrl} alt={recommendation.store.name} className="w-full h-24 object-cover rounded-md mb-2" />
            <h4 className="font-bold text-brand-light truncate">{recommendation.store.name}</h4>
            <p className="text-xs text-brand-muted line-clamp-2">「{recommendation.reason}」</p>
        </div>
    );
};

interface MapPin {
    id: number | string;
    latlng: { lat: number; lng: number };
    isFriend?: boolean;
    isUser?: boolean;
    avatarUrl?: string;
    name?: string;
}

const MapPage: React.FC = () => {
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const navigate = useNavigate();
    const { position: userPosition, error: userError, loading: isGeolocating } = useGeolocation();
    const mapRef = useRef<L.Map | null>(null);
    const location = useLocation();

    const [aiRecommendations, setAiRecommendations] = useState<AiRecommendation[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationError, setGenerationError] = useState('');
    const [mood, setMood] = useState('');

    useEffect(() => {
        const profile = localStorage.getItem('userProfile');
        if (profile) setUserProfile(JSON.parse(profile));
    }, []);

    useEffect(() => {
        const fetchStores = async () => {
            setLoading(true);
            try {
                // Fetch stores from Firestore
                const allStores = await getStores();
                
                // Filter for Taipei stores (optional based on requirements, keeping existing logic)
                const taipeiStores = allStores.filter(store => store.address.includes('台北市'));

                if (userPosition) {
                    const storesWithDistance = taipeiStores.map(store => {
                        const distance = getDistance(userPosition.lat, userPosition.lng, store.latlng.lat, store.latlng.lng);
                        return { ...store, distance: `${distance.toFixed(1)} 公里` };
                    }).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
                    setStores(storesWithDistance);
                } else {
                     setStores(taipeiStores);
                }
            } catch (error) {
                console.error("Failed to load stores:", error);
                setStores([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchStores();
    }, [location, userPosition]);

    const mapPins = useMemo(() => {
        const pins: MapPin[] = stores
            .filter(s => s.latlng) // Guard against missing latlng
            .map(s => ({
                id: s.id,
                latlng: s.latlng,
                isFriend: false,
                name: s.name,
            }));
        if (userPosition && userProfile) {
            pins.unshift({
                id: 'user-location',
                latlng: userPosition,
                isUser: true,
                avatarUrl: userProfile.avatarUrl,
                name: '我的位置',
            });
        }
        return pins;
    }, [stores, userPosition, userProfile]);

    const handleNavigateToStore = (storeId: number | string) => {
        setTimeout(() => {
            navigate(`/store/${storeId}`);
        }, 0);
    };

    const handleRecenterMap = () => {
        if (userPosition && mapRef.current) {
            mapRef.current.setView([userPosition.lat, userPosition.lng], 15, {
                animate: true,
                duration: 1,
            });
        }
    };

    const handleGenerateRecommendations = async () => {
        if (!mood.trim()) {
            setGenerationError("請先輸入你的心情或想找的氛圍！");
            return;
        }

        setIsGenerating(true);
        setGenerationError('');
        setAiRecommendations([]);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const storeList = stores.map(s => `${s.name} (${s.type})`).join('; ');
            const prompt = `我現在的心情或需求是「${mood.trim()}」。從以下的台北酒吧清單中：[${storeList}]，請為我推薦 3 間最符合這個心情的酒吧。請為每一間酒吧提供一個簡短、有創意且吸引人的推薦理由。請用 JSON 格式回覆。`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            recommendations: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        storeName: { type: Type.STRING },
                                        reason: { type: Type.STRING },
                                    },
                                    required: ['storeName', 'reason'],
                                },
                            },
                        },
                        required: ['recommendations'],
                    },
                },
            });

            const result = JSON.parse(response.text);
            const validatedRecs = result.recommendations.map((rec: { storeName: string; reason: string; }) => {
                const store = stores.find(s => s.name === rec.storeName);
                return store ? { ...rec, store } : null;
            }).filter(Boolean);

            setAiRecommendations(validatedRecs);

        } catch (err) {
            console.error("AI recommendation failed:", err);
            setGenerationError("抱歉，AI 推薦功能暫時無法使用。");
        } finally {
            setIsGenerating(false);
        }
    };

    if (loading) {
        return <div className="text-center p-10 text-brand-accent">正在尋找台北市的酒吧...</div>;
    }

    return (
        <div className="animate-fade-in space-y-6">
            {userError && (
                <div className="text-center text-sm text-red-500 bg-red-500/10 p-2 rounded-lg">
                    無法取得您的位置：{userError}。距離計算可能不準確。
                </div>
            )}
            <div className="relative w-full h-[50vh] rounded-2xl overflow-hidden border-2 border-brand-accent/30 shadow-2xl shadow-brand-accent/10">
                <MapPlaceholder 
                    pins={mapPins}
                    onPinClick={handleNavigateToStore}
                    center={userPosition ? [userPosition.lat, userPosition.lng] : undefined}
                    onMapReady={(map) => { mapRef.current = map; }}
                />
                <div className="absolute bottom-4 right-4 flex flex-col gap-3">
                    <button 
                        onClick={handleRecenterMap}
                        className="bg-brand-secondary/90 text-brand-light p-3 rounded-full shadow-lg hover:bg-brand-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="回到我的位置"
                        disabled={!userPosition || isGeolocating}
                    >
                        <CrosshairsIcon />
                    </button>
                </div>
            </div>
             <div className="bg-orange-200 dark:bg-orange-800/50 p-4 rounded-xl border-2 border-brand-accent/20 shadow-lg shadow-brand-accent/10">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-orange-900 dark:text-orange-100 flex items-center gap-2">
                        <SparklesIcon className="w-6 h-6" />
                        今天喝啥？
                    </h3>
                    <button onClick={handleGenerateRecommendations} disabled={isGenerating || !mood.trim()} className="bg-brand-button-bg text-brand-light font-semibold text-sm py-1 px-3 rounded-lg hover:bg-brand-button-bg-hover transition-colors disabled:bg-brand-muted/50 disabled:cursor-wait">
                        {isGenerating ? 'AI 思考中...' : '幫我推薦！'}
                    </button>
                </div>
                <div className="mb-4">
                    <input
                        type="text"
                        value={mood}
                        onChange={(e) => {
                            setMood(e.target.value);
                            if (generationError) setGenerationError('');
                        }}
                        placeholder="想找個地方... (e.g., 安靜聊天、週末狂歡)"
                        className="w-full bg-brand-primary border-2 border-brand-accent/50 rounded-lg p-3 text-brand-light focus:ring-brand-accent focus:border-brand-accent transition-colors"
                    />
                </div>
                {isGenerating && <div className="text-center py-4 text-orange-900/80 dark:text-orange-100/80">AI 正在為您客製化推薦...</div>}
                {generationError && <div className="text-center py-4 text-red-500">{generationError}</div>}
                {aiRecommendations.length > 0 && (
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {aiRecommendations.map(rec => <AiRecCard key={rec.store.id} recommendation={rec} onSelect={(store) => handleNavigateToStore(store.id)} />)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MapPage;