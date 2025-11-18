

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { JournalEntry, Store, UserProfile } from '../types';
import { BackIcon, PlusIcon, StarIcon, XIcon, BookOpenIcon } from '../components/icons/ActionIcons';
import { MOCK_STORES, formatDate } from '../constants';

// Modal Component for adding/editing entries
const JournalEntryModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSave: (entry: Omit<JournalEntry, 'id'> & { id?: number }) => void;
    entryToEdit?: JournalEntry | null;
}> = ({ isOpen, onClose, onSave, entryToEdit }) => {
    const [storeId, setStoreId] = useState<number | string>('');
    const [drinkName, setDrinkName] = useState('');
    const [rating, setRating] = useState(0);
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState(formatDate(new Date()));
    const [imageUrl, setImageUrl] = useState('');
    const [stores, setStores] = useState<Store[]>([]);

    useEffect(() => {
        const savedStores = localStorage.getItem('stores');
        setStores(savedStores ? JSON.parse(savedStores) : MOCK_STORES);
        
        if (entryToEdit) {
            setStoreId(entryToEdit.storeId);
            setDrinkName(entryToEdit.drinkName);
            setRating(entryToEdit.rating);
            setNotes(entryToEdit.notes);
            setDate(entryToEdit.date);
            setImageUrl(entryToEdit.imageUrl || '');
        } else {
            // Reset form for new entry
            setStoreId('');
            setDrinkName('');
            setRating(0);
            setNotes('');
            setDate(formatDate(new Date()));
            setImageUrl('');
        }
    }, [entryToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedStore = stores.find(s => s.id === Number(storeId));
        if (!selectedStore || rating === 0) return;

        onSave({
            id: entryToEdit?.id,
            storeId: selectedStore.id,
            storeName: selectedStore.name,
            drinkName,
            rating,
            notes,
            date,
            imageUrl,
        });
    };
    
    const isFormValid = storeId && drinkName.trim() && rating > 0;

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4 backdrop-blur-sm animate-fade-in">
            <form onSubmit={handleSubmit} className="bg-brand-secondary rounded-2xl p-6 w-full max-w-sm border-2 border-brand-accent/30 shadow-2xl shadow-brand-accent/10 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-brand-accent">{entryToEdit ? '編輯筆記' : '新增筆記'}</h2>
                    <button type="button" onClick={onClose} className="text-brand-muted hover:text-brand-light"><XIcon /></button>
                </div>

                <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                     <div>
                        <label htmlFor="store" className="block text-sm font-medium text-brand-light mb-1">酒吧*</label>
                        <select id="store" value={storeId} onChange={e => setStoreId(e.target.value)} required className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-2 text-brand-light focus:ring-brand-accent focus:border-brand-accent">
                            <option value="" disabled>選擇一家酒吧</option>
                            {stores.sort((a,b) => a.name.localeCompare(b.name, 'zh-Hant')).map(store => <option key={store.id} value={store.id}>{store.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="drinkName" className="block text-sm font-medium text-brand-light mb-1">品項名稱*</label>
                        <input type="text" id="drinkName" value={drinkName} onChange={e => setDrinkName(e.target.value)} required className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-2 text-brand-light" placeholder="例如：Mojito" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-brand-light mb-2">評分*</label>
                        <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                                <button type="button" key={i} onClick={() => setRating(i + 1)} aria-label={`Rate ${i + 1} stars`}>
                                    <StarIcon className={`w-8 h-8 cursor-pointer transition-colors ${i < rating ? 'text-yellow-400' : 'text-brand-muted/40 hover:text-yellow-300'}`} />
                                </button>
                            ))}
                        </div>
                    </div>
                     <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-brand-light mb-1">筆記</label>
                        <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={4} className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-2 text-brand-light" placeholder="分享你的體驗..."></textarea>
                    </div>
                     <div>
                        <label htmlFor="date" className="block text-sm font-medium text-brand-light mb-1">日期</label>
                        <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-2 text-brand-light" />
                    </div>
                    <div>
                        <label htmlFor="imageUrl" className="block text-sm font-medium text-brand-light mb-1">圖片網址 (選填)</label>
                        <input type="text" id="imageUrl" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-2 text-brand-light" placeholder="https://example.com/image.png" />
                    </div>
                </div>

                <div className="flex gap-4 mt-6">
                    <button type="button" onClick={onClose} className="flex-1 bg-brand-primary border-2 border-brand-accent text-brand-light font-semibold py-2 px-4 rounded-lg">取消</button>
                    <button type="submit" disabled={!isFormValid} className="flex-1 bg-brand-accent text-brand-primary font-bold py-2 px-4 rounded-lg disabled:bg-brand-muted/50">儲存</button>
                </div>
            </form>
        </div>
    );
};


// Journal Page Component
const JournalPage: React.FC = () => {
    const navigate = useNavigate();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [entryToEdit, setEntryToEdit] = useState<JournalEntry | null>(null);

    useEffect(() => {
        setTimeout(() => {
            const savedEntries = localStorage.getItem('journalEntries');
            setEntries(savedEntries ? JSON.parse(savedEntries) : []);
            setLoading(false);
        }, 500);
    }, []);

    const handleSaveEntry = (entry: Omit<JournalEntry, 'id'> & { id?: number }) => {
        const updatedEntries = [...entries];
        if (entry.id) { // Editing existing
            const index = updatedEntries.findIndex(e => e.id === entry.id);
            if (index > -1) {
                updatedEntries[index] = { ...entry, id: entry.id };
            }
        } else { // Adding new
            const newEntry = { ...entry, id: Date.now() };
            updatedEntries.unshift(newEntry);
        }

        setEntries(updatedEntries);
        localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
        setIsModalOpen(false);
        setEntryToEdit(null);
    };

    const handleOpenModal = (entry?: JournalEntry) => {
        setEntryToEdit(entry || null);
        setIsModalOpen(true);
    };

    if (loading) {
        return <div className="text-center p-10 text-brand-accent">正在打開你的筆記本...</div>;
    }
    
    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-brand-muted hover:text-brand-light transition-colors font-semibold">
                    <BackIcon />
                    <span>返回</span>
                </button>
                <button 
                    onClick={() => handleOpenModal()} 
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
                                 <button onClick={() => handleOpenModal(entry)} className="text-sm font-semibold text-brand-light hover:underline">編輯</button>
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
            
            <JournalEntryModal isOpen={isModalOpen} onClose={() => {setIsModalOpen(false); setEntryToEdit(null);}} onSave={handleSaveEntry} entryToEdit={entryToEdit} />
        </div>
    );
};

export default JournalPage;