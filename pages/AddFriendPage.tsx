import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchableUser, UserProfile } from '../types';
import { BackIcon } from '../components/icons/ActionIcons';
import { searchUsers, addFriend } from '../utils/api';

const AddFriendPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [results, setResults] = useState<SearchableUser[]>([]);
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const profileData = localStorage.getItem('userProfile');
        const loadedProfile: UserProfile | null = profileData ? JSON.parse(profileData) : null;
        setCurrentUser(loadedProfile);
    }, []);

    useEffect(() => {
        if (!searchTerm.trim() || !currentUser) {
            setResults([]);
            return;
        }

        const performSearch = async () => {
            setIsLoading(true);
            setError('');
            try {
                const users = await searchUsers(searchTerm);
                // FIX: Correctly construct `SearchableUser` object in search results by spreading the existing `user` properties. This resolves a TypeScript error where the mapped object was missing required fields.
                const resultsWithFriendStatus = users
                    .filter(user => user.id !== currentUser.id)
                    .map(user => ({
                        ...user,
                        isFriend: currentUser.friends.includes(user.id),
                    }));
                setResults(resultsWithFriendStatus);
            } catch (err) {
                console.error("Search failed:", err);
                setError('搜尋失敗，請稍後再試。');
            } finally {
                setIsLoading(false);
            }
        };
        
        const debounceTimeout = setTimeout(performSearch, 300);
        return () => clearTimeout(debounceTimeout);

    }, [searchTerm, currentUser]);

    const handleAddFriend = async (friendId: number) => {
        if (!currentUser) return;

        try {
            await addFriend(currentUser.id, friendId);

            const updatedCurrentUserProfile: UserProfile = {
                ...currentUser,
                friends: [...currentUser.friends, friendId],
            };

            setCurrentUser(updatedCurrentUserProfile);
            localStorage.setItem('userProfile', JSON.stringify(updatedCurrentUserProfile));

            setResults(prevResults => prevResults.map(r => r.id === friendId ? { ...r, isFriend: true } : r));

            const friend = results.find(r => r.id === friendId);
            setSuccessMessage(`已成功新增 ${friend?.name || ''} 為好友！`);
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            console.error("Failed to add friend", err);
            setError('新增好友失敗，請稍後再試。');
            setTimeout(() => setError(''), 3000);
        }
    };


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
                    placeholder="輸入好友ID... (例如 GUNBOOJO-A1B2)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-brand-secondary border-2 border-brand-accent/50 rounded-lg p-3 pl-10 text-brand-light focus:ring-brand-accent focus:border-brand-accent transition-colors"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                     <svg className="w-5 h-5 text-brand-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
            </div>
            
            {(successMessage || error) && (
                 <div className={`${successMessage ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'} text-sm font-semibold p-3 rounded-lg text-center animate-fade-in`}>
                    {successMessage || error}
                </div>
            )}


            {/* Search Results */}
            <div className="space-y-3">
                {isLoading ? (
                     <div className="text-center p-10 text-brand-muted">搜尋中...</div>
                ) : searchTerm.trim() && results.length > 0 ? results.map(user => {
                    return (
                        <div key={user.id} className="bg-brand-secondary p-3 rounded-lg flex items-center justify-between gap-4 border-2 border-brand-accent/20">
                            <div className="flex items-center gap-4">
                                <img src={user.avatarUrl} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                                <div>
                                    <h3 className="font-bold text-brand-light">{user.name}</h3>
                                    <p className="text-sm text-brand-muted">等級 {user.level}</p>
                                </div>
                            </div>
                            {user.isFriend ? (
                                <span className="text-sm font-semibold px-4 py-2 rounded-lg bg-brand-primary text-brand-muted">
                                    好友
                                </span>
                            ) : (
                                <button 
                                    onClick={() => handleAddFriend(user.id)}
                                    className="text-sm font-bold px-4 py-2 rounded-lg bg-brand-accent text-brand-primary transition-transform hover:scale-105"
                                >
                                    新增
                                </button>
                            )}
                        </div>
                    );
                }) : (
                     <div className="text-center p-10 text-brand-muted bg-brand-secondary rounded-lg border-2 border-brand-accent/10">
                        {searchTerm.trim() && !isLoading
                            ? <p>找不到符合「{searchTerm}」的好友ID。</p>
                            : <p>請輸入好友的專屬ID來搜尋。</p>
                        }
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddFriendPage;