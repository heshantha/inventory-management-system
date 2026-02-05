import React, { useState, useEffect } from 'react';
import { useShop } from '../contexts/ShopContext';
import api from '../services/api';
import { formatCurrency } from '../utils/calculations';
import { downloadSalesReportPDF } from '../utils/pdfGenerator';
import {
    TrendingUp,
    DollarSign,
    ShoppingCart,
    Package,
    AlertTriangle,
    BarChart3,
    Calendar,
    Users,
    Download,
} from 'lucide-react';

const Reports = () => {
    const { shopId, currentShop } = useShop();
    const [sales, setSales] = useState([]);
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [activeTab, setActiveTab] = useState('pos'); // 'pos' or 'repairs'
    const [dateRange, setDateRange] = useState('month'); // today, week, month, all
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalSales: 0,
        totalDiscounts: 0,
        totalTax: 0,
        averageOrderValue: 0,
        topProducts: [],
        lowStockProducts: [],
        paymentMethodBreakdown: {},
    });

    useEffect(() => {
        if (shopId) {
            loadData();
        }
    }, [shopId]);

    useEffect(() => {
        if (sales.length > 0 || products.length > 0) {
            calculateReports();
        }
    }, [sales, products, dateRange, activeTab]);

    const loadData = async () => {
        const [salesData, productsData, customersData] = await Promise.all([
            api.sales.getAll(shopId),
            api.products.getAll(shopId),
            api.customers.getAll(shopId),
        ]);
        setSales(salesData);
        setProducts(productsData);
        setCustomers(customersData);
    };

    const isRepairSale = (sale) => {
        return sale.items && sale.items.some(item =>
            (item.name && item.name.toString().includes('Service Charges')) ||
            (item.name && item.name.toString().startsWith('Device:')) ||
            (item.name && item.name.toString().startsWith('Vehicle:')) ||
            (item.name === 'Labour / Technician Fee') ||
            (item.name === 'Labour Charges')
        );
    };

    const filterSalesByDateRange = () => {
        const now = new Date();
        return sales.filter(sale => {
            const saleDate = new Date(sale.created_at);

            switch (dateRange) {
                case 'today':
                    return saleDate.toDateString() === now.toDateString();
                case 'week':
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    return saleDate >= weekAgo;
                case 'month':
                    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    return saleDate >= monthAgo;
                case 'all':
                default:
                    return true;
            }
        });
    };

    const calculateReports = () => {
        let filteredSales = filterSalesByDateRange();

        // Filter by Tab
        if (activeTab === 'pos') {
            filteredSales = filteredSales.filter(sale => !isRepairSale(sale));
        } else {
            filteredSales = filteredSales.filter(sale => isRepairSale(sale));
        }

        // Revenue and sales stats
        const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total_amount, 0);
        const totalSales = filteredSales.length;
        const totalDiscounts = filteredSales.reduce((sum, sale) => sum + (sale.discount_amount || 0), 0);
        const totalTax = filteredSales.reduce((sum, sale) => sum + (sale.tax_amount || 0), 0);
        const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

        // Top products
        const productSales = {};
        filteredSales.forEach(sale => {
            if (sale.items) {
                sale.items.forEach(item => {
                    // For Repairs tab, we might want to aggregate Service Types?
                    // But current logic aggregates by product_id OR item name if product_id is null
                    // If product_id is null (Service Charges), we key by item name?

                    const key = item.product_id || item.name;

                    if (!productSales[key]) {
                        // Find product details from products array
                        const product = products.find(p => p.id === item.product_id);
                        productSales[key] = {
                            product_id: item.product_id,
                            name: product?.name || item.name || 'Unknown Item',
                            quantity: 0,
                            revenue: 0,
                        };
                    }
                    productSales[key].quantity += item.quantity;
                    // Ensure numbers
                    const itemTotal = parseFloat(item.total_price) || (parseFloat(item.quantity) * parseFloat(item.unit_price)) || 0;
                    productSales[key].revenue += itemTotal;
                });
            }
        });

        const topProducts = Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        // Low stock products (Only relevant for POS/Inventory context, but keeping global is fine)
        // Or should we filter? Low stock is store-wide. Keep it as is.
        const lowStockProducts = products
            .filter(p => p.stock_quantity <= p.min_stock_level)
            .sort((a, b) => a.stock_quantity - b.stock_quantity)
            .slice(0, 5);

        // Payment method breakdown
        const paymentMethodBreakdown = {};
        filteredSales.forEach(sale => {
            const method = sale.payment_method || 'unknown';
            if (!paymentMethodBreakdown[method]) {
                paymentMethodBreakdown[method] = { count: 0, total: 0 };
            }
            paymentMethodBreakdown[method].count += 1;
            paymentMethodBreakdown[method].total += sale.total_amount;
        });

        setStats({
            totalRevenue,
            totalSales,
            totalDiscounts,
            totalTax,
            averageOrderValue,
            topProducts,
            lowStockProducts,
            paymentMethodBreakdown,
        });
    };

    const getDateRangeLabel = () => {
        switch (dateRange) {
            case 'today': return 'Today';
            case 'week': return 'Last 7 Days';
            case 'month': return 'Last 30 Days';
            case 'all': return 'All Time';
            default: return 'Unknown';
        }
    };

    const handleDownloadPDF = () => {
        const reportData = {
            totalRevenue: stats.totalRevenue,
            totalSales: stats.totalSales,
            totalDiscounts: stats.totalDiscounts,
            totalTax: stats.totalTax,
            averageOrderValue: stats.averageOrderValue,
            topProducts: stats.topProducts,
            lowStockProducts: stats.lowStockProducts,
            paymentMethodBreakdown: stats.paymentMethodBreakdown,
        };

        const dateRangeLabel = getDateRangeLabel();
        const reportTitle = activeTab === 'repairs'
            ? (currentShop?.business_type === 'Service Center' || currentShop?.business_type === 'garage' ? 'Garage Report' : 'Repair Report')
            : 'Sales Report';

        downloadSalesReportPDF(reportData, dateRangeLabel, currentShop, reportTitle);
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Reports & Analytics</h1>
                <p className="text-gray-600 mt-1">Business insights and performance metrics</p>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6 max-w-md">
                <button
                    onClick={() => setActiveTab('pos')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'pos'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Sales Reports
                </button>
                <button
                    onClick={() => setActiveTab('repairs')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${activeTab === 'repairs'
                        ? 'bg-white text-primary-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    {currentShop?.business_type === 'Service Center' || currentShop?.business_type === 'garage'
                        ? 'Garage Reports'
                        : 'Repair Reports'}
                </button>
            </div>

            {/* Date Range Filter */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Calendar className="text-gray-400" size={20} />
                        <span className="text-sm font-medium text-gray-700">Date Range:</span>
                        <div className="flex space-x-2">
                            {['today', 'week', 'month', 'all'].map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setDateRange(range)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${dateRange === range
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {range === 'today' && 'Today'}
                                    {range === 'week' && 'Last 7 Days'}
                                    {range === 'month' && 'Last 30 Days'}
                                    {range === 'all' && 'All Time'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={handleDownloadPDF}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                    >
                        <Download size={18} />
                        <span>Download PDF</span>
                    </button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Total Revenue</span>
                        <div className="bg-green-100 p-2 rounded-lg">
                            <DollarSign className="text-green-600" size={20} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">
                        {formatCurrency(stats.totalRevenue)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{getDateRangeLabel()}</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Total Sales</span>
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <ShoppingCart className="text-blue-600" size={20} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{stats.totalSales}</p>
                    <p className="text-xs text-gray-500 mt-1">{getDateRangeLabel()}</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Avg Order Value</span>
                        <div className="bg-purple-100 p-2 rounded-lg">
                            <TrendingUp className="text-purple-600" size={20} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">
                        {formatCurrency(stats.averageOrderValue)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{getDateRangeLabel()}</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Total Discounts</span>
                        <div className="bg-red-100 p-2 rounded-lg">
                            <BarChart3 className="text-red-600" size={20} />
                        </div>
                    </div>
                    <p className="text-2xl font-bold text-gray-800">
                        {formatCurrency(stats.totalDiscounts)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{getDateRangeLabel()}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Top Products */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <TrendingUp className="mr-2 text-primary-600" size={20} />
                        Top Selling Products
                    </h3>
                    {stats.topProducts.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No sales data available</p>
                    ) : (
                        <div className="space-y-3">
                            {stats.topProducts.map((product, index) => (
                                <div key={product.product_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${index === 0 ? 'bg-yellow-500' :
                                            index === 1 ? 'bg-gray-400' :
                                                index === 2 ? 'bg-orange-600' :
                                                    'bg-gray-300'
                                            }`}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800">{product.name}</p>
                                            <p className="text-xs text-gray-500">{product.quantity} units sold</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-800">
                                            {formatCurrency(product.revenue)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Low Stock Alert */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                        <AlertTriangle className="mr-2 text-red-600" size={20} />
                        Low Stock Alert
                    </h3>
                    {stats.lowStockProducts.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">All products are adequately stocked</p>
                    ) : (
                        <div className="space-y-3">
                            {stats.lowStockProducts.map((product) => (
                                <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                                    <div className="flex items-center space-x-3">
                                        <Package className="text-red-600" size={20} />
                                        <div>
                                            <p className="font-medium text-gray-800">{product.name}</p>
                                            <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-red-600">{product.stock_quantity}</p>
                                        <p className="text-xs text-gray-500">Min: {product.min_stock_level}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Payment Methods Breakdown */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    <DollarSign className="mr-2 text-primary-600" size={20} />
                    Payment Methods Breakdown
                </h3>
                {Object.keys(stats.paymentMethodBreakdown).length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No payment data available</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Object.entries(stats.paymentMethodBreakdown).map(([method, data]) => (
                            <div key={method} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <p className="text-sm text-gray-600 uppercase font-medium mb-2">{method}</p>
                                <p className="text-xl font-bold text-gray-800">
                                    {formatCurrency(data.total)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">{data.count} transactions</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>


        </div>
    );
};

export default Reports;
