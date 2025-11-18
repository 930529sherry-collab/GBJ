import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserProfile } from '../types';
import { BackIcon } from '../components/icons/ActionIcons';
import { getFriends } from '../utils/api';

const FriendsListPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchTerm, setSearchTerm] = useState('');
    const [friends, setFriends] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFriends = async () => {
            setLoading(true);
            const profileData = localStorage.getItem('userProfile');
            if (profileData) {
                const currentUser: UserProfile = JSON.parse(profileData);
                
                if (!currentUser || typeof currentUser.id === 'undefined') {
                    console.error("Cannot get current user ID from localStorage");
                    setLoading(false);
                    setFriends([]);
                    return;
                }

                try {
                    // Pass the user ID as a number, as required by the getFriends function signature.
                    const friendProfiles = await getFriends(currentUser.id);
                    setFriends(friendProfiles);
                } catch (error) {
                    console.error("Failed to fetch friends:", error);
                    setFriends([]);
                }
            }
            setLoading(false);
        };
        fetchFriends();
    }, [location]);

    const filteredFriends = friends.filter(friend =>
        friend.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // The friend ID is a number according to the UserProfile type.
    const handleFriendClick = (id: number) => {
        navigate(`/friends/${id}`);
    };

    if (loading) {
        return <div className="text-center p-10 text-brand-accent">正在讀取好友列表...</div>;
    }

    return (
        <div className="animate-fade-in space-y-6">
            <div className="relative">
                 <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-brand-muted hover:text-brand-light transition-colors font-semibold">
                    <BackIcon />
                    <span>返回</span>
                </button>
            </div>
            
            {/* Search Input */}
            <div className="relative">
                <input
                    type="text"
                    placeholder="搜尋好友名稱..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-brand-secondary border-2 border-brand-accent/50 rounded-lg p-3 pl-10 text-brand-light focus:ring-brand-accent focus:border-brand-accent transition-colors"
                    aria-label="Search friends"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                     <svg className="w-5 h-5 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>

            {/* Friends List */}
            <div className="space-y-3">
                {filteredFriends.length > 0 ? filteredFriends.map(friend => (
                    <div
                        key={friend.id}
                        onClick={() => handleFriendClick(friend.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && handleFriendClick(friend.id)}
                        className="bg-brand-secondary p-3 rounded-lg flex items-center justify-between gap-4 cursor-pointer border-2 transition-all duration-300 border-brand-accent/20 hover:border-brand-accent/50 hover:shadow-lg hover:shadow-brand-accent/10"
                    >
                        <div className="flex items-center gap-4">
                            <img src={friend.avatarUrl} alt={friend.name} className="w-12 h-12 rounded-full object-cover" />
                            <div>
                                <h3 className="font-bold text-brand-light">{friend.name}</h3>
                                <p className="text-sm text-brand-muted">等級 {friend.level}</p>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="text-center p-10 text-brand-muted bg-brand-secondary rounded-lg border-2 border-brand-accent/10">
                        <p>{searchTerm ? `找不到名為 "${searchTerm}" 的好友。` : '你還沒有任何好友。'}</p>
                        <button onClick={() => navigate('/add-friend')} className="mt-4 font-semibold text-brand-accent hover:underline">
                            去新增好友
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FriendsListPage;