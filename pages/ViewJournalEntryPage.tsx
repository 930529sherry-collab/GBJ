
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { JournalEntry, UserProfile } from '../types';
import { BackIcon, PencilSquareIcon, StarIcon } from '../components/icons/ActionIcons';
import { journalApi } from '../utils/api';

const ViewJournalEntryPage: React.FC = () => {
    const navigate = useNavigate();
    const { entryId } = useParams<{ entryId: string }>();
    const [entry, setEntry] = useState<JournalEntry | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadEntry = async () => {
            if (!entryId) {
                navigate('/journal');
                return;
            }
            
            const profileData = localStorage.getItem('userProfile');
            if (profileData) {
                const profile: UserProfile = JSON.parse(profileData);
                try {
                    // FIX: Corrected call to journalApi.
                    const entryData = await journalApi.getJournalEntry(String(profile.id), entryId);
                    if (entryData) {
                        setEntry(entryData);
                    } else {
                        console.error("Journal entry not found");
                        navigate('/journal');
                    }
                } catch (e) {
                    console.error("Failed to load journal entry:", e);
                    navigate('/journal');
                }
            } else {
                navigate('/'); // Not logged in
            }
            setLoading(false);
        };
        loadEntry();
    }, [entryId, navigate]);

    if (loading) {
        return <div className="text-center p-10 text-brand-accent">正在讀取筆記...</div>;
    }

    if (!entry) {
        return (
            <div className="text-center p-10 text-brand-muted">
                <p>找不到這篇筆記。</p>
                <button onClick={() => navigate('/journal')} className="mt-4 text-brand-accent font-semibold">返回列表</button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex items-center justify-between">
                <button onClick={() => navigate('/journal')} className="flex items-center gap-2 text-brand-muted hover:text-brand-light transition-colors font-semibold">
                    <BackIcon />
                    <span>返回筆記列表</span>
                </button>
                <Link
                    to={`/journal/edit/${entry.id}`}
                    className="flex items-center gap-2 bg-brand-button-bg text-brand-light font-semibold text-sm py-2 px-3 rounded-lg hover:bg-brand-button-bg-hover transition-colors"
                >
                    <PencilSquareIcon className="w-5 h-5" />
                    <span>編輯</span>
                </Link>
            </div>
            
            <div className="bg-brand-secondary p-6 rounded-2xl border-2 border-brand-accent/20 shadow-lg shadow-brand-accent/10 space-y-4">
                {entry.imageUrl && (
                    <img 
                        src={entry.imageUrl} 
                        alt={entry.drinkName} 
                        className="w-full h-48 object-cover rounded-lg border-2 border-brand-accent/10"
                    />
                )}
                
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-3xl font-bold text-brand-accent">{entry.drinkName}</h2>
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
    );
};

export default ViewJournalEntryPage;
