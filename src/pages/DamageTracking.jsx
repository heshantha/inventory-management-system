import React, { useState, useEffect } from 'react';
import { useShop } from '../contexts/ShopContext';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { AlertTriangle, Plus, Trash2, TrendingDown, Package, DollarSign, Edit } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';
import Toast from '../components/common/Toast';

const DamageTracking = () => {
    const { shopId } = useShop();
    const { user } = useAuth();
    const [damages, setDamages] = useState([]);
    const [products, setProducts] = useState([]);
    const [stats, setStats] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingDamage, setEditingDamage] = useState(null);
    const [formData, setFormData] = useState({
        product_id: '',
        quantity: 1,
        reason: 'Broken',
        notes: ''
    });
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const damageReasons = [
        'Broken',
        'Expired',
        'Defective',
        'Lost',
        'Damaged in Transit',
        'Customer Return',
        'Other'
    ];

    useEffect(() => {
        if (shopId) {
            loadData();
        }
    }, [shopId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [damagesData, productsData, statsData] = await Promise.all([
                api.damages.getAll(shopId),
                api.products.getAll(shopId),
                api.damages.getStats(shopId)
            ]);
            setDamages(damagesData);
            setProducts(productsData);
            setStats(statsData);
        } catch (error) {
            console.error('Error loading damage data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.product_id) {
            setToast({ show: true, message: 'Please select a product', type: 'error' });
            return;
        }

        if (formData.quantity <= 0) {
            setToast({ show: true, message: 'Quantity must be greater than 0', type: 'error' });
            return;
        }

        const dataToSubmit = {
            shop_id: shopId,
            product_id: formData.product_id,
            quantity: parseInt(formData.quantity),
            reason: formData.reason,
            notes: formData.notes,
            recorded_by: user?.id
        };

        let result;
        if (editingDamage) {
            result = await api.damages.update(editingDamage.id, dataToSubmit);
        } else {
            result = await api.damages.create(dataToSubmit);
        }

        if (result.success) {
            await loadData();
            setShowModal(false);
            resetForm();
            await loadData();
            setShowModal(false);
            resetForm();
            setToast({
                show: true,
                message: editingDamage ? 'Damage record updated successfully!' : 'Damage recorded successfully!',
                type: 'success'
            });
        } else {
            setToast({ show: true, message: 'Error: ' + result.message, type: 'error' });
        }
    };

    const handleEdit = (damage) => {
        setEditingDamage(damage);
        setFormData({
            product_id: damage.product_id,
            quantity: damage.quantity,
            reason: damage.reason,
            notes: damage.notes || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this damage record? This will restore the stock.')) {
            const result = await api.damages.delete(id);
            if (result.success) {
                await loadData();
                setToast({ show: true, message: 'Damage record deleted and stock restored successfully!', type: 'success' });
            } else {
                setToast({ show: true, message: 'Error deleting record: ' + result.message, type: 'error' });
            }
        }
    };

    const resetForm = () => {
        setFormData({
            product_id: '',
            quantity: 1,
            reason: 'Broken',
            notes: ''
        });
        setEditingDamage(null);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="p-3 md:p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0 mb-6">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 md:gap-3">
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800">
                            Damage Tracking
                        </h1>
                    </div>
                    <p className="text-sm md:text-base text-gray-600 mt-1">
                        Record and monitor damaged inventory items
                    </p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => {
                        resetForm();
                        setShowModal(true);
                    }}
                    className="w-full md:w-auto flex items-center justify-center"
                >
                    <Plus size={20} className="mr-2" />
                    <span>Record Damage</span>
                </Button>
            </div>

            {/* Statistics Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Total Damaged Items</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {stats.total_damaged}
                                </p>
                            </div>
                            <div className="bg-red-100 p-3 rounded-lg">
                                <TrendingDown className="text-red-600" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Damage Records</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {stats.total_records}
                                </p>
                            </div>
                            <div className="bg-orange-100 p-3 rounded-lg">
                                <Package className="text-orange-600" size={24} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Estimated Value Lost</p>
                                <p className="text-2xl font-bold text-gray-900 mt-1">
                                    {formatCurrency(stats.total_value)}
                                </p>
                            </div>
                            <div className="bg-yellow-100 p-3 rounded-lg">
                                <DollarSign className="text-yellow-600" size={24} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Damages Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Product
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    SKU
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Quantity
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Reason
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Notes
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Recorded By
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                                        Loading...
                                    </td>
                                </tr>
                            ) : damages.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                                        No damage records found
                                    </td>
                                </tr>
                            ) : (
                                damages.map((damage) => (
                                    <tr key={damage.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <AlertTriangle className="text-red-500 mr-2" size={16} />
                                                <span className="font-medium text-gray-900">
                                                    {damage.product_name || 'Unknown Product'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {damage.sku || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="font-semibold text-red-600">
                                                {damage.quantity}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                                {damage.reason}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                            {damage.notes || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(damage.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {damage.recorded_by_name || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            {user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'shop_owner' ? (
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleEdit(damage)}
                                                        className="text-primary-600 hover:text-primary-900"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(damage.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Record Damage Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    resetForm();
                }}
                title={editingDamage ? 'Edit Damage Record' : 'Record Product Damage'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Product *
                        </label>
                        <select
                            required
                            value={formData.product_id}
                            onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="">Select Product</option>
                            {products.filter(p => p.stock_quantity > 0).map((product) => (
                                <option key={product.id} value={product.id}>
                                    {product.name} ({product.sku}) - Stock: {product.stock_quantity}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantity *
                        </label>
                        <input
                            type="number"
                            min="1"
                            required
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reason *
                        </label>
                        <select
                            required
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        >
                            {damageReasons.map((reason) => (
                                <option key={reason} value={reason}>
                                    {reason}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                                setShowModal(false);
                                resetForm();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary">
                            {editingDamage ? 'Update Damage' : 'Record Damage'}
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

export default DamageTracking;
