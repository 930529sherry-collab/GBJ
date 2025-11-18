import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FriendProfile, UserProfile, FeedItem, Comment, Store } from '../types';
import { BackIcon } from '../components/icons/ActionIcons';
import FeedCard from '../components/FeedCard';
import { MOCK_FEED_ITEMS, MOCK_STORES } from '../constants';
import { getFriends } from '../utils/api';

const FriendProfilePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [profile, setProfile] = useState<FriendProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [friendFeed, setFriendFeed] = useState<FeedItem[]>([]);
    const [stores, setStores] = useState<Store[]>([]);

    useEffect(() => {
        const fetchFriendProfile = async () => {
            setLoading(true);
            const friendId = parseInt(id || '0', 10);
            const currentUserData = localStorage.getItem('userProfile');
            const savedStores = localStorage.getItem('stores');
            setStores(savedStores ? JSON.parse(savedStores) : MOCK_STORES);

            if (currentUserData) {
                const currentUserProfile: UserProfile = JSON.parse(currentUserData);
                setCurrentUser(currentUserProfile);
                try {
                    const friends = await getFriends(currentUserProfile.id);
                    const foundFriendProfile = friends.find(f => f.id === friendId);

                    if (foundFriendProfile) {
                        const allFeedItems = localStorage.getItem('feedItems') ? JSON.parse(localStorage.getItem('feedItems')!) : MOCK_FEED_ITEMS;
                        const friendActivity = allFeedItems.filter((item: FeedItem) => item.friendId === friendId).sort((a: FeedItem, b: FeedItem) => b.id - a.id);
                        const friendProfileData: FriendProfile = {
                            ...foundFriendProfile,
                            recentActivity: friendActivity,
                        };
                        setProfile(friendProfileData);
                        setFriendFeed(friendActivity);
                    } else {
                        setProfile(null);
                    }
                } catch (error) {
                    console.error("Failed to fetch friend profile:", error);
                    setProfile(null);
                }
            }
            setLoading(false);
        };
        fetchFriendProfile();
    }, [id]);
    
    const updateGlobalFeed = (updater: (feed: FeedItem[]) => FeedItem[]) => {
        const allFeedItems = localStorage.getItem('feedItems') ? JSON.parse(localStorage.getItem('feedItems')!) : MOCK_FEED_ITEMS;
        const updatedAllFeedItems = updater(allFeedItems);
        localStorage.setItem('feedItems', JSON.stringify(updatedAllFeedItems));

        const friendId = parseInt(id || '0', 10);
        const updatedFriendFeed = updatedAllFeedItems.filter((item: FeedItem) => item.friendId === friendId).sort((a: FeedItem, b: FeedItem) => b.id - a.id);
        setFriendFeed(updatedFriendFeed);
    };

    const handleToggleLike = (itemId: number) => {
        updateGlobalFeed(allFeedItems => 
            allFeedItems.map(item =>
                item.id === itemId
                    ? {
                        ...item,
                        isLiked: !item.isLiked,
                        likes: item.isLiked ? item.likes - 1 : item.likes + 1,
                      }
                    : item
            )
        );
    };

    const handleAddComment = (itemId: number, commentText: string, storeName?: string) => {
        if (!currentUser) return;
        const newComment: Comment = {
            id: Date.now(),
            authorName: currentUser.name,
            authorAvatarUrl: currentUser.avatarUrl,
            text: commentText,
            timestamp: '剛剛',
            storeName,
        };

        updateGlobalFeed(allFeedItems =>
            allFeedItems.map(item =>
                item.id === itemId
                    ? { ...item, comments: [...item.comments, newComment] }
                    : item
            )
        );
    };

    if (loading) {
        return <div className="text-center p-10 text-brand-accent">讀取好友檔案...</div>;
    }

    if (!profile) {
        return (
            <div className="text-center p-10 text-brand-muted">
                <p>找不到這位好友的檔案。</p>
                <button onClick={() => navigate(-1)} className="mt-4 text-brand-accent font-semibold">返回</button>
            </div>
        );
    }
    
    const xpPercentage = (profile.xp / profile.xpToNextLevel) * 100;

    return (
        <div className="animate-fade-in">
            <div className="mb-4">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-brand-muted hover:text-brand-light transition-colors font-semibold">
                    <BackIcon />
                    <span>返回</span>
                </button>
            </div>
            <div className="space-y-6">
                <div className="flex flex-col items-center space-y-2 p-6 bg-brand-secondary rounded-2xl border-2 border-brand-accent/20">
                    <img src={profile.avatarUrl} alt={profile.name} className="w-28 h-28 rounded-full object-cover border-4 border-brand-accent shadow-lg shadow-brand-accent/30 mb-2" />
                    <h2 className="text-3xl font-bold text-brand-light">{profile.name}</h2>

                    <div className="w-full text-center">
                        <p className="text-brand-accent font-semibold">等級 {profile.level}</p>
                        <div className="w-full bg-brand-primary rounded-full h-2.5 my-2 border border-brand-accent/20">
                            <div className="bg-brand-accent h-2 rounded-full m-px" style={{ width: `calc(${xpPercentage}% - 2px)` }}></div>
                        </div>
                        <p className="text-xs text-brand-muted">{profile.xp} / {profile.xpToNextLevel} 經驗值</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-brand-secondary p-4 rounded-lg border-2 border-brand-accent/20">
                        <p className="text-2xl font-bold text-brand-accent">{profile.missionsCompleted}</p>
                        <p className="text-sm text-brand-muted">完成任務</p>
                    </div>
                    <div className="bg-brand-secondary p-4 rounded-lg border-2 border-brand-accent/20">
                        <p className="text-2xl font-bold text-brand-accent">{profile.checkIns}</p>
                        <p className="text-sm text-brand-muted">打卡次數</p>
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-bold text-brand-light mb-4">最近動態</h3>
                    <div className="space-y-4">
                        {friendFeed.length > 0 ? (
                            friendFeed.map(item => (
                                <FeedCard 
                                    key={item.id} 
                                    item={item} 
                                    isLink={false} 
                                    onToggleLike={handleToggleLike} 
                                    onAddComment={handleAddComment} 
                                    currentUserProfile={currentUser}
                                    stores={stores}
                                />
                            ))
                        ) : (
                            <div className="text-center p-6 bg-brand-secondary rounded-lg border-2 border-brand-accent/20">
                                <p className="text-brand-muted">這位好友最近很低調，沒有任何動態。</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FriendProfilePage;