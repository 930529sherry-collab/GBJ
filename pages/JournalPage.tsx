

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { JournalEntry } from '../types';
import { BackIcon, PlusIcon, StarIcon, BookOpenIcon } from '../components/icons/ActionIcons';

// Journal Page Component
const JournalPage: React.FC = () => {
    const navigate = useNavigate();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            const savedEntries = localStorage.getItem('journalEntries');
            setEntries(savedEntries ? JSON.parse(savedEntries) : []);
            setLoading(false);
        }, 300);
    }, []);

    const handleAddClick = () => {
        navigate('/journal/edit');
    };

    const handleEditClick = (entry: JournalEntry) => {
        navigate(`/journal/edit/${entry.id}`);
    };

    if (loading) {
        return <div className="text-center p-10 text-brand-accent">正在打開你的筆記本...</div>;
    }
    
    return (
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
                    entries.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(entry => (
                        <div key={entry.id} className="bg-brand-secondary p-4 rounded-xl border-2 border-brand-accent/20 shadow-lg shadow-brand-accent/10">
                             {entry.imageUrl && <img src={entry.imageUrl} alt={entry.drinkName} className="w-full h-32 object-cover rounded-md mb-3" />}
                             <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-semibold text-brand-muted">{entry.storeName}</p>
                                    <h3 className="text-xl font-bold text-brand-accent">{entry.drinkName}</h3>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <div className="flex items-center">
                                        {[...Array(5)].map((_, i) => <StarIcon key={i} className={`w-5 h-5 ${i < entry.rating ? 'text-yellow-400' : 'text-brand-muted/30'}`} />)}
                                    </div>
                                    <p className="text-xs text-brand-muted mt-1">{entry.date}</p>
                                </div>
                             </div>
                             {entry.notes && <p className="text-brand-light mt-3 border-t border-brand-accent/10 pt-3">{entry.notes}</p>}
                             <div className="text-right mt-3">
                                 <button onClick={() => handleEditClick(entry)} className="text-sm font-semibold text-brand-light hover:underline">編輯</button>
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
    );
};

export default JournalPage;