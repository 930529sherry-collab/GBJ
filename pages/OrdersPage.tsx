import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MOCK_ORDERS } from '../constants';
import { Order } from '../types';
import { TicketIcon } from '../components/icons/NavIcons';

const statusStyles = {
    Confirmed: { color: 'text-green-400', bgColor: 'bg-green-400/10', text: '已確認' },
    Completed: { color: 'text-blue-400', bgColor: 'bg-blue-400/10', text: '已完成' },
    Cancelled: { color: 'text-red-400', bgColor: 'bg-red-400/10', text: '已取消' },
};

const OrderCard: React.FC<{ order: Order }> = ({ order }) => {
    const status = statusStyles[order.status];

    return (
        <div className="bg-brand-secondary p-5 rounded-xl border-2 border-brand-accent/20 shadow-lg shadow-brand-accent/10 space-y-3">
            <div className="flex justify-between items-start">
                <h3 className="text-xl font-bold text-brand-light">{order.storeName}</h3>
                <span className={`text-sm font-bold px-3 py-1 rounded-full ${status.bgColor} ${status.color}`}>
                    {status.text}
                </span>
            </div>
            <div className="text-brand-muted space-y-1 text-sm">
                <p>訂單編號: {order.id}</p>
                <p>日期: {order.date}</p>
                <p>時間: {order.time}</p>
                <p>人數: {order.people} 人</p>
            </div>
        </div>
    );
};

const OrdersPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Simulate data fetching
        setTimeout(() => {
            const savedOrdersString = localStorage.getItem('orders');
            if (savedOrdersString) {
                setOrders(JSON.parse(savedOrdersString));
            } else {
                // If nothing in localStorage, initialize with mock data and save it.
                setOrders(MOCK_ORDERS);
                localStorage.setItem('orders', JSON.stringify(MOCK_ORDERS));
            }
            setLoading(false);
        }, 500);
    }, []);

    if (loading) {
        return <div className="text-center p-10 text-brand-accent">正在讀取訂單記錄...</div>;
    }
    
    if (orders.length === 0) {
         return (
            <div className="text-center p-10 flex flex-col items-center justify-center h-full animate-fade-in">
                <div className="bg-brand-secondary p-8 rounded-2xl border-2 border-brand-accent/20 shadow-xl shadow-brand-accent/10 w-full max-w-sm">
                    <div className="mx-auto w-fit p-4 bg-brand-primary rounded-full border-2 border-brand-accent/20">
                       <TicketIcon />
                    </div>
                    <h2 className="text-xl font-bold text-brand-light mt-4 mb-2">無訂單紀錄</h2>
                    <p className="text-brand-muted mb-6">您目前沒有任何訂單，快去預約一個美好的夜晚吧！</p>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-brand-accent text-brand-primary font-bold py-2 px-6 rounded-lg hover:bg-opacity-80 transition-colors"
                    >
                        前往探索
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {orders.map(order => (
                <OrderCard key={order.id} order={order} />
            ))}
        </div>
    );
};

export default OrdersPage;