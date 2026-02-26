import React, { useEffect, useMemo, useState } from 'react';
import { useShop } from '../contexts/ShopContext';
import api from '../services/api';
import { AlertTriangle, Package, ChevronUp, ChevronDown } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

const LowStockItems = () => {
    const { shopId } = useShop();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [nameSortOrder, setNameSortOrder] = useState('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        if (!shopId) return;

        const loadProducts = async () => {
            setLoading(true);
            try {
                const data = await api.products.getAll(shopId);
                setProducts(data);
            } finally {
                setLoading(false);
            }
        };

        loadProducts();
    }, [shopId]);

    const lowStockProducts = useMemo(
        () =>
            products
                .filter((product) => Number(product.stock_quantity) <= Number(product.min_stock_level))
                .sort((a, b) => {
                    const comparison = (a?.name || '').localeCompare(b?.name || '', undefined, { sensitivity: 'base' });
                    return nameSortOrder === 'asc' ? comparison : -comparison;
                }),
        [products, nameSortOrder]
    );
    const totalPages = Math.max(1, Math.ceil(lowStockProducts.length / ITEMS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const paginatedLowStockProducts = lowStockProducts.slice(
        (safePage - 1) * ITEMS_PER_PAGE,
        safePage * ITEMS_PER_PAGE
    );

    return (
        <div className="p-3 md:p-6">
            <div className="mb-6">
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800">Low Stock Items</h1>
                <p className="text-sm md:text-base text-gray-600 mt-1">
                    Products that reached or dropped below minimum stock level
                </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setNameSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                                            setCurrentPage(1);
                                        }}
                                        className="inline-flex items-center gap-1 hover:text-gray-700 transition-colors"
                                        title={nameSortOrder === 'asc' ? 'Sort Z-A' : 'Sort A-Z'}
                                    >
                                        <span>Product</span>
                                        {nameSortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Min Stock</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Selling Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                        Loading low stock items...
                                    </td>
                                </tr>
                            ) : lowStockProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                        No low stock products found.
                                    </td>
                                </tr>
                            ) : (
                                paginatedLowStockProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Package className="text-gray-400 mr-3" size={18} />
                                                <span className="text-sm font-medium text-gray-900">{product.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{product.sku || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{product.category_name || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-red-600">
                                            {product.stock_quantity}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                                            {product.min_stock_level}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                                            {formatCurrency(product.selling_price || 0)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${Number(product.stock_quantity) === 0
                                                    ? 'bg-red-100 text-red-700'
                                                    : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                <AlertTriangle size={12} className="mr-1" />
                                                {Number(product.stock_quantity) === 0 ? 'Out of stock' : 'Low stock'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {lowStockProducts.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between mt-4 px-1">
                    <p className="text-sm text-gray-600">
                        Showing {(safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, lowStockProducts.length)} of {lowStockProducts.length} items
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={safePage === 1}
                            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-100 transition-colors"
                        >
                            ← Prev
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                            .filter((page) => page === 1 || page === totalPages || Math.abs(page - safePage) <= 1)
                            .reduce((acc, page, idx, arr) => {
                                if (idx > 0 && page - arr[idx - 1] > 1) acc.push('...');
                                acc.push(page);
                                return acc;
                            }, [])
                            .map((item, idx) =>
                                item === '...' ? (
                                    <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">…</span>
                                ) : (
                                    <button
                                        key={item}
                                        onClick={() => setCurrentPage(item)}
                                        className={`px-3 py-1.5 text-sm border rounded-lg transition-colors ${safePage === item
                                                ? 'bg-primary-600 text-white border-primary-600'
                                                : 'border-gray-300 hover:bg-gray-100'
                                            }`}
                                    >
                                        {item}
                                    </button>
                                )
                            )}
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={safePage === totalPages}
                            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-100 transition-colors"
                        >
                            Next →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LowStockItems;
