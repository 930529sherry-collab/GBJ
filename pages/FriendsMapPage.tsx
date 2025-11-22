
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Friend, UserProfile } from '../types';
import { UserPlusIcon } from '../components/icons/NavIcons';
import MapPlaceholder from '../components/MapPlaceholder';
import { useGeolocation } from '../context/GeolocationContext';
import { getFriends } from '../utils/api';
import { useGuestGuard } from '../context/GuestGuardContext';

interface MapPin {
    id: number | string;
    latlng: { lat: number; lng: number };
    isFriend?: boolean;
    isUser?: boolean;
    avatarUrl?: string;
    name?: string;
}

const FriendsMapPage: React.FC<{ refreshTrigger?: number }> = ({ refreshTrigger }) => {
    const [friends, setFriends] = useState<Friend[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const { position: userPosition } = useGeolocation();
    const { checkGuest } = useGuestGuard();
    
    useEffect(() => {
        const fetchFriends = async () => {
            setLoading(true);
            const profileData = localStorage.getItem('userProfile');
            if (profileData) {
                const currentUserProfile: UserProfile = JSON.parse(profileData);
                setCurrentUser(currentUserProfile);
                try {
                    const friendProfiles = await getFriends(currentUserProfile.id);
                    const friendMapData: Friend[] = friendProfiles.map(profile => ({
                        id: profile.id,
                        name: profile.name,
                        avatarUrl: profile.avatarUrl,
                        lastCheckIn: '未知',
                        position: { top: '0', left: '0' }, 
                        latlng: profile.latlng,
                    }));
                    setFriends(friendMapData);
                } catch (error) {
                    console.error("Failed to fetch friends", error);
                    setFriends([]);
                }
            }
            setLoading(false);
        };
        fetchFriends();
    }, [location, refreshTrigger]);

    const mapPins = useMemo(() => {
        const pins: MapPin[] = friends
            .filter(f => f.latlng) // Guard against missing latlng
            .map(friend => ({
                id: friend.id,
                latlng: friend.latlng,
                isFriend: true,
                avatarUrl: friend.avatarUrl,
                name: friend.name,
            }));

        if (userPosition && currentUser) {
            pins.unshift({
                id: currentUser.id,
                latlng: userPosition,
                isUser: true,
                avatarUrl: currentUser.avatarUrl,
                name: '我的位置',
            });
        }
        return pins;
    }, [friends, userPosition, currentUser]);
    

    const handlePinClick = (id: number | string) => {
        setTimeout(() => {
            navigate(`/friends/${id}`);
        }, 0);
    }

    const handleListFriendClick = (id: number | string) => {
        navigate(`/friends/${id}`);
    }

    const handleAddFriendClick = () => {
        checkGuest(() => {
            navigate('/add-friend');
        });
    };

    if (loading) {
        return <div className="text-center p-10 text-brand-accent">正在尋找你的好友...</div>;
    }

    if (friends.length === 0) {
        return (
            <div className="text-center p-10 flex flex-col items-center justify-center h-full animate-fade-in">
                <UserPlusIcon className="w-16 h-16 text-brand-muted mb-4" />
                <h2 className="text-xl font-bold text-brand-light mb-2">你的好友地圖還是空的</h2>
                <p className="text-brand-muted mb-6">新增一些好友，看看他們都在哪裡出沒吧！</p>
                <button
                    onClick={handleAddFriendClick}
                    className="bg-brand-accent text-brand-primary font-bold py-2 px-6 rounded-lg hover:bg-opacity-80 transition-colors"
                >
                    新增好友
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-172px)]">
            {/* Map Section */}
            <div
                className="relative w-full h-3/4 rounded-2xl overflow-hidden border-2 border-brand-accent/30 shadow-2xl shadow-brand-accent/10 mb-4 flex-shrink-0"
            >
               <MapPlaceholder 
                    pins={mapPins}
                    onPinClick={handlePinClick}
                    center={userPosition ? [userPosition.lat, userPosition.lng] : undefined}
                    onMapReady={() => {}}
               />
            </div>

            {/* Friends List Section */}
            <div className="flex-grow overflow-y-auto pr-2">
                <div className="space-y-3">
                    {friends.map(friend => (
                        <div
                            key={friend.id}
                            onClick={() => handleListFriendClick(friend.id)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && handleListFriendClick(friend.id)}
                            className="bg-brand-secondary p-3 rounded-lg flex items-center gap-4 cursor-pointer border-2 transition-all duration-300 border-brand-accent/30 hover:border-brand-accent hover:shadow-lg hover:shadow-brand-accent/20"
                        >
                            <img src={friend.avatarUrl} alt={friend.name} className="w-12 h-12 rounded-full object-cover" />
                            <div>
                                <h3 className="font-bold text-brand-light">{friend.name}</h3>
                                <p className="text-sm text-brand-muted">上次在哪：{friend.lastCheckIn}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FriendsMapPage;