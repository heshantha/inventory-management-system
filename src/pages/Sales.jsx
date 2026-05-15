import React, { useState, useEffect, useRef } from 'react';
import { useShop } from '../contexts/ShopContext';
import api from '../services/api';
import { formatCurrency } from '../utils/calculations';

import { generateInvoicePDFBlob } from '../utils/pdfGenerator';
import { Search, Eye, Calendar, DollarSign, ShoppingBag, ChevronLeft, ChevronRight, ChevronDown, X, Download } from 'lucide-react';

const Sales = () => {
    const { shopId, currentShop } = useShop();
    const pickerRef = useRef(null);
    const [sales, setSales] = useState([]);
    const [filteredSales, setFilteredSales] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showPicker, setShowPicker] = useState(false);
    const [activePreset, setActivePreset] = useState('last30');

    // Bulk selection state
    const [selectedInvoices, setSelectedInvoices] = useState(new Set());
    const [isDownloading, setIsDownloading] = useState(false);

    // Helper: midnight of a date
    const startOf = (d) => { const r = new Date(d); r.setHours(0,0,0,0); return r; };
    const endOf   = (d) => { const r = new Date(d); r.setHours(23,59,59,999); return r; };
    const toISO   = (d) => d.toISOString().slice(0,10); // yyyy-mm-dd

    const today = new Date();
    const [startDate, setStartDate] = useState(toISO(new Date(today.getTime() - 29*24*60*60*1000)));
    const [endDate,   setEndDate]   = useState(toISO(today));

    const presets = [
        { key: 'today',   label: 'Today',       days: 0 },
        { key: 'yesterday', label: 'Yesterday',  days: 1, yesterday: true },
        { key: 'last3',   label: 'Last 3 Days',  days: 2 },
        { key: 'last7',   label: 'Last 7 Days',  days: 6 },
        { key: 'last30',  label: 'Last 30 Days', days: 29 },
    ];

    const applyPreset = (preset) => {
        const now = new Date();
        if (preset.yesterday) {
            const yest = new Date(now); yest.setDate(yest.getDate() - 1);
            setStartDate(toISO(yest));
            setEndDate(toISO(yest));
        } else {
            const from = new Date(now.getTime() - preset.days * 24*60*60*1000);
            setStartDate(toISO(from));
            setEndDate(toISO(now));
        }
        setActivePreset(preset.key);
    };

    // Enforce max 30-day range when custom dates change
    const handleStartDateChange = (val) => {
        setActivePreset('custom');
        setStartDate(val);
        const s = new Date(val);
        const e = new Date(endDate);
        const maxEnd = new Date(s.getTime() + 29*24*60*60*1000);
        if (e > maxEnd) setEndDate(toISO(maxEnd));
        if (e < s) setEndDate(val);
    };

    const handleEndDateChange = (val) => {
        setActivePreset('custom');
        const s = new Date(startDate);
        const e = new Date(val);
        if (e < s) return; // can't end before start
        const maxEnd = new Date(s.getTime() + 29*24*60*60*1000);
        setEndDate(e > maxEnd ? toISO(maxEnd) : val);
    };

    const pickerLabel = () => {
        const p = presets.find(p => p.key === activePreset);
        if (p) return p.label;
        return `${startDate}  →  ${endDate}`;
    };



    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [stats, setStats] = useState({
        totalSales: 0,
        totalTransactions: 0,
        averageTransaction: 0,
    });

    // Close picker on outside click
    useEffect(() => {
        const handler = (e) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowPicker(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => { if (shopId) loadSales(); }, [shopId]);
    useEffect(() => { filterSales(); }, [sales, searchTerm, startDate, endDate]);

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

        // Date range filter
        const s = startOf(new Date(startDate));
        const e = endOf(new Date(endDate));
        filtered = filtered.filter(sale => {
            const d = new Date(sale.created_at);
            return d >= s && d <= e;
        });

        // Search filter
        if (searchTerm) {
            filtered = filtered.filter(sale =>
                sale.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                sale.payment_method.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredSales(filtered);
        calculateStats(filtered);
        setCurrentPage(1);
    };

    const handleDownloadInvoice = async (sale) => {
        try {
            const pdfBlob = generateInvoicePDFBlob(sale, currentShop);
            const fileName = `Invoice_${sale.invoice_number || 'invoice'}.pdf`;
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        } catch (err) {
            console.error('Download failed', err);
            alert('Error downloading invoice.');
        }
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

    const currentItems = filteredSales.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleSelectAll = () => {
        if (selectedInvoices.size === currentItems.length && currentItems.length > 0) {
            setSelectedInvoices(new Set());
        } else {
            setSelectedInvoices(new Set(currentItems.map(s => s.id)));
        }
    };

    const handleSelectInvoice = (id) => {
        const next = new Set(selectedInvoices);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedInvoices(next);
    };

    const handleBulkDownload = async () => {
        if (selectedInvoices.size === 0) return;
        setIsDownloading(true);
        try {
            const invoicesToDownload = sales.filter(s => selectedInvoices.has(s.id));
            for (const inv of invoicesToDownload) {
                const pdfBlob = generateInvoicePDFBlob(inv, currentShop);
                const fileName = `Invoice_${inv.invoice_number || 'invoice'}.pdf`;
                const url = URL.createObjectURL(pdfBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                }, 100);
                
                // Slight delay to prevent the browser from blocking sequential downloads
                await new Promise(r => setTimeout(r, 600));
            }
            setSelectedInvoices(new Set());
        } catch (err) {
            console.error('Bulk download failed', err);
            alert('Error downloading invoices.');
        } finally {
            setIsDownloading(false);
        }
    };

    // Reset selection when page changes
    useEffect(() => {
        setSelectedInvoices(new Set());
    }, [currentPage, filteredSales]);

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

                    {/* Date Range Picker */}
                    <div className="relative" ref={pickerRef}>
                        <button
                            onClick={() => setShowPicker(v => !v)}
                            className="w-full flex items-center justify-between pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm text-gray-700"
                        >
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <span className="font-medium">{pickerLabel()}</span>
                            <ChevronDown size={16} className="text-gray-400" />
                        </button>

                        {showPicker && (
                            <div className="absolute right-0 z-30 mt-1 w-80 bg-white border border-gray-200 rounded-xl shadow-xl p-4">
                                {/* Custom date inputs */}
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Select Date Range <span className="text-gray-400 normal-case font-normal">(max 30 days)</span></p>
                                <div className="flex gap-2 items-center">
                                    <div className="flex-1">
                                        <label className="block text-xs text-gray-500 mb-1">From</label>
                                        <input
                                            type="date"
                                            value={startDate}
                                            max={toISO(today)}
                                            onChange={(e) => handleStartDateChange(e.target.value)}
                                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                    <div className="text-gray-400 mt-4">→</div>
                                    <div className="flex-1">
                                        <label className="block text-xs text-gray-500 mb-1">To</label>
                                        <input
                                            type="date"
                                            value={endDate}
                                            min={startDate}
                                            max={toISO(new Date(Math.min(new Date(startDate).getTime() + 29*24*60*60*1000, today.getTime())))} 
                                            onChange={(e) => handleEndDateChange(e.target.value)}
                                            className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowPicker(false)}
                                    className="mt-3 w-full py-1.5 text-xs bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold"
                                >
                                    Apply
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Bulk Actions Toolbar */}
            {selectedInvoices.size > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex justify-between items-center transition-all shadow-sm">
                    <span className="text-blue-800 font-medium ml-2">{selectedInvoices.size} invoice(s) selected</span>
                    <button
                        onClick={handleBulkDownload}
                        disabled={isDownloading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
                    >
                        <Download size={16} />
                        {isDownloading ? 'Downloading...' : 'Download Selected'}
                    </button>
                </div>
            )}

            {/* Sales Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left w-12">
                                    <input 
                                        type="checkbox"
                                        checked={currentItems.length > 0 && selectedInvoices.size === currentItems.length}
                                        onChange={handleSelectAll}
                                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                                    />
                                </th>
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
                                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                        {sales.length === 0
                                            ? 'No sales yet. Start making sales from the Point of Sale page.'
                                            : 'No sales match your filters.'}
                                    </td>
                                </tr>
                            ) : (
                                currentItems.map((sale) => (
                                        <tr key={sale.id} className={`hover:bg-gray-50 transition-colors ${selectedInvoices.has(sale.id) ? 'bg-blue-50/40' : ''}`}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <input 
                                                    type="checkbox"
                                                    checked={selectedInvoices.has(sale.id)}
                                                    onChange={() => handleSelectInvoice(sale.id)}
                                                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                                                />
                                            </td>
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
                                                    onClick={() => handleDownloadInvoice(sale)}
                                                    className="text-blue-600 hover:text-blue-900 inline-flex items-center"
                                                >
                                                    <Download size={18} className="mr-1" />
                                                    Download
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {filteredSales.length > itemsPerPage && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                        <div className="text-sm text-gray-500">
                            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredSales.length)}</span> of <span className="font-medium">{filteredSales.length}</span> results
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className={`px-3 py-1 rounded-md border text-sm font-medium ${currentPage === 1 ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                            >
                                <ChevronLeft size={16} />
                            </button>

                            <div className="flex items-center space-x-1">
                                <span className="px-4 py-2 text-sm text-gray-700">
                                    Page {currentPage} of {Math.ceil(filteredSales.length / itemsPerPage)}
                                </span>
                            </div>

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredSales.length / itemsPerPage)))}
                                disabled={currentPage === Math.ceil(filteredSales.length / itemsPerPage)}
                                className={`px-3 py-1 rounded-md border text-sm font-medium ${currentPage === Math.ceil(filteredSales.length / itemsPerPage) ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

export default Sales;
