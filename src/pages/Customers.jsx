import React, { useState, useEffect } from 'react';
import { useShop } from '../contexts/ShopContext';
import api from '../services/api';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { Plus, Edit, Trash2, User, Phone, Mail, MapPin } from 'lucide-react';
import { canAddItem, getUsageInfo } from '../utils/packageLimits';

const Customers = () => {
    const { shopId, currentShop } = useShop();
    const [customers, setCustomers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
    });

    useEffect(() => {
        if (shopId) {
            loadCustomers();
        }
    }, [shopId]);

    const loadCustomers = async () => {
        const data = await api.customers.getAll(shopId);
        setCustomers(data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const dataToSubmit = editingCustomer
            ? formData
            : { ...formData, shop_id: shopId };

        const result = editingCustomer
            ? await api.customers.update(editingCustomer.id, dataToSubmit)
            : await api.customers.create(dataToSubmit);

        if (result.success) {
            await loadCustomers();
            setShowModal(false);
            resetForm();
        } else {
            alert('Error: ' + result.message);
        }
    };

    const handleEdit = (customer) => {
        setEditingCustomer(customer);
        setFormData({
            name: customer.name,
            email: customer.email || '',
            phone: customer.phone || '',
            address: customer.address || '',
            notes: customer.notes || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this customer?')) {
            await api.customers.delete(id);
            await loadCustomers();
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            address: '',
            notes: '',
        });
        setEditingCustomer(null);
    };

    return (
        <div className="p-3 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0 mb-6">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800">Customers Management</h1>
                        {currentShop && (() => {
                            const usageInfo = getUsageInfo(customers.length, currentShop.package_type, 'customers');
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
                    <p className="text-sm md:text-base text-gray-600 mt-1">Manage your customer database</p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => {
                        if (currentShop && !canAddItem(customers.length, currentShop.package_type, 'customers')) {
                            const usageInfo = getUsageInfo(customers.length, currentShop.package_type, 'customers');
                            alert(`Customer limit reached (${usageInfo.limit}). Please upgrade your package to add more customers.`);
                            return;
                        }
                        resetForm();
                        setShowModal(true);
                    }}
                    className="w-full md:w-auto flex items-center justify-center"
                >
                    <Plus size={20} className="mr-2" />
                    <span>Add Customer</span>
                </Button>
            </div>

            {/* Customers Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Customer
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Contact
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Address
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {customers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                        No customers found. Click "Add Customer" to create one.
                                    </td>
                                </tr>
                            ) : (
                                customers.map((customer) => (
                                    <tr key={customer.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <User className="text-gray-400 mr-3" size={20} />
                                                <div>
                                                    <div className="font-medium text-gray-900">{customer.name}</div>
                                                    {customer.notes && (
                                                        <div className="text-sm text-gray-500 truncate max-w-xs">
                                                            {customer.notes}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                {customer.phone && (
                                                    <div className="flex items-center text-sm text-gray-900">
                                                        <Phone size={14} className="mr-2 text-gray-400" />
                                                        {customer.phone}
                                                    </div>
                                                )}
                                                {customer.email && (
                                                    <div className="flex items-center text-sm text-gray-500">
                                                        <Mail size={14} className="mr-2 text-gray-400" />
                                                        {customer.email}
                                                    </div>
                                                )}
                                                {!customer.phone && !customer.email && (
                                                    <span className="text-sm text-gray-400">-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {customer.address ? (
                                                <div className="flex items-start text-sm text-gray-600">
                                                    <MapPin size={14} className="mr-2 mt-1 flex-shrink-0 text-gray-400" />
                                                    <span className="line-clamp-2">{customer.address}</span>
                                                </div>
                                            ) : (
                                                <span className="text-sm text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button
                                                onClick={() => handleEdit(customer)}
                                                className="text-primary-600 hover:text-primary-900 inline-flex items-center"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(customer.id)}
                                                className="text-red-600 hover:text-red-900 inline-flex items-center"
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

            {/* Add/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    resetForm();
                }}
                title={editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Customer Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                                placeholder="e.g., customer@example.com"
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            rows={2}
                            placeholder="Additional notes or preferences"
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
                            {editingCustomer ? 'Update Customer' : 'Add Customer'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Customers;
