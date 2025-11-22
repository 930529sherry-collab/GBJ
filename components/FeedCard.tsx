import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom'; // Import ReactDOM for Portal
import { Link } from 'react-router-dom';
import { FeedItem, Comment, UserProfile, Store } from '../types';
import { MapPinIcon, TrophyIcon, UserGroupIcon, UserPlusIcon } from './icons/NavIcons';
import { HeartIcon, ChatBubbleIcon, PaperAirplaneIcon, GlobeIcon, LockClosedIcon, XIcon } from './icons/ActionIcons';
import { formatDateTime } from '../constants';

// Image Modal Component using a Portal
const ImageModal: React.FC<{ src: string; isOpen: boolean; onClose: () => void }> = ({ src, isOpen, onClose }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    // Use ReactDOM.createPortal to render the modal at the root of the document
    return ReactDOM.createPortal(
        <div 
            className="fixed inset-0 z-[100] flex justify-center items-center p-4 backdrop-blur-md animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                }} 
                className="fixed top-4 right-4 text-white hover:text-brand-accent transition-colors p-2 z-[101]"
                aria-label="Close image preview"
            >
                <XIcon className="w-8 h-8 drop-shadow-lg" />
            </button>
            
            <img 
                src={src} 
                alt="Full view" 
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl cursor-pointer"
                onClick={(e) => e.stopPropagation()} // Prevent image click from closing modal if needed, but current behavior is click-to-close
            />
        </div>,
        document.body
    );
};

interface FeedCardProps {
    item: FeedItem;
    isLink?: boolean;
    onToggleLike: (itemId: number | string) => void;
    onAddComment: (itemId: number | string, commentText: string, storeName?: string) => void;
    currentUserProfile: UserProfile | null;
    stores: Store[];
}

