import React, { useState, useEffect } from 'react';
import { useShop } from '../contexts/ShopContext';
import api from '../services/api';
import { formatCurrency } from '../utils/calculations';
import Modal from '../components/common/Modal';
import Invoice from '../components/Invoice/Invoice';
import { Search, Eye, Calendar, DollarSign, ShoppingBag, Printer, Filter } from 'lucide-react';

const Sales = () => {
    const { shopId } = useShop();
    const [sales, setSales] = useState([]);
    const [filteredSales, setFilteredSales] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showInvoice, setShowInvoice] = useState(false);
    const [stats, setStats] = useState({
        totalSales: 0,
        totalTransactions: 0,
        averageTransaction: 0,
    });

    useEffect(() => {
        if (shopId) {
            loadSales();
        }
    }, [shopId]);

    useEffect(() => {
        filterSales();
    }, [sales, searchTerm, dateFilter]);

    const loadSales = async () => {
        const data = await api.sales.getAll(shopId);
        // Sort by date (newest first)
        const sortedData = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setSales(sortedData);
        calculateStats(sortedData);
    };

    const calculateStats = (salesData) => {
        const totalSales = salesData.reduce((sum, sale) => sum + sale.total_amount, 0);
        const totalTransactions = salesData.length;
        const averageTransaction = totalTransactions > 0 ? totalSales / totalTransactions : 0;

        setStats({
            totalSales,
            totalTransactions,
            averageTransaction,
        });
    };

    const filterSales = () => {
        let filtered = [...sales];

        // Date filter
        if (dateFilter !== 'all') {
            const now = new Date();
            filtered = filtered.filter(sale => {
                const saleDate = new Date(sale.created_at);

                switch (dateFilter) {
                    case 'today':
                        return saleDate.toDateString() === now.toDateString();
                    case 'week':
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        return saleDate >= weekAgo;
                    case 'month':
                        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        return saleDate >= monthAgo;
                    default:
                        return true;
                }
            });
        }

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(sale =>
                sale.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                sale.payment_method.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredSales(filtered);
        calculateStats(filtered);
    };

    const viewInvoice = (sale) => {
        setSelectedInvoice(sale);
        setShowInvoice(true);
    };

    const getPaymentMethodBadgeColor = (method) => {
        const colors = {
            cash: 'bg-green-100 text-green-800',
            card: 'bg-blue-100 text-blue-800',
            upi: 'bg-purple-100 text-purple-800',
            other: 'bg-gray-100 text-gray-800',
        };
        return colors[method] || colors.other;
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Sales History</h1>
                <p className="text-gray-600 mt-1">View and manage all sales transactions</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Sales</p>
                            <p className="text-2xl font-bold text-gray-800">
                                {formatCurrency(stats.totalSales)}
                            </p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-full">
                            <DollarSign className="text-green-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.totalTransactions}</p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-full">
                            <ShoppingBag className="text-blue-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Average Transaction</p>
                            <p className="text-2xl font-bold text-gray-800">
                                {formatCurrency(stats.averageTransaction)}
                            </p>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-full">
                            <Calendar className="text-purple-600" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by invoice number or payment method..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    {/* Date Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="all">All Time</option>
                            <option value="today">Today</option>
                            <option value="week">Last 7 Days</option>
                            <option value="month">Last 30 Days</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Sales Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Invoice
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date & Time
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Items
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Payment
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredSales.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        {sales.length === 0
                                            ? 'No sales yet. Start making sales from the Point of Sale page.'
                                            : 'No sales match your filters.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredSales.map((sale) => (
                                    <tr key={sale.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">{sale.invoice_number}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {new Date(sale.created_at).toLocaleDateString()}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(sale.created_at).toLocaleTimeString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">
                                                {sale.items?.length || 0} item(s)
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full uppercase ${getPaymentMethodBadgeColor(sale.payment_method)}`}>
                                                {sale.payment_method}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-gray-900">
                                                {formatCurrency(sale.total_amount)}
                                            </div>
                                            {sale.discount_amount > 0 && (
                                                <div className="text-xs text-red-600">
                                                    Discount: {formatCurrency(sale.discount_amount)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => viewInvoice(sale)}
                                                className="text-primary-600 hover:text-primary-900 inline-flex items-center"
                                            >
                                                <Eye size={18} className="mr-1" />
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Invoice Modal */}
            {showInvoice && selectedInvoice && (
                <Modal
                    isOpen={showInvoice}
                    onClose={() => setShowInvoice(false)}
                    title="Invoice Details"
                    size="xl"
                >
                    <Invoice invoice={selectedInvoice} />
                    <div className="flex justify-center space-x-3 mt-6 pt-6 border-t border-gray-200 no-print">
                        <button
                            onClick={() => window.print()}
                            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 inline-flex items-center"
                        >
                            <Printer size={18} className="mr-2" />
                            Print Invoice
                        </button>
                        <button
                            onClick={() => setShowInvoice(false)}
                            className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300"
                        >
                            Close
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Sales;
