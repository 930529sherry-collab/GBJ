
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Deal, Store } from '../types';
import { getStores, getDeals } from '../utils/api'; 

const DealCard: React.FC<{ deal: Deal }> = ({ deal }) => (
    <div className="bg-brand-secondary p-5 rounded-xl border-2 border-brand-accent/20 shadow-lg shadow-brand-accent/10 space-y-2 transform transition-transform hover:scale-105 hover:border-brand-accent/50">
        <p className="text-sm font-semibold text-brand-muted">{deal.storeName}</p>
        <h3 className="text-xl font-bold text-brand-accent">{deal.title}</h3>
        <p className="text-brand-light leading-relaxed">{deal.description}</p>
        <p className="text-xs text-brand-muted pt-2">到期日：{deal.expiry}</p>
    </div>
);

const DealsPage: React.FC = () => {
    const [deals, setDeals] = useState<Deal[]>([]);
    const [stores, setStores] = useState<Store[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDealsAndStores = async () => {
            setLoading(true);
            try {
                const taipeiStores = await getStores();
                setStores(taipeiStores);

                const allDeals = await getDeals();
                const taipeiStoreNames = taipeiStores.map(store => store.name);
                const taipeiDeals = allDeals.filter(deal => taipeiStoreNames.includes(deal.storeName));
                
                setDeals(taipeiDeals);
            } catch (error) {
                console.error("Failed to load data for Deals page:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDealsAndStores();
    }, []);

    const handleDealClick = (deal: Deal) => {
        const store = stores.find(s => s.name === deal.storeName);
        if (store) {
            navigate(`/store/${store.id}`);
        }
    };

    if (loading) {
        return <div className="text-center p-10 text-brand-accent">正在搜刮最新優惠...</div>;
    }

    return (
        <div className="space-y-4">
            {deals.map(deal => (
                <div 
                    key={deal.id} 
                    onClick={() => handleDealClick(deal)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleDealClick(deal)}
                    className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-accent rounded-xl"
                >
                    <DealCard deal={deal} />
                </div>
            ))}
        </div>
    );
};

export default DealsPage;
