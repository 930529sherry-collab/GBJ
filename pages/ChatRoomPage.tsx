



import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserProfile, ChatMessage } from '../types';
import { BackIcon, PaperAirplaneIcon } from '../components/icons/ActionIcons';
import { getFriends, updateUserProfile, getUserProfile, chatApi } from '../utils/api';
import firebase, { db } from '../firebase/config';
import { formatTime, formatDateHeader } from '../constants';

const ChatRoomPage: React.FC = () => {
    const { friendId } = useParams<{ friendId: string }>();
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [friend, setFriend] = useState<UserProfile | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);

    const targetFriendId = friendId || '0';

    useEffect(() => {
        const initChat = async () => {
            const profileData = localStorage.getItem('userProfile');
            if (!profileData) {
                navigate('/');
                return;
            }
            const user: UserProfile = JSON.parse(profileData);
            setCurrentUser(user);
            
            // Mark messages as read (clear global unread flag)
            if (user.hasUnreadChats) {
                const updatedUser = { ...user, hasUnreadChats: false };
                localStorage.setItem('userProfile', JSON.stringify(updatedUser));
                setCurrentUser(updatedUser);
                if (user.id !== 0) {
                    updateUserProfile(String(user.id), { hasUnreadChats: false })
                        .catch(e => console.error("Failed to clear unread status", e));
                }
            }

            try {
                const friends = await getFriends(user.id);
                let foundFriend = friends.find(f => String(f.id) === String(targetFriendId));
                
                if (!foundFriend) {
                    try {
                        console.log(`Friend ${targetFriendId} not in list, fetching profile directly...`);
                        foundFriend = await getUserProfile(targetFriendId);
                    } catch (profileError) {
                        console.warn(`Could not fetch profile for ${targetFriendId}`, profileError);
                    }
                }
                
                if (foundFriend) {
                    setFriend(foundFriend);
                } else {
                    setFriend({ id: targetFriendId, name: `用戶 ${String(targetFriendId).substring(0,6)}...`, avatarUrl: 'https://picsum.photos/200', level: 0, xp: 0, xpToNextLevel: 0, points: 0, missionsCompleted: 0, checkIns: 0, friends: [], latlng: { lat: 0, lng: 0 } }); 
                }
            } catch (e) {
                console.error("Error getting friend info", e);
            }
            setLoading(false);
        };
        initChat();
    }, [targetFriendId, navigate]);

    // Real-time Firestore Listener
    useEffect(() => {
        if (!currentUser || !db) return;

        const chatId = [String(currentUser.id), String(targetFriendId)].sort().join('_');
        const messagesRef = db.collection('chats').doc(chatId).collection('messages');
        // Order by DESC (Newest first) for inverted list
        const q = messagesRef.orderBy('timestamp', 'desc');

        const unsubscribe = q.onSnapshot((snapshot) => {
            const msgs: ChatMessage[] = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as ChatMessage));
            setMessages(msgs);
        }, (error) => {
            const errorMsg = error.message || String(error);
            if (error.code === 'permission-denied' || errorMsg.includes('Missing or insufficient permissions') || errorMsg.includes('permission-denied')) {
                console.warn("Chat listener permission denied.");
                // Stop loading if it was the initial load
                setLoading(false); 
            } else {
                console.error("Chat listener error:", error);
            }
        });

        return () => unsubscribe();
    }, [currentUser, targetFriendId]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const textToSend = newMessage.trim();
        if (!textToSend || !currentUser || !db) return;

        setNewMessage('');

        const chatId = [String(currentUser.id), String(targetFriendId)].sort().join('_');
        
        // Optimistic update
        const optimisticMessage: ChatMessage = {
            id: `local-${Date.now()}`,
            text: textToSend,
            senderId: currentUser.id,
            timestamp: new Date(),
        };
        setMessages(prev => [optimisticMessage, ...prev]);
        
        try {
            await chatApi.sendMessage(chatId, textToSend, currentUser.id, targetFriendId);
        } catch (error) {
            console.error("Error sending message:", error);
            // Revert optimistic update on failure
            setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
            setNewMessage(textToSend); // Restore text
            alert("訊息傳送失敗，請稍後再試。");
        }
    };

    if (loading) return <div className="p-10 text-center text-brand-accent">進入聊天室...</div>;

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] -mt-4 -mx-4">
            {/* Chat Header */}
            <div className="bg-brand-secondary/95 backdrop-blur-md p-4 flex items-center gap-4 border-b border-brand-accent/20 sticky top-0 z-10 shadow-sm flex-shrink-0">
                <button onClick={() => navigate('/feed')} className="text-brand-muted hover:text-brand-light">
                    <BackIcon />
                </button>
                {friend && (
                    <div className="flex items-center gap-3">
                        <img src={friend.avatarUrl} alt={friend.name} className="w-10 h-10 rounded-full object-cover border border-brand-accent/30" />
                        <h2 className="font-bold text-brand-light text-lg">{friend.name}</h2>
                    </div>
                )}
            </div>

            {/* Messages Area - Inverted Layout (flex-col-reverse) */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 space-y-reverse flex flex-col-reverse bg-brand-primary">
                {messages.map((msg, index) => {
                    const isMe = String(msg.senderId) === String(currentUser?.id);
                    const currentDate = formatDateHeader(msg.timestamp);
                    
                    // Check if we need a date header AFTER this message (visually ABOVE)
                    // Compare with the NEXT message in the array (which is older)
                    const nextMsg = messages[index + 1];
                    const prevDate = nextMsg ? formatDateHeader(nextMsg.timestamp) : null;
                    const showDateHeader = currentDate !== prevDate;

                    return (
                        <React.Fragment key={msg.id}>
                            <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <div 
                                    className={`max-w-[75%] px-4 py-2 rounded-2xl text-base shadow-sm break-words ${
                                        isMe 
                                        ? 'bg-brand-brown-cta text-brand-text-on-accent rounded-br-none' 
                                        : 'bg-brand-secondary text-brand-light border border-brand-accent/10 rounded-bl-none'
                                    }`}
                                >
                                    {msg.text}
                                </div>
                                <span className="text-[10px] text-brand-muted mt-1 px-1">
                                    {formatTime(msg.timestamp)}
                                </span>
                            </div>
                            {showDateHeader && (
                                <div className="text-center my-4">
                                    <span className="text-xs text-brand-muted bg-brand-secondary/80 px-3 py-1 rounded-full border border-brand-accent/10">
                                        {currentDate}
                                    </span>
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-brand-secondary border-t border-brand-accent/20 flex-shrink-0">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="輸入訊息..."
                        className="flex-grow bg-brand-primary border-2 border-brand-accent/30 rounded-full px-4 py-2 text-brand-light focus:ring-brand-accent focus:border-brand-accent transition-colors"
                    />
                    <button 
                        type="submit" 
                        disabled={!newMessage.trim()}
                        className="bg-brand-accent text-brand-primary p-2.5 rounded-full hover:bg-opacity-80 transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                    >
                        <PaperAirplaneIcon className="w-6 h-6" filled />
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChatRoomPage;