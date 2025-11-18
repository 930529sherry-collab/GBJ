import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_DEALS, MOCK_STORES } from '../constants';
import { Deal } from '../types';

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
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        setTimeout(() => {
            // Get the names of stores in Taipei
            const taipeiStoreNames = MOCK_STORES
                .filter(store => store.address.includes('台北市'))
                .map(store => store.name);
            
            // Filter deals based on store name
            const taipeiDeals = MOCK_DEALS.filter(deal => taipeiStoreNames.includes(deal.storeName));

            setDeals(taipeiDeals);
            setLoading(false);
        }, 500);
    }, []);

    const handleDealClick = (deal: Deal) => {
        const store = MOCK_STORES.find(s => s.name === deal.storeName);
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