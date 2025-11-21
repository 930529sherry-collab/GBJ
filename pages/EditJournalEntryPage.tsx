
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { JournalEntry, Store, UserProfile } from '../types';
import { BackIcon, StarIcon } from '../components/icons/ActionIcons';
import { MOCK_STORES, formatDate } from '../constants';

const EditJournalEntryPage: React.FC = () => {
    const navigate = useNavigate();
    const { entryId } = useParams<{ entryId: string }>();
    
    const [storeId, setStoreId] = useState<number | string>('');
    const [drinkName, setDrinkName] = useState('');
    const [rating, setRating] = useState(0);
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState(formatDate(new Date()));
    const [imageUrl, setImageUrl] = useState('');
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | number>(0);

    const isEditing = !!entryId;

    useEffect(() => {
        // Load User ID
        const profileData = localStorage.getItem('userProfile');
        const profile: UserProfile | null = profileData ? JSON.parse(profileData) : null;
        setUserId(profile ? profile.id : 0);

        const savedStores = localStorage.getItem('stores');
        setStores(savedStores ? JSON.parse(savedStores) : MOCK_STORES);
        
        if (isEditing) {
            const savedEntries = localStorage.getItem('journalEntries');
            const entries: JournalEntry[] = savedEntries ? JSON.parse(savedEntries) : [];
            const entryToEdit = entries.find(e => String(e.id) === entryId);
            
            if (entryToEdit) {
                setStoreId(entryToEdit.storeId);
                setDrinkName(entryToEdit.drinkName);
                setRating(entryToEdit.rating);
                setNotes(entryToEdit.notes);
                setDate(entryToEdit.date);
                setImageUrl(entryToEdit.imageUrl || '');
            } else {
                // Entry not found, maybe redirect back
                navigate('/journal');
            }
        }
        setLoading(false);
    }, [entryId, isEditing, navigate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedStore = stores.find(s => s.id === Number(storeId));
        if (!selectedStore || rating === 0) return;

        const savedEntries = localStorage.getItem('journalEntries');
        const entries: JournalEntry[] = savedEntries ? JSON.parse(savedEntries) : [];
        
        let updatedEntries = [...entries];

        if (isEditing) {
            const index = updatedEntries.findIndex(e => String(e.id) === entryId);
            if (index > -1) {
                updatedEntries[index] = {
                    ...updatedEntries[index],
                    // Ensure user ID is preserved or updated if originally missing
                    userId: userId, 
                    storeId: selectedStore.id,
                    storeName: selectedStore.name,
                    drinkName,
                    rating,
                    notes,
                    date,
                    imageUrl,
                };
            }
        } else {
            const newEntry: JournalEntry = {
                id: Date.now(),
                userId: userId, // Assign owner
                storeId: selectedStore.id,
                storeName: selectedStore.name,
                drinkName,
                rating,
                notes,
                date,
                imageUrl,
            };
            updatedEntries.unshift(newEntry);
        }

        localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
        navigate('/journal');
    };
    
    const isFormValid = storeId && drinkName.trim() && rating > 0;

    if (loading) {
         return <div className="text-center p-10 text-brand-accent">載入中...</div>;
    }

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex items-center gap-2">
                 <button onClick={() => navigate('/journal')} className="flex items-center gap-2 text-brand-muted hover:text-brand-light transition-colors font-semibold">
                    <BackIcon />
                    <span>返回筆記列表</span>
                </button>
            </div>

            <div className="bg-brand-secondary p-6 rounded-2xl border-2 border-brand-accent/20">
                <h2 className="text-2xl font-bold text-brand-accent mb-6 text-center">
                    {isEditing ? '編輯品飲筆記' : '新增品飲筆記'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                     <div>
                        <label htmlFor="store" className="block text-sm font-medium text-brand-light mb-1">酒吧*</label>
                        <select 
                            id="store" 
                            value={storeId} 
                            onChange={e => setStoreId(e.target.value)} 
                            required 
                            className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-3 text-brand-light focus:ring-brand-accent focus:border-brand-accent"
                        >
                            <option value="" disabled>選擇一家酒吧</option>
                            {stores.sort((a,b) => a.name.localeCompare(b.name, 'zh-Hant')).map(store => (
                                <option key={store.id} value={store.id}>{store.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label htmlFor="drinkName" className="block text-sm font-medium text-brand-light mb-1">品項名稱*</label>
                        <input 
                            type="text" 
                            id="drinkName" 
                            value={drinkName} 
                            onChange={e => setDrinkName(e.target.value)} 
                            required 
                            className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-3 text-brand-light focus:ring-brand-accent focus:border-brand-accent" 
                            placeholder="例如：Mojito" 
                        />
                    </div>
                    
                     <div>
                        <label className="block text-sm font-medium text-brand-light mb-2">評分*</label>
                        <div className="flex items-center gap-2">
                            {[...Array(5)].map((_, i) => (
                                <button type="button" key={i} onClick={() => setRating(i + 1)} aria-label={`Rate ${i + 1} stars`}>
                                    <StarIcon className={`w-10 h-10 cursor-pointer transition-colors ${i < rating ? 'text-yellow-400' : 'text-brand-muted/40 hover:text-yellow-300'}`} />
                                </button>
                            ))}
                        </div>
                    </div>
                    
                     <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-brand-light mb-1">心得筆記</label>
                        <textarea 
                            id="notes" 
                            value={notes} 
                            onChange={e => setNotes(e.target.value)} 
                            rows={5} 
                            className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-3 text-brand-light focus:ring-brand-accent focus:border-brand-accent" 
                            placeholder="分享你的口感、香氣或當下的心情..."
                        ></textarea>
                    </div>
                    
                     <div>
                        <label htmlFor="date" className="block text-sm font-medium text-brand-light mb-1">日期</label>
                        <input 
                            type="date" 
                            id="date" 
                            value={date} 
                            onChange={e => setDate(e.target.value)} 
                            className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-3 text-brand-light focus:ring-brand-accent focus:border-brand-accent" 
                        />
                    </div>
                    
                    <div>
                        <label htmlFor="imageUrl" className="block text-sm font-medium text-brand-light mb-1">圖片網址 (選填)</label>
                        <input 
                            type="text" 
                            id="imageUrl" 
                            value={imageUrl} 
                            onChange={e => setImageUrl(e.target.value)} 
                            className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-3 text-brand-light focus:ring-brand-accent focus:border-brand-accent" 
                            placeholder="https://example.com/image.png" 
                        />
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button 
                            type="button" 
                            onClick={() => navigate('/journal')} 
                            className="flex-1 bg-brand-primary border-2 border-brand-accent text-brand-light font-semibold py-3 px-4 rounded-lg hover:bg-brand-accent/10 transition-colors"
                        >
                            取消
                        </button>
                        <button 
                            type="submit" 
                            disabled={!isFormValid} 
                            className="flex-1 bg-brand-accent text-brand-primary font-bold py-3 px-4 rounded-lg hover:bg-opacity-80 transition-colors disabled:bg-brand-muted/50 disabled:cursor-not-allowed"
                        >
                            儲存筆記
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditJournalEntryPage;