const FeedCard: React.FC<FeedCardProps> = ({ item, isLink = true, onToggleLike, onAddComment, currentUserProfile, stores }) => {
    const [showComments, setShowComments] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [showStoreSelector, setShowStoreSelector] = useState(false);
    const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
    const [isImageOpen, setIsImageOpen] = useState(false);
    
    const renderIcon = () => {
        const iconClass = "w-6 h-6 text-brand-accent flex-shrink-0";
        switch (item.type) {
            case 'check-in':
                return <MapPinIcon className={"w-6 h-6 text-brand-map-pin flex-shrink-0"} />;
            case 'mission-complete':
                return <TrophyIcon className={iconClass} />;
            case 'new-friend':
                return <UserGroupIcon />;
            default:
                return null;
        }
    };

    const renderVisibilityIcon = () => {
        const iconClass = "w-3 h-3 text-brand-muted/70";
        switch (item.visibility) {
            case 'public':
                return <GlobeIcon className={iconClass} />;
            case 'friends':
                return (
                    <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                );
            case 'private':
                return <LockClosedIcon className={iconClass} />;
            default:
                return <GlobeIcon className={iconClass} />; // Default public
        }
    };

    const headerContent = (
        <div className="flex items-center gap-3 group">
            <img src={item.friendAvatarUrl} alt={item.friendName} className="w-10 h-10 rounded-full object-cover group-hover:opacity-80 transition-opacity" />
            <span className="font-bold text-brand-light group-hover:text-brand-accent transition-colors">{item.friendName}</span>
        </div>
    );
    
    const isCurrentUser = currentUserProfile && item.friendId === currentUserProfile.id;

    const headerLink = isLink ? (
        isCurrentUser ? (
            <Link to="/profile">{headerContent}</Link>
        ) : (
            <Link to={`/friends/${item.friendId}`}>{headerContent}</Link>
        )
    ) : headerContent;

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Check logic remains, but button is always clickable
        if (newComment.trim() || selectedStoreId) {
            const storeName = stores.find(s => s.id === selectedStoreId)?.name;
            onAddComment(item.id, newComment.trim(), storeName);
            setNewComment('');
            setSelectedStoreId(null);
            setShowStoreSelector(false);
        }
    };

    const store = item.storeName ? stores.find(s => s.name === item.storeName) : null;

    // Display formatted date because item.timestamp is now guaranteed to be an ISO string by the API
    const displayTime = formatDateTime(item.timestamp);

    return (
        <>
            <div className="bg-brand-secondary p-4 rounded-xl border-2 border-brand-accent/20 shadow-lg shadow-brand-accent/10 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                    {headerLink}
                    <div className="flex items-center gap-1 text-xs text-brand-muted flex-shrink-0">
                        <span>{displayTime}</span>
                        <span className="opacity-60">·</span>
                        {renderVisibilityIcon()}
                    </div>
                </div>
                <div className="pl-2 flex items-start gap-4">
                    <div className="mt-1">{renderIcon()}</div>
                    <div className="flex-grow">
                        {item.type === 'check-in' ? (
                            <>
                                {item.content && <p className="text-brand-light">{item.content}</p>}
                                {item.storeName && (
                                    <p className={`text-brand-light ${item.content ? 'text-brand-muted text-sm mt-1' : ''}`}>
                                        在 {store ? (
                                            <Link to={`/store/${store.id}`} className="font-bold text-brand-accent hover:underline">{item.storeName}</Link>
                                        ) : (
                                            <span className="font-bold text-brand-accent">{item.storeName}</span>
                                        )} 打卡！
                                    </p>
                                )}
                            </>
                        ) : (
                            <p className="text-brand-light">
                                {item.content.split(item.storeName || item.missionTitle || '').map((part, index, arr) => 
                                    index === arr.length - 1 ? part : (
                                        <React.Fragment key={index}>
                                            {part}
                                            <span className="font-bold text-brand-accent">{item.storeName || item.missionTitle}</span>
                                        </React.Fragment>
                                    )
                                )}
                            </p>
                        )}
                    </div>
                </div>
                
                {item.imageUrl && (
                    <div className="mt-2 pl-12">
                        <img 
                            src={item.imageUrl} 
                            alt="Feed post" 
                            className="w-full h-auto max-h-80 rounded-lg object-contain bg-brand-primary border-2 border-brand-accent/10 cursor-zoom-in hover:opacity-95 transition-opacity"
                            onClick={() => setIsImageOpen(true)}
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                    </div>
                )}

                {/* Actions: Like and Comment */}
                <div className="h-px bg-brand-accent/10 my-1"></div>
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => onToggleLike(item.id)}
                        className="flex items-center gap-2 text-brand-muted hover:text-red-500 transition-colors"
                    >
                        <HeartIcon filled={item.isLiked} className={`w-6 h-6 ${item.isLiked ? 'text-red-500' : ''}`} />
                        <span className="font-semibold text-sm">{item.likes}</span>
                    </button>
                    <button 
                        onClick={() => setShowComments(!showComments)}
                        className="flex items-center gap-2 text-brand-muted hover:text-brand-accent transition-colors"
                    >
                        <ChatBubbleIcon className="w-6 h-6" />
                        <span className="font-semibold text-sm">{item.comments.length}</span>
                    </button>
                </div>
                
                {/* Comments Section */}
                {showComments && (
                    <div className="pt-2 space-y-3">
                        {item.comments.map(comment => {
                            const commentStore = comment.storeName ? stores.find(s => s.name === comment.storeName) : null;
                            return (
                                <div key={comment.id} className="flex items-start gap-3">
                                    <img src={comment.authorAvatarUrl} alt={comment.authorName} className="w-8 h-8 rounded-full object-cover mt-1" />
                                    <div className="flex-grow bg-brand-primary p-2 rounded-lg border border-brand-accent/10">
                                        <div className="flex justify-between items-baseline">
                                            <span className="font-bold text-sm text-brand-light">{comment.authorName}</span>
                                            <span className="text-xs text-brand-muted">{formatDateTime(comment.timestamp)}</span>
                                        </div>
                                        {comment.text && <p className="text-sm text-brand-light mt-1">{comment.text}</p>}
                                        {comment.storeName && (
                                            <p className="text-xs text-brand-muted mt-1 flex items-center gap-1">
                                                <MapPinIcon className="w-3 h-3"/>
                                                在 {commentStore ? (
                                                    <Link to={`/store/${commentStore.id}`} className="font-semibold hover:underline">{comment.storeName}</Link>
                                                ) : (
                                                    <span className="font-semibold">{comment.storeName}</span>
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {currentUserProfile && (
                            <form onSubmit={handleCommentSubmit} className="flex flex-col gap-2 pt-2">
                                <div className="flex items-center gap-2">
                                    <img src={currentUserProfile.avatarUrl} alt="Your avatar" className="w-8 h-8 rounded-full object-cover" />
                                    <div className="relative flex-grow">
                                        <input 
                                            type="text"
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="留個言或打個卡..."
                                            className="w-full bg-brand-primary border-2 border-brand-accent/30 rounded-full py-2 pl-4 pr-20 text-brand-light focus:ring-brand-accent focus:border-brand-accent"
                                        />
                                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                            <button type="button" onClick={() => setShowStoreSelector(!showStoreSelector)} className={`p-1 rounded-full ${showStoreSelector ? 'bg-brand-accent/20' : ''}`}>
                                                <MapPinIcon className="w-5 h-5 text-brand-accent" />
                                            </button>
                                            <button type="submit" className="p-1 text-brand-accent hover:text-brand-light transition-colors">
                                                <PaperAirplaneIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                {showStoreSelector && (
                                    <div className="pl-10">
                                        <div className="max-h-32 overflow-y-auto bg-brand-primary border-2 border-brand-accent/20 rounded-lg p-2 space-y-1">
                                            {stores.map(store => (
                                                <label key={store.id} className="flex items-center p-1.5 rounded-md hover:bg-brand-accent/10 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name={`store-selector-${item.id}`}
                                                        checked={selectedStoreId === store.id}
                                                        onChange={() => setSelectedStoreId(store.id)}
                                                        className="h-4 w-4 text-brand-accent focus:ring-brand-accent border-brand-muted"
                                                    />
                                                    <span className="ml-2 text-sm text-brand-light">{store.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {selectedStoreId && (
                                    <div className="pl-10 text-xs text-brand-muted flex items-center gap-2">
                                        <span>打卡地點：{stores.find(s => s.id === selectedStoreId)?.name}</span>
                                        <button type="button" onClick={() => setSelectedStoreId(null)} className="font-bold text-red-500/80 hover:text-red-500">x</button>
                                    </div>
                                )}
                            </form>
                        )}
                    </div>
                )}
            </div>

            {/* Full Screen Image Modal - Logic only, UI is portaled */}
            {item.imageUrl && (
                <ImageModal 
                    src={item.imageUrl} 
                    isOpen={isImageOpen} 
                    onClose={() => setIsImageOpen(false)} 
                />
            )}
        </>
    );
};

export default FeedCard;