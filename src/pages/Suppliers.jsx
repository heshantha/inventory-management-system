import React, { useState, useEffect } from 'react';
import { useShop } from '../contexts/ShopContext';
import api from '../services/api';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { Plus, Edit, Trash2, Truck, Phone, Mail, MapPin } from 'lucide-react';
import { canAddItem, getUsageInfo } from '../utils/packageLimits';

const Suppliers = () => {
    const { shopId, currentShop } = useShop();
    const [suppliers, setSuppliers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        notes: '',
    });

    useEffect(() => {
        if (shopId) {
            loadSuppliers();
        }
    }, [shopId]);

    const loadSuppliers = async () => {
        const data = await api.suppliers.getAll(shopId);
        setSuppliers(data);
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
            await loadSuppliers();
            setShowModal(false);
            resetForm();
        } else {
            alert('Error: ' + result.message);
        }
    };

    const handleEdit = (supplier) => {
        setEditingSupplier(supplier);
        setFormData({
            name: supplier.name,
            contact_person: supplier.contact_person || '',
            email: supplier.email || '',
            phone: supplier.phone || '',
            address: supplier.address || '',
            notes: supplier.notes || '',
        });
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
            notes: '',
        });
        setEditingSupplier(null);
    };

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold text-gray-800">Suppliers Management</h1>
                        {currentShop && (() => {
                            const usageInfo = getUsageInfo(suppliers.length, currentShop.package_type, 'suppliers');
                            return !usageInfo.isUnlimited && (
                                <span className={`text-sm px-3 py-1 rounded-full ${usageInfo.percentage >= 100 ? 'bg-red-100 text-red-800' :
                                        usageInfo.percentage >= 80 ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-blue-100 text-blue-800'
                                    }`}>
                                    {usageInfo.current} / {usageInfo.limit}
                                </span>
                            );
                        })()}
                    </div>
                    <p className="text-gray-600 mt-1">Manage your suppliers and vendors</p>
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
                    style={{
                        display: 'flex'
                    }}
                >
                    <Plus size={20} className="mr-2" />
                    Add Supplier
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Notes
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            rows={2}
                            placeholder="Additional notes or information"
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
                            {editingSupplier ? 'Update Supplier' : 'Add Supplier'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Suppliers;
