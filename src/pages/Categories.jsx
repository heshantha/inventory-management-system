import React, { useState, useEffect } from 'react';
import { useShop } from '../contexts/ShopContext';
import api from '../services/api';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { canAddItem, getUsageInfo } from '../utils/packageLimits';

const Categories = () => {
    const { shopId, currentShop } = useShop();
    const [categories, setCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
    });

    useEffect(() => {
        if (shopId) {
            loadCategories();
        }
    }, [shopId]);

    const loadCategories = async () => {
        const data = await api.categories.getAll(shopId);
        setCategories(data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const dataToSubmit = editingCategory
            ? formData
            : { ...formData, shop_id: shopId };

        const result = editingCategory
            ? await api.categories.update(editingCategory.id, dataToSubmit)
            : await api.categories.create(dataToSubmit);

        if (result.success) {
            await loadCategories();
            setShowModal(false);
            resetForm();
        } else {
            alert('Error: ' + result.message);
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            description: category.description || '',
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            await api.categories.delete(id);
            await loadCategories();
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
        });
        setEditingCategory(null);
    };

    return (
        <div className="p-3 md:p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0 mb-6">
                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800">Categories Management</h1>
                        {currentShop && (() => {
                            const usageInfo = getUsageInfo(categories.length, currentShop.package_type, 'categories');
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
                    <p className="text-sm md:text-base text-gray-600 mt-1">Manage your product categories</p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => {
                        if (currentShop && !canAddItem(categories.length, currentShop.package_type, 'categories')) {
                            const usageInfo = getUsageInfo(categories.length, currentShop.package_type, 'categories');
                            alert(`Category limit reached (${usageInfo.limit}). Please upgrade your package to add more categories.`);
                            return;
                        }
                        resetForm();
                        setShowModal(true);
                    }}
                    className="w-full md:w-auto flex items-center justify-center"
                >
                    <Plus size={20} className="mr-2" />
                    <span>Add Category</span>
                </Button>
            </div>

            {/* Categories Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Category
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Description
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {categories.length === 0 ? (
                                <tr>
                                    <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                                        No categories found. Click "Add Category" to create one.
                                    </td>
                                </tr>
                            ) : (
                                categories.map((category) => (
                                    <tr key={category.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Tag className="text-gray-400 mr-3" size={20} />
                                                <div className="font-medium text-gray-900">{category.name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-500">
                                                {category.description || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button
                                                onClick={() => handleEdit(category)}
                                                className="text-primary-600 hover:text-primary-900 inline-flex items-center"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(category.id)}
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
                title={editingCategory ? 'Edit Category' : 'Add New Category'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Category Name *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                            placeholder="e.g., Electronics, Hardware, Tools"
                        />
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
                            placeholder="Optional description for this category"
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
                            {editingCategory ? 'Update Category' : 'Add Category'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div >
    );
};

export default Categories;
