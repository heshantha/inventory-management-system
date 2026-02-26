import React, { useState, useEffect, useCallback } from 'react';
import { useShop } from '../contexts/ShopContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import { Plus, Edit, Trash2, Package, AlertTriangle, XCircle, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';
import { canAddItem, getUsageInfo } from '../utils/packageLimits';

const Products = () => {
    const { shopId, currentShop } = useShop();
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showDamageModal, setShowDamageModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        sku: '',
        name: '',
        category_id: '',
        description: '',
        cost_price: '',
        selling_price: '',
        stock_quantity: 0,
        min_stock_level: 10,
    });
    const [damageFormData, setDamageFormData] = useState({
        quantity: 1,
        reason: 'Broken',
        notes: ''
    });
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [searchQuery, setSearchQuery] = useState('');
    const [nameSortOrder, setNameSortOrder] = useState('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const loadData = useCallback(async () => {
        const [productsData, categoriesData] = await Promise.all([
            api.products.getAll(shopId),
            api.categories.getAll(shopId),
        ]);
        setProducts(productsData);
        setCategories(
            [...categoriesData].sort((a, b) =>
                (a?.name || '').localeCompare(b?.name || '', undefined, { sensitivity: 'base' })
            )
        );
    }, [shopId]);

    useEffect(() => {
        if (shopId) {
            const timerId = setTimeout(() => {
                loadData();
            }, 0);
            return () => clearTimeout(timerId);
        }
    }, [shopId, loadData]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check for duplicate SKU
        const skuExists = products.some(p =>
            p.sku.toLowerCase() === formData.sku.toLowerCase() &&
            (!editingProduct || p.id !== editingProduct.id)
        );

        if (skuExists) {
            setToast({ show: true, message: `SKU "${formData.sku}" already exists. Please use a unique SKU.`, type: 'error' });
            return;
        }

        // Convert empty strings to null for UUID fields
        const sanitizedData = {
            ...formData,
            category_id: formData.category_id || null,
        };

        const dataToSubmit = {
            ...sanitizedData,
            shop_id: shopId
        };

        const result = editingProduct
            ? await api.products.update(editingProduct.id, dataToSubmit)
            : await api.products.create(dataToSubmit);

        if (result.success) {
            await loadData();
            setShowModal(false);
            resetForm();
            setToast({
                show: true,
                message: editingProduct ? 'Product updated successfully!' : 'Product created successfully!',
                type: 'success'
            });
        } else {
            setToast({ show: true, message: 'Error: ' + result.message, type: 'error' });
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            sku: product.sku,
            name: product.name,
            category_id: product.category_id || '',
            description: product.description || '',
            cost_price: product.cost_price,
            selling_price: product.selling_price,
            stock_quantity: product.stock_quantity,
            min_stock_level: product.min_stock_level,
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            await api.products.delete(id);
            await loadData();
        }
    };

    const resetForm = () => {
        setFormData({
            sku: '',
            name: '',
            category_id: '',
            description: '',
            cost_price: '',
            selling_price: '',
            stock_quantity: 0,
            min_stock_level: 10,
        });
        setEditingProduct(null);
    };

    const handleMarkAsDamaged = (product) => {
        if (product.stock_quantity === 0) {
            setToast({ show: true, message: 'This product has no stock available to mark as damaged.', type: 'error' });
            return;
        }
        setSelectedProduct(product);
        setDamageFormData({
            quantity: 1,
            reason: 'Broken',
            notes: ''
        });
        setShowDamageModal(true);
    };

    const handleDamageSubmit = async (e) => {
        e.preventDefault();

        if (damageFormData.quantity > selectedProduct.stock_quantity) {
            setToast({
                show: true,
                message: `Cannot damage ${damageFormData.quantity} units. Only ${selectedProduct.stock_quantity} units available.`,
                type: 'error'
            });
            return;
        }

        const result = await api.damages.create({
            shop_id: shopId,
            product_id: selectedProduct.id,
            quantity: parseInt(damageFormData.quantity),
            reason: damageFormData.reason,
            notes: damageFormData.notes,
            recorded_by: user?.id
        });

        if (result.success) {
            await loadData();
            setShowDamageModal(false);
            setSelectedProduct(null);
            setToast({ show: true, message: 'Damage recorded successfully. Stock has been updated.', type: 'success' });
        } else {
            setToast({ show: true, message: 'Error: ' + result.message, type: 'error' });
        }
    };

    const filteredProducts = products
        .filter((p) => {
            const q = searchQuery.toLowerCase().trim();
            if (!q) return true;
            return (
                p.name.toLowerCase().includes(q) ||
                (p.sku && p.sku.toLowerCase().includes(q))
            );
        })
        .sort((a, b) => {
            const comparison = (a?.name || '').localeCompare(b?.name || '', undefined, { sensitivity: 'base' });
            return nameSortOrder === 'asc' ? comparison : -comparison;
        });

    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const paginatedProducts = filteredProducts.slice(
        (safePage - 1) * ITEMS_PER_PAGE,
        safePage * ITEMS_PER_PAGE
    );

    return (
        <div className="p-3 md:p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0 mb-6">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800">Products Management</h1>
                        {currentShop && (() => {
                            const usageInfo = getUsageInfo(products.length, currentShop.package_type, 'products');
                            return !usageInfo.isUnlimited && (
                                <span className={`text-xs md:text-sm px-2 md:px-3 py-1 rounded-full ${usageInfo.percentage >= 100 ? 'bg-red-100 text-red-800' :
                                    usageInfo.percentage >= 80 ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-blue-100 text-blue-800'
                                    }`}>
                                    {usageInfo.current} / {usageInfo.limit}
                                </span>
                            );
                        })()}
                    </div>
                    <p className="text-sm md:text-base text-gray-600 mt-1">Manage your inventory products</p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => {
                        if (currentShop && !canAddItem(products.length, currentShop.package_type, 'products')) {
                            const usageInfo = getUsageInfo(products.length, currentShop.package_type, 'products');
                            setToast({
                                show: true,
                                message: `Product limit reached (${usageInfo.limit}). Please upgrade your package.`,
                                type: 'error'
                            });
                            return;
                        }
                        resetForm();
                        setShowModal(true);
                    }}
                    className="w-full md:w-auto flex items-center justify-center"
                >
                    <Plus size={20} className="mr-2" />
                    <span>Add Product</span>
                </Button>
            </div>

            {/* Search Bar */}
            <div className="mb-4">
                <div className="relative max-w-sm w-full">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by name or SKU..."
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            title="Clear search"
                        >
                            <XCircle size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Products Table */}
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    SKU
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Category
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Price
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Stock
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        {searchQuery
                                            ? `No products found matching "${searchQuery}".`
                                            : 'No products found. Click "Add Product" to create one.'}
                                    </td>
                                </tr>
                            ) : (
                                paginatedProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Package className="text-gray-400 mr-3" size={20} />
                                                <div>
                                                    <div className="font-medium text-gray-900">{product.name}</div>
                                                    {product.description && (
                                                        <div className="text-sm text-gray-500 truncate max-w-xs">
                                                            {product.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {product.sku}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {product.category_name || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-gray-900">
                                                {formatCurrency(product.selling_price)}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Cost: {formatCurrency(product.cost_price)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span className={`font-semibold ${product.stock_quantity <= product.min_stock_level ? 'text-red-600' : 'text-gray-900'}`}>
                                                    {product.stock_quantity}
                                                </span>
                                                {product.stock_quantity <= product.min_stock_level && (
                                                    <AlertTriangle className="ml-2 text-red-500" size={16} />
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button
                                                onClick={() => handleEdit(product)}
                                                className="text-primary-600 hover:text-primary-900"
                                                title="Edit Product"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleMarkAsDamaged(product)}
                                                className="text-orange-600 hover:text-orange-900"
                                                title="Mark as Damaged"
                                                disabled={product.stock_quantity === 0}
                                            >
                                                <XCircle size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                className="text-red-600 hover:text-red-900"
                                                title="Delete Product"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {filteredProducts.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-between mt-4 px-1">
                    <p className="text-sm text-gray-600">
                        Showing {(safePage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(safePage * ITEMS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length} products
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

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    resetForm();
                }}
                title={editingProduct ? 'Edit Product' : 'Add New Product'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Product Name *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                SKU *
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                disabled={!!editingProduct}
                            />
                        </div>
                    </div>

                    <div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Category
                            </label>
                            <select
                                value={formData.category_id}
                                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="">Select Category</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cost Price *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={formData.cost_price}
                                onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Selling Price *
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                value={formData.selling_price}
                                onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Initial Stock Quantity
                            </label>
                            <input
                                type="number"
                                value={formData.stock_quantity}
                                onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Minimum Stock Level
                            </label>
                            <input
                                type="number"
                                value={formData.min_stock_level}
                                onChange={(e) => setFormData({ ...formData, min_stock_level: parseInt(e.target.value) || 10 })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                setShowModal(false);
                                resetForm();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary">
                            {editingProduct ? 'Update Product' : 'Add Product'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Mark as Damaged Modal */}
            <Modal
                isOpen={showDamageModal}
                onClose={() => {
                    setShowDamageModal(false);
                    setSelectedProduct(null);
                }}
                title={`Mark as Damaged - ${selectedProduct?.name || ''}`}
            >
                <form onSubmit={handleDamageSubmit} className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                        <div className="flex items-center">
                            <AlertTriangle className="text-yellow-600 mr-2" size={20} />
                            <div>
                                <p className="text-sm font-medium text-yellow-800">Available Stock: {selectedProduct?.stock_quantity || 0} units</p>
                                <p className="text-xs text-yellow-700 mt-1">Recording damage will reduce the stock quantity.</p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity to Damage *
                        </label>
                        <input
                            type="number"
                            min="1"
                            max={selectedProduct?.stock_quantity || 1}
                            required
                            value={damageFormData.quantity}
                            onChange={(e) => setDamageFormData({ ...damageFormData, quantity: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reason *
                        </label>
                        <select
                            required
                            value={damageFormData.reason}
                            onChange={(e) => setDamageFormData({ ...damageFormData, reason: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="Broken">Broken</option>
                            <option value="Expired">Expired</option>
                            <option value="Defective">Defective</option>
                            <option value="Lost">Lost</option>
                            <option value="Damaged in Transit">Damaged in Transit</option>
                            <option value="Customer Return">Customer Return</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                        </label>
                        <textarea
                            value={damageFormData.notes}
                            onChange={(e) => setDamageFormData({ ...damageFormData, notes: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            rows={3}
                            placeholder="Additional details about the damage..."
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                setShowDamageModal(false);
                                setSelectedProduct(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary">
                            Confirm Damage
                        </Button>
                    </div>
                </form>
            </Modal>


            {
                toast.show && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast({ ...toast, show: false })}
                        duration={2000}
                    />
                )
            }
        </div >
    );
};

export default Products;
