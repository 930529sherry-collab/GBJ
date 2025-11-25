
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Store, JournalEntry, UserProfile } from '../types';
import { BackIcon, StarIcon, XIcon } from '../components/icons/ActionIcons';
import { MOCK_STORES, formatDate } from '../constants';
import { journalApi, updateAllMissionProgress } from '../utils/api';

const EditJournalEntryPage: React.FC = () => {
    const navigate = useNavigate();
    const { entryId } = useParams<{ entryId?: string }>();
    const isEditing = Boolean(entryId);
    
    const [storeId, setStoreId] = useState<number | string>('');
    const [drinkName, setDrinkName] = useState('');
    const [rating, setRating] = useState(0);
    const [notes, setNotes] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [imageUrl, setImageUrl] = useState('');
    const [stores, setStores] = useState<Store[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            const savedStores = localStorage.getItem('stores');
            setStores(savedStores ? JSON.parse(savedStores) : MOCK_STORES);
            
            const profileData = localStorage.getItem('userProfile');
            if (profileData) {
                const profile = JSON.parse(profileData);
                setCurrentUser(profile);

                if (isEditing && entryId) {
                    setLoading(true);
                    try {
                        // FIX: Corrected call to journalApi.
                        const entryToEdit = await journalApi.getJournalEntry(String(profile.id), entryId);
                        if (entryToEdit) {
                            setStoreId(entryToEdit.storeId);
                            setDrinkName(entryToEdit.drinkName);
                            setRating(entryToEdit.rating);
                            setNotes(entryToEdit.notes);
                            setDate(entryToEdit.date);
                            setImageUrl(entryToEdit.imageUrl || '');
                        } else {
                             console.error("Entry not found");
                             navigate('/journal');
                        }
                    } catch (e) {
                        console.error("Failed to load entry for editing", e);
                        navigate('/journal');
                    }
                    setLoading(false);
                } else {
                    setLoading(false);
                }
            } else {
                // Not logged in, redirect
                navigate('/');
                setLoading(false);
            }
        };
        loadData();
    }, [entryId, isEditing, navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!drinkName.trim() || rating === 0) {
            alert("請填寫品項與評分。");
            return;
        }

        if (!currentUser) {
            alert("無法識別使用者，請重新登入。");
            return;
        }

        setIsSaving(true);
        const selectedStore = stores.find(s => s.id === Number(storeId));

        const entryData = {
            storeId: Number(storeId) || 0,
            storeName: selectedStore?.name || '',
            drinkName: drinkName.trim(),
            rating,
            notes: notes.trim(),
            date,
            imageUrl: imageUrl.trim(),
            userId: currentUser.id // Ensure userId is saved
        };

        try {
            if (isEditing && entryId) {
                // FIX: Corrected call to journalApi.
                await journalApi.updateJournalEntry(String(currentUser.id), entryId, entryData);
            } else {
                // FIX: Corrected call to journalApi.
                await journalApi.createJournalEntry(String(currentUser.id), entryData as Omit<JournalEntry, 'id'>);
            }
            setIsSaving(false);
            alert(isEditing ? "筆記已更新！" : "筆記已新增！");
            
            // Trigger mission update
            if (!currentUser.isGuest) {
                updateAllMissionProgress(currentUser.id);
            }
            
            navigate('/journal');

        } catch (error) {
            setIsSaving(false);
            alert("儲存失敗，請稍後再試。");
            console.error("Failed to save journal entry:", error);
        }
    };
    
    const handleCancel = () => {
        if (isEditing && entryId) {
            navigate(`/journal/view/${entryId}`);
        } else {
            navigate('/journal');
        }
    };

    const isFormValid = drinkName.trim() && rating > 0;

    if (loading) {
        return <div className="text-center p-10 text-brand-accent">讀取筆記中...</div>;
    }

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex items-center gap-2">
                 <button onClick={handleCancel} className="flex items-center gap-2 text-brand-muted hover:text-brand-light transition-colors font-semibold">
                    <BackIcon />
                    <span>返回</span>
                </button>
            </div>

            <div className="bg-brand-secondary p-6 rounded-2xl border-2 border-brand-accent/20">
                <h2 className="text-2xl font-bold text-brand-accent mb-6 text-center">
                    {isEditing ? '編輯品飲筆記' : '新增品飲筆記'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                     <div>
                        <label htmlFor="store" className="block text-sm font-medium text-brand-light mb-1">酒吧 (選填)</label>
                        <select 
                            id="store" 
                            value={storeId} 
                            onChange={e => setStoreId(e.target.value)} 
                            className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-3 text-brand-light focus:ring-brand-accent focus:border-brand-accent"
                        >
                            <option value="">選擇一家酒吧</option>
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
                        <div className="flex justify-between items-center">
                            <label htmlFor="notes" className="block text-sm font-medium text-brand-light mb-1">心得筆記</label>
                            <span className={`text-xs font-mono ${notes.length > 30 ? 'text-red-500' : 'text-brand-muted'}`}>
                                {notes.length}/30
                            </span>
                        </div>
                        <textarea 
                            id="notes" 
                            value={notes} 
                            onChange={e => setNotes(e.target.value)} 
                            rows={3}
                            maxLength={30} 
                            className="w-full bg-brand-primary border border-brand-accent/50 rounded-md p-3 text-brand-light focus:ring-brand-accent focus:border-brand-accent" 
                            placeholder="分享你的口感、香氣或當下的心情..."
                        ></textarea>
                    </div>

                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-brand-light mb-1">品飲日期*</label>
                        <input
                            type="date"
                            id="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            required
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
                         {imageUrl && (
                            <div className="mt-4 relative">
                                <p className="text-xs text-brand-muted mb-2">圖片預覽：</p>
                                <img 
                                    src={imageUrl} 
                                    alt="Image Preview" 
                                    className="w-full h-auto max-h-48 rounded-lg object-cover border-2 border-brand-accent/20"
                                    onError={(e) => { 
                                        const target = e.target as HTMLImageElement;
                                        target.onerror = null; 
                                        target.style.display = 'none'; 
                                        const errorMsg = target.nextSibling as HTMLElement;
                                        if (errorMsg) errorMsg.style.display = 'block';
                                    }}
                                />
                                <p style={{display: 'none'}} className="text-red-500 text-sm mt-2">無法載入圖片預覽，請檢查網址。</p>
                                <button 
                                    type="button"
                                    onClick={() => setImageUrl('')}
                                    className="absolute top-8 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                                    aria-label="Clear image URL"
                                >
                                    <XIcon className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button 
                            type="button" 
                            onClick={handleCancel} 
                            className="flex-1 bg-brand-primary border-2 border-brand-accent text-brand-light font-semibold py-3 px-4 rounded-lg hover:bg-brand-accent/10 transition-colors"
                        >
                            取消
                        </button>
                        <button 
                            type="submit" 
                            disabled={!isFormValid || isSaving} 
                            className="flex-1 bg-brand-accent text-brand-primary font-bold py-3 px-4 rounded-lg hover:bg-opacity-80 transition-colors disabled:bg-brand-muted/50 disabled:cursor-not-allowed"
                        >
                            {isSaving ? '儲存中...' : '儲存筆記'}
                        </button>
                    </div>
                </form>

                {isEditing && (
                    <div className="mt-8 pt-6 border-t border-brand-accent/10">
                        <button 
                            onClick={async () => {
                                if (window.confirm("確定要刪除這篇筆記嗎？此操作無法復原。")) {
                                    if(currentUser && entryId) {
                                        try {
                                            // FIX: Corrected call to journalApi.
                                            await journalApi.deleteJournalEntry(String(currentUser.id), entryId);
                                            alert("筆記已刪除");
                                            navigate('/journal');
                                        } catch (e) {
                                            alert("刪除失敗");
                                        }
                                    }
                                }
                            }}
                            className="w-full text-center text-red-500 hover:bg-red-500/10 py-2 rounded-lg transition-colors font-semibold"
                        >
                            刪除筆記
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EditJournalEntryPage;
