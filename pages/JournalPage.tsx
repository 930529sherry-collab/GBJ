
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { JournalEntry, UserProfile } from '../types';
import { BackIcon, PlusIcon, StarIcon, BookOpenIcon, XIcon, PencilSquareIcon, TrashIcon } from '../components/icons/ActionIcons';
import { journalApi } from '../utils/api';

const ViewJournalModal: React.FC<{
    entry: JournalEntry | null;
    isOpen: boolean;
    onClose: () => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
}> = ({ entry, isOpen, onClose, onEdit, onDelete }) => {
    if (!isOpen || !entry) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4 backdrop-blur-md animate-fade-in">
            <div className="bg-brand-secondary rounded-2xl p-6 w-full max-w-sm border-2 border-brand-accent/30 shadow-2xl shadow-brand-accent/10 relative">
                <div className="absolute top-4 right-4 flex gap-2">
                    <button onClick={() => onEdit(entry.id)} className="text-brand-muted hover:text-brand-light p-1 rounded-full hover:bg-brand-primary transition-colors">
                        <PencilSquareIcon />
                    </button>
                    <button onClick={() => onDelete(entry.id)} className="text-red-500/70 hover:text-red-500 p-1 rounded-full hover:bg-red-500/10 transition-colors">
                        <TrashIcon />
                    </button>
                     <button onClick={onClose} className="text-brand-muted hover:text-brand-light p-1 rounded-full hover:bg-brand-primary transition-colors">
                        <XIcon />
                    </button>
                </div>
                
                <div className="space-y-4 pt-8">
                     {entry.imageUrl && (
                        <img 
                            src={entry.imageUrl} 
                            alt={entry.drinkName} 
                            className="w-full h-40 object-cover rounded-lg border-2 border-brand-accent/10"
                        />
                    )}
                    
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-brand-accent">{entry.drinkName}</h2>
                            {entry.storeName && <p className="text-md font-semibold text-brand-muted">{entry.storeName}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                            <div className="flex items-center">
                                {[...Array(5)].map((_, i) => <StarIcon key={i} className={`w-6 h-6 ${i < entry.rating ? 'text-yellow-400' : 'text-brand-muted/30'}`} />)}
                            </div>
                            <p className="text-sm text-brand-muted mt-1">{entry.date}</p>
                        </div>
                    </div>
                    
                    {entry.notes && (
                        <div className="border-t border-brand-accent/10 pt-4">
                            <p className="text-brand-light whitespace-pre-wrap">{entry.notes}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Journal Page Component
const JournalPage: React.FC = () => {
    const navigate = useNavigate();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const profileData = localStorage.getItem('userProfile');
            if (profileData) {
                const profile: UserProfile = JSON.parse(profileData);
                setCurrentUser(profile);
                try {
                    const cloudEntries = await journalApi.getJournalEntries(String(profile.id));
                    setEntries(cloudEntries);
                } catch (e) {
                    console.error("Failed to load journal entries from cloud:", e);
                    setEntries([]);
                }
            } else {
                setEntries([]);
            }
            setLoading(false);
        };
        loadData();
    }, []);

    const handleAddClick = () => {
        navigate('/journal/edit');
    };

    const handleOpenViewModal = (entry: JournalEntry) => {
        setSelectedEntry(entry);
        setIsViewModalOpen(true);
    };

    const handleCloseViewModal = () => {
        setIsViewModalOpen(false);
        setSelectedEntry(null);
    };
    
    const handleEdit = (id: string) => {
        handleCloseViewModal();
        navigate(`/journal/edit/${id}`);
    };
    
    const handleDelete = async (id: string) => {
        if (!currentUser) return;
        if (window.confirm("確定要刪除這篇筆記嗎？此操作無法復原。")) {
            try {
                // FIX: Corrected call to journalApi.
                await journalApi.deleteJournalEntry(String(currentUser.id), id);
                setEntries(prev => prev.filter(entry => entry.id !== id));
                handleCloseViewModal();
                alert("筆記已刪除");
            } catch (error) {
                console.error("Failed to delete journal entry:", error);
                alert("刪除失敗，請稍後再試。");
            }
        }
    };
    
    if (loading) {
        return <div className="text-center p-10 text-brand-accent">正在打開你的筆記本...</div>;
    }
    
    return (
        <>
            <div className="animate-fade-in space-y-6">
                <div className="flex items-center justify-between">
                    <button onClick={() => navigate('/profile')} className="flex items-center gap-2 text-brand-muted hover:text-brand-light transition-colors font-semibold">
                        <BackIcon />
                        <span>返回個人檔案</span>
                    </button>
                    <button 
                        onClick={handleAddClick} 
                        className="flex items-center gap-2 bg-brand-button-bg text-brand-light font-semibold text-sm py-2 px-3 rounded-lg hover:bg-brand-button-bg-hover transition-colors"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span>新增筆記</span>
                    </button>
                </div>
                
                <div className="space-y-4">
                    {entries.length > 0 ? (
                        entries.map(entry => (
                            <div key={entry.id} onClick={() => handleOpenViewModal(entry)} className="bg-brand-secondary p-4 rounded-xl border-2 border-brand-accent/20 shadow-lg shadow-brand-accent/10 relative cursor-pointer hover:border-brand-accent/50 transition-colors">
                                 {entry.imageUrl && 
                                    <img src={entry.imageUrl} alt={entry.drinkName} className="w-full h-32 object-cover rounded-md mb-3" />
                                 }
                                 <div className="flex justify-between items-start">
                                    <div>
                                        {entry.storeName && <p className="text-sm font-semibold text-brand-muted">{entry.storeName}</p>}
                                        <h3 className="text-xl font-bold text-brand-accent">{entry.drinkName}</h3>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <div className="flex items-center">
                                            {[...Array(5)].map((_, i) => <StarIcon key={i} className={`w-5 h-5 ${i < entry.rating ? 'text-yellow-400' : 'text-brand-muted/30'}`} />)}
                                        </div>
                                        <p className="text-xs text-brand-muted mt-1">{entry.date}</p>
                                    </div>
                                 </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center p-10 flex flex-col items-center justify-center h-full bg-brand-secondary rounded-xl border-2 border-brand-accent/10">
                            <BookOpenIcon className="w-16 h-16 text-brand-muted mb-4" />
                            <h2 className="text-xl font-bold text-brand-light mt-4 mb-2">你的品飲筆記是空的</h2>
                            <p className="text-brand-muted">點擊「新增筆記」來記錄你的第一杯酒吧！</p>
                        </div>
                    )}
                </div>
            </div>
            <ViewJournalModal 
                entry={selectedEntry}
                isOpen={isViewModalOpen}
                onClose={handleCloseViewModal}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        </>
    );
};

export default JournalPage;
