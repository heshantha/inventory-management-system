import React, { useState, useEffect } from 'react';
import { useShop } from '../contexts/ShopContext';
import api from '../services/api';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Toast from '../components/common/Toast';
import { Plus, Edit, Trash2, User, Phone, Mail, MapPin, Search } from 'lucide-react';
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
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    const loadCustomers = async () => {
        const data = await api.customers.getAll(shopId);
        setCustomers(data);
    };

    useEffect(() => {
        if (!shopId) return;
        api.customers.getAll(shopId).then((data) => {
            setCustomers(data);
        });
    }, [shopId]);

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
            setToast({
                show: true,
                message: editingCustomer ? 'Customer updated successfully!' : 'Customer created successfully!',
                type: 'success'
            });
        } else {
            setToast({ show: true, message: 'Error: ' + result.message, type: 'error' });
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
            const result = await api.customers.delete(id);
            if (result.success) {
                await loadCustomers();
                setToast({ show: true, message: 'Customer deleted successfully!', type: 'success' });
            } else {
                setToast({ show: true, message: 'Error deleting customer: ' + result.message, type: 'error' });
            }
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

    const filteredCustomers = customers.filter((customer) =>
        customer.name?.toLowerCase().includes(searchTerm.trim().toLowerCase())
    );
    const itemsPerPage = 10;
    const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / itemsPerPage));
    const effectiveCurrentPage = Math.min(currentPage, totalPages);
    const startIndex = (effectiveCurrentPage - 1) * itemsPerPage;
    const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + itemsPerPage);
    const getVisiblePages = () => {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, index) => index + 1);
        }

        const pages = [1];
        if (effectiveCurrentPage > 4) {
            pages.push('left-ellipsis');
        }

        const middleStart = Math.max(2, effectiveCurrentPage - 1);
        const middleEnd = Math.min(totalPages - 1, effectiveCurrentPage + 1);
        for (let page = middleStart; page <= middleEnd; page += 1) {
            pages.push(page);
        }

        if (effectiveCurrentPage < totalPages - 3) {
            pages.push('right-ellipsis');
        }
        pages.push(totalPages);

        return pages;
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
                            setToast({
                                show: true,
                                message: `Customer limit reached (${usageInfo.limit}). Please upgrade your package.`,
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
                    <span>Add Customer</span>
                </Button>
            </div>

            {/* Search */}
            <div className="mb-4">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setCurrentPage(1);
                        }}
                        placeholder="Search customers by name..."
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                </div>
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
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                        {customers.length === 0
                                            ? 'No customers found. Click "Add Customer" to create one.'
                                            : 'No customers match your search.'}
                                    </td>
                                </tr>
                            ) : (
                                paginatedCustomers.map((customer) => (
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
            {filteredCustomers.length > 0 && (
                <div className="mt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    <p className="text-sm text-gray-600">
                        Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredCustomers.length)} of {filteredCustomers.length}
                    </p>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setCurrentPage((prev) => Math.max(Math.min(prev, totalPages) - 1, 1))}
                            disabled={effectiveCurrentPage === 1}
                            className="h-8 px-3 rounded-md border border-gray-300 text-sm text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                        >
                            ← Prev
                        </button>
                        {getVisiblePages().map((page, index) =>
                            typeof page === 'number' ? (
                                <button
                                    key={page}
                                    type="button"
                                    onClick={() => setCurrentPage(page)}
                                    className={`h-8 min-w-8 px-2 rounded-md border text-sm ${effectiveCurrentPage === page
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    {page}
                                </button>
                            ) : (
                                <span key={`${page}-${index}`} className="h-8 min-w-8 inline-flex items-center justify-center text-gray-500">
                                    ...
                                </span>
                            )
                        )}
                        <button
                            type="button"
                            onClick={() => setCurrentPage((prev) => Math.min(Math.min(prev, totalPages) + 1, totalPages))}
                            disabled={effectiveCurrentPage === totalPages}
                            className="h-8 px-3 rounded-md border border-gray-300 text-sm text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
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
            {toast.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ ...toast, show: false })}
                    duration={2000}
                />
            )}
        </div>
    );
};

export default Customers;
