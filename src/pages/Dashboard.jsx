import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useShop } from '../contexts/ShopContext';
import api from '../services/api';
import { formatCurrency } from '../utils/calculations';
import {
    DollarSign,
    ShoppingCart,
    Package,
    Users,
    AlertTriangle,
    TrendingUp,
} from 'lucide-react';

const Dashboard = () => {
    const { user } = useAuth();
    const { shopId } = useShop();
    const [stats, setStats] = useState(null);
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [recentSales, setRecentSales] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (shopId) {
            loadDashboardData();
        }
    }, [shopId]); // Reload whenever shopId changes or component mounts

    // Also reload data every time the component is rendered (e.g., after completing a sale)
    useEffect(() => {
        if (shopId) {
            loadDashboardData();
        }
    }, []); // Runs on every mount

    const loadDashboardData = async () => {
        try {
            const [statsData, lowStock, todaySales] = await Promise.all([
                api.dashboard.getStats(shopId),
                api.products.getLowStock(shopId),
                api.sales.getToday(shopId),
            ]);

            setStats(statsData);
            setLowStockProducts(lowStock.slice(0, 5));
            setRecentSales(todaySales.slice(0, 10));
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    const statCards = [
        {
            title: "Today's Sales",
            value: formatCurrency(stats?.today_sales || 0),
            icon: DollarSign,
            color: 'bg-green-500',
            textColor: 'text-green-600',
        },
        {
            title: "Today's Transactions",
            value: stats?.today_transactions || 0,
            icon: ShoppingCart,
            color: 'bg-blue-500',
            textColor: 'text-blue-600',
        },
        {
            title: 'Total Products',
            value: stats?.total_products || 0,
            icon: Package,
            color: 'bg-purple-500',
            textColor: 'text-purple-600',
        },
        {
            title: 'Total Customers',
            value: stats?.total_customers || 0,
            icon: Users,
            color: 'bg-indigo-500',
            textColor: 'text-indigo-600',
        },
    ];

    return (
        <div className="p-6 space-y-6">
            {/* Welcome Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-800">
                    Welcome back, {user?.full_name}!
                </h1>
                <p className="text-gray-600 mt-1">Here's what's happening in your store today.</p>
            </div>

            {/* Stats Grid*/}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                                <p className={`text-2xl font-bold ${stat.textColor} mt-2`}>
                                    {stat.value}
                                </p>
                            </div>
                            <div className={`${stat.color} p-3 rounded-lg`}>
                                <stat.icon className="text-white" size={24} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Low Stock Alert */}
                {stats?.low_stock_count > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center space-x-2 mb-4">
                            <AlertTriangle className="text-red-500" size={24} />
                            <h2 className="text-xl font-semibold text-gray-800">
                                Low Stock Alert
                            </h2>
                            <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded-full">
                                {stats.low_stock_count} items
                            </span>
                        </div>

                        <div className="space-y-3">
                            {lowStockProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"
                                >
                                    <div>
                                        <p className="font-medium text-gray-800">{product.name}</p>
                                        <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-600">Stock</p>
                                        <p className="font-bold text-red-600">{product.stock_quantity}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Sales */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center space-x-2 mb-4">
                        <TrendingUp className="text-primary-600" size={24} />
                        <h2 className="text-xl font-semibold text-gray-800">
                            Recent Sales Today
                        </h2>
                    </div>

                    {recentSales.length > 0 ? (
                        <div className="space-y-3">
                            {recentSales.map((sale) => (
                                <div
                                    key={sale.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100"
                                >
                                    <div>
                                        <p className="font-medium text-gray-800">{sale.invoice_number}</p>
                                        <p className="text-sm text-gray-600">
                                            {sale.customer_name || 'Walk-in Customer'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-600">
                                            {formatCurrency(sale.total_amount)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(sale.created_at).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-gray-500">
                            <ShoppingCart size={48} className="mx-auto mb-2 opacity-50" />
                            <p>No sales today yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
