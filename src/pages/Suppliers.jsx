import React, { useState, useEffect } from 'react';
import { useShop } from '../contexts/ShopContext';
import api from '../services/api';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { Plus, Edit, Trash2, Truck, Phone, Mail, MapPin, Package, Eye, X } from 'lucide-react';
import { canAddItem, getUsageInfo } from '../utils/packageLimits';
import { formatCurrency } from '../utils/calculations';

const Suppliers = () => {
    const { shopId, currentShop } = useShop();
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showProductsModal, setShowProductsModal] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [supplierProducts, setSupplierProducts] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(false);
    const [selectedProductIds, setSelectedProductIds] = useState([]);
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
    });

    useEffect(() => {
        if (shopId) {
            loadSuppliers();
            loadProducts();
        }
    }, [shopId]);

    const loadSuppliers = async () => {
        const data = await api.suppliers.getAll(shopId);
        setSuppliers(data);
    };

    const loadProducts = async () => {
        const data = await api.products.getAll(shopId);
        setProducts(data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const dataToSubmit = editingSupplier
            ? formData
            : { ...formData, shop_id: shopId };

        const result = editingSupplier
            ? await api.suppliers.update(editingSupplier.id, dataToSubmit)
            : await api.suppliers.create(dataToSubmit);

        if (result.success) {
            // Update products for this supplier
            const supplierId = editingSupplier ? editingSupplier.id : result.id;
            const productResult = await api.suppliers.updateProducts(supplierId, selectedProductIds);

            if (!productResult.success) {
                alert('Supplier saved but error updating products: ' + productResult.message);
            }

            await loadSuppliers();
            setShowModal(false);
            resetForm();
        } else {
            alert('Error: ' + result.message);
        }
    };

    const handleEdit = async (supplier) => {
        setEditingSupplier(supplier);
        setFormData({
            name: supplier.name,
            contact_person: supplier.contact_person || '',
            email: supplier.email || '',
            phone: supplier.phone || '',
            address: supplier.address || '',
        });

        // Load current products for this supplier
        const currentProducts = await api.suppliers.getProducts(supplier.id);
        const currentProductIds = currentProducts.map(p => p.id);
        setSelectedProductIds(currentProductIds);

        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this supplier?')) {
            await api.suppliers.delete(id);
            await loadSuppliers();
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            contact_person: '',
            email: '',
            phone: '',
            address: '',
        });
        setEditingSupplier(null);
        setSelectedProductIds([]);
        setProductSearchTerm('');
    };

    const toggleProductSelection = (productId) => {
        setSelectedProductIds(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(productSearchTerm.toLowerCase())
    );

    const handleViewProducts = async (supplier) => {
        setSelectedSupplier(supplier);
        setShowProductsModal(true);
        setLoadingProducts(true);
        const products = await api.suppliers.getProducts(supplier.id);
        setSupplierProducts(products);
        setLoadingProducts(false);
    };

    return (
        <div className="p-3 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0 mb-6">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800">Suppliers Management</h1>
                        {currentShop && (() => {
                            const usageInfo = getUsageInfo(suppliers.length, currentShop.package_type, 'suppliers');
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
                    <p className="text-sm md:text-base text-gray-600 mt-1">Manage your suppliers and vendors</p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => {
                        if (currentShop && !canAddItem(suppliers.length, currentShop.package_type, 'suppliers')) {
                            const usageInfo = getUsageInfo(suppliers.length, currentShop.package_type, 'suppliers');
                            alert(`Supplier limit reached (${usageInfo.limit}). Please upgrade your package to add more suppliers.`);
                            return;
                        }
                        resetForm();
                        setShowModal(true);
                    }}
                    className="w-full md:w-auto flex items-center justify-center"
                >
                    <Plus size={20} className="mr-2" />
                    <span>Add Supplier</span>
                </Button>
            </div>

            {/* Suppliers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {suppliers.length === 0 ? (
                    <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                        <Truck className="mx-auto text-gray-400 mb-4" size={48} />
                        <p className="text-gray-500">No suppliers found. Click "Add Supplier" to create one.</p>
                    </div>
                ) : (
                    suppliers.map((supplier) => (
                        <div
                            key={supplier.id}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center">
                                    <Truck className="text-primary-500 mr-3" size={24} />
                                    <h3 className="font-bold text-lg text-gray-800">{supplier.name}</h3>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleEdit(supplier)}
                                        className="text-primary-600 hover:text-primary-900"
                                    >
                                        <Edit size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(supplier.id)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                {supplier.contact_person && (
                                    <div className="flex items-center text-gray-600">
                                        <span className="font-medium">Contact:</span>
                                        <span className="ml-2">{supplier.contact_person}</span>
                                    </div>
                                )}
                                {supplier.phone && (
                                    <div className="flex items-center text-gray-600">
                                        <Phone size={14} className="mr-2" />
                                        <span>{supplier.phone}</span>
                                    </div>
                                )}
                                {supplier.email && (
                                    <div className="flex items-center text-gray-600">
                                        <Mail size={14} className="mr-2" />
                                        <span className="truncate">{supplier.email}</span>
                                    </div>
                                )}
                                {supplier.address && (
                                    <div className="flex items-start text-gray-600">
                                        <MapPin size={14} className="mr-2 mt-1 flex-shrink-0" />
                                        <span className="line-clamp-2">{supplier.address}</span>
                                    </div>
                                )}
                                {supplier.notes && (
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <p className="text-gray-500 text-xs line-clamp-2">{supplier.notes}</p>
                                    </div>
                                )}
                            </div>

                            {/* Product Count Badge and View Button */}
                            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                                <div className="flex items-center text-sm">
                                    <Package size={16} className="mr-2 text-primary-600" />
                                    <span className="font-medium text-gray-700">
                                        {supplier.product_count || 0} Product{supplier.product_count !== 1 ? 's' : ''}
                                    </span>
                                </div>
                                {(supplier.product_count || 0) > 0 && (
                                    <button
                                        onClick={() => handleViewProducts(supplier)}
                                        className="flex items-center text-xs text-primary-600 hover:text-primary-800 font-medium"
                                    >
                                        <Eye size={14} className="mr-1" />
                                        View Products
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    resetForm();
                }}
                title={editingSupplier ? 'Edit Supplier' : 'Add New Supplier'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Supplier Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            placeholder="e.g., SmartStock POS"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contact Person
                        </label>
                        <input
                            type="text"
                            value={formData.contact_person}
                            onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            placeholder="e.g., John Doe"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                placeholder="e.g., +1234567890"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                placeholder="e.g., supplier@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Address
                        </label>
                        <textarea
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            rows={2}
                            placeholder="Complete address"
                        />
                    </div>

                    {/* Product Selection Section */}
                    <div className="pt-4 border-t border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Assign Products
                        </label>
                        <p className="text-xs text-gray-500 mb-3">
                            Select products that this supplier provides
                        </p>

                        {/* Search Products */}
                        <input
                            type="text"
                            value={productSearchTerm}
                            onChange={(e) => setProductSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 mb-3"
                            placeholder="Search products by name or SKU..."
                        />

                        {/* Product List with Checkboxes */}
                        <div className="border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                            {filteredProducts.length === 0 ? (
                                <div className="p-4 text-center text-gray-500 text-sm">
                                    No products found
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-200">
                                    {filteredProducts.map((product) => (
                                        <label
                                            key={product.id}
                                            className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedProductIds.includes(product.id)}
                                                onChange={() => toggleProductSelection(product.id)}
                                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                            />
                                            <div className="ml-3 flex-1">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {product.name}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    SKU: {product.sku} | Stock: {product.stock_quantity}
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Selected Count */}
                        <div className="mt-2 text-xs text-gray-600">
                            {selectedProductIds.length} product{selectedProductIds.length !== 1 ? 's' : ''} selected
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
                            {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* View Products Modal */}
            <Modal
                isOpen={showProductsModal}
                onClose={() => {
                    setShowProductsModal(false);
                    setSelectedSupplier(null);
                    setSupplierProducts([]);
                }}
                title={`Products from ${selectedSupplier?.name || 'Supplier'}`}
            >
                <div className="space-y-4">
                    {loadingProducts ? (
                        <div className="text-center py-8">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                            <p className="text-gray-500 mt-4">Loading products...</p>
                        </div>
                    ) : supplierProducts.length === 0 ? (
                        <div className="text-center py-8">
                            <Package className="mx-auto text-gray-400 mb-4" size={48} />
                            <p className="text-gray-500">No products found for this supplier</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Stock</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Cost Price</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Selling Price</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {supplierProducts.map((product) => (
                                        <tr key={product.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-600">{product.sku}</td>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{product.name}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{product.category_name}</td>
                                            <td className="px-4 py-3 text-sm text-right">
                                                <span className={`font-medium ${product.stock_quantity <= 0 ? 'text-red-600' :
                                                    product.stock_quantity < 10 ? 'text-yellow-600' :
                                                        'text-green-600'
                                                    }`}>
                                                    {product.stock_quantity}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right text-gray-600">
                                                {formatCurrency(product.cost_price || 0)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">
                                                {formatCurrency(product.selling_price || 0)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="flex justify-end pt-4 border-t border-gray-200">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                setShowProductsModal(false);
                                setSelectedSupplier(null);
                                setSupplierProducts([]);
                            }}
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Suppliers;
