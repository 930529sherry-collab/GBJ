
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserProfile } from '../types';
import { BackIcon } from '../components/icons/ActionIcons';
import { getFriends } from '../utils/api';

const ChatListPage: React.FC = () => {
    const navigate = useNavigate();
    const [friends, setFriends] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFriends = async () => {
            setLoading(true);
            const profileData = localStorage.getItem('userProfile');
            if (profileData) {
                const currentUser: UserProfile = JSON.parse(profileData);
                try {
                    const friendProfiles = await getFriends(currentUser.id);
                    setFriends(friendProfiles);
                } catch (error) {
                    console.error("Failed to fetch friends:", error);
                }
            }
            setLoading(false);
        };
        fetchFriends();
    }, []);

    const handleChatClick = (friendId: number | string) => {
        navigate(`/chat/${friendId}`);
    };

    if (loading) {
        return <div className="text-center p-10 text-brand-accent">載入好友列表...</div>;
    }

    return (
        <div className="animate-fade-in h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4">
                 <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-brand-muted hover:text-brand-light transition-colors font-semibold">
                    <BackIcon />
                    <span>返回</span>
                </button>
            </div>
            
            <h2 className="text-2xl font-bold text-brand-light mb-4 px-2">聊天室</h2>

            <div className="flex-grow overflow-y-auto space-y-3">
                {friends.length > 0 ? friends.map(friend => (
                    <div
                        key={friend.id}
                        onClick={() => handleChatClick(friend.id)}
                        className="bg-brand-secondary p-4 rounded-xl flex items-center gap-4 cursor-pointer border-2 border-brand-accent/20 hover:border-brand-accent/50 hover:bg-brand-primary/80 transition-all shadow-sm"
                    >
                        <div className="relative">
                            <img src={friend.avatarUrl} alt={friend.name} className="w-14 h-14 rounded-full object-cover border-2 border-brand-accent/10" />
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-brand-secondary rounded-full"></div>
                        </div>
                        <div className="flex-grow">
                            <h3 className="font-bold text-brand-light text-lg">{friend.name}</h3>
                            <p className="text-sm text-brand-muted truncate">點擊開始聊天...</p>
                        </div>
                    </div>
                )) : (
                    <div className="text-center p-10 text-brand-muted bg-brand-secondary rounded-xl border-2 border-brand-accent/10">
                        <p>你還沒有好友可以聊天。</p>
                        <button onClick={() => navigate('/add-friend')} className="mt-4 text-brand-accent font-bold hover:underline">
                            去新增好友
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatListPage;
