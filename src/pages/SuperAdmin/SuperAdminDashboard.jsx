import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import supabaseService from '../../services/supabaseService';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import {
    Store,
    Plus,
    Edit,
    Trash2,
    ToggleLeft,
    ToggleRight,
    TrendingUp,
    Users,
    CheckCircle,
    XCircle
} from 'lucide-react';

// Move form fields component outside to prevent re-renders
const ShopFormFields = ({ formData, setFormData, isEdit = false }) => (
    <>
        <div className="col-span-2">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Shop Information</h3>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shop Name *</label>
            <input
                type="text"
                required
                value={formData.shopName}
                onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                placeholder="e.g., Tech Electronics Store"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shop Type</label>
            <select
                value={formData.businessType}
                onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
                <option value="">Select Shop Type</option>
                <option value="Retail Shop">Retail Shop</option>
                <option value="Computer Shop">Computer Shop</option>
                <option value="Shop Shop">Shop Shop</option>
                <option value="Hardware Shop">Hardware Shop</option>
                <option value="Pharmacy Shop">Pharmacy Shop</option>
            </select>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Package *</label>
            <select
                required
                value={formData.packageType}
                onChange={(e) => setFormData({ ...formData, packageType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
            >
                <option value="basic">Basic (50 limit each)</option>
                <option value="standard">Standard (150 limit each)</option>
                <option value="premium">Premium (Unlimited)</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
                Limits apply to products, customers, categories, and suppliers
            </p>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location/City *</label>
            <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                placeholder="e.g., Colombo, Kandy"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
            <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                placeholder="+94 XX XXX XXXX"
            />
        </div>

        <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                rows={2}
                placeholder="Full address"
            />
        </div>

        <div className="col-span-2 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Owner Information</h3>
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Owner Full Name *</label>
            <input
                type="text"
                required
                value={formData.ownerName}
                onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                placeholder="e.g., John Doe"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Owner Email *</label>
            <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                placeholder="owner@example.com"
            />
        </div>

        {!isEdit && (
            <>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                    <input
                        type="text"
                        required
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        placeholder="e.g., johndoe"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Initial Password *</label>
                    <input
                        type="password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        placeholder="Minimum 6 characters"
                        minLength={6}
                    />
                </div>
            </>
        )}
    </>
);

const SuperAdminDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingShop, setEditingShop] = useState(null);
    const [formData, setFormData] = useState({
        shopName: '',
        ownerName: '',
        businessType: '',
        packageType: 'basic',
        location: '',
        address: '',
        phone: '',
        email: '',
        username: '',
        password: ''
    });

    useEffect(() => {
        // Redirect if not super admin
        if (user && user.role !== 'super_admin') {
            navigate('/');
            return;
        }
        loadShops();
    }, [user, navigate]);

    const loadShops = async () => {
        setLoading(true);
        const shopsData = await supabaseService.getAllShops();
        setShops(shopsData);
        setLoading(false);
    };

    const handleCreateShop = async (e) => {
        e.preventDefault();

        try {
            // Create shop
            const shopResult = await supabaseService.createShop({
                name: formData.shopName,
                owner_name: formData.ownerName,
                business_type: formData.businessType,
                package_type: formData.packageType,
                location: formData.location,
                address: formData.address,
                phone: formData.phone,
                email: formData.email
            });

            if (!shopResult.success) {
                alert('Error creating shop: ' + shopResult.message);
                return;
            }

            // Create shop owner user
            const userResult = await supabaseService.createUser({
                username: formData.username,
                full_name: formData.ownerName,
                email: formData.email,
                password: formData.password,
                shop_id: shopResult.id,
                role: 'shop_owner'
            });

            if (userResult.success) {
                alert(`Shop created successfully!\n\nCredentials:\nUsername: ${formData.username}\nPassword: ${formData.password}\n\nPlease save these credentials and share with the shop owner.`);
                setShowCreateModal(false);
                resetForm();
                loadShops();
            } else {
                alert('Shop created but error creating owner: ' + userResult.message);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        }
    };

    const toggleShopStatus = async (shopId, currentStatus) => {
        if (confirm(`Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this shop?`)) {
            await supabaseService.updateShopStatus(shopId, !currentStatus);
            loadShops();
        }
    };

    const resetForm = () => {
        setFormData({
            shopName: '',
            ownerName: '',
            businessType: '',
            packageType: 'basic',
            location: '',
            address: '',
            phone: '',
            email: '',
            username: '',
            password: ''
        });
    };

    const handleEditShop = (shop) => {
        setEditingShop(shop);
        setFormData({
            shopName: shop.name,
            ownerName: shop.owner_name,
            businessType: shop.business_type || '',
            packageType: shop.package_type || 'basic',
            location: shop.location,
            address: shop.address || '',
            phone: shop.phone,
            email: shop.email,
            username: '',
            password: ''
        });
        setShowEditModal(true);
    };

    const handleUpdateShop = async (e) => {
        e.preventDefault();

        const result = await supabaseService.updateShop(editingShop.id, {
            name: formData.shopName,
            owner_name: formData.ownerName,
            business_type: formData.businessType,
            package_type: formData.packageType,
            location: formData.location,
            address: formData.address,
            phone: formData.phone,
            email: formData.email
        });

        if (result.success) {
            alert('Shop updated successfully!');
            setShowEditModal(false);
            setEditingShop(null);
            resetForm();
            loadShops();
        }
    };

    const handleDeleteShop = async (shop) => {
        if (confirm(`⚠️ DELETE "${shop.name}"?\n\nThis will permanently delete the shop.\n\nThis action cannot be undone!`)) {
            const result = await supabaseService.deleteShop(shop.id);
            if (result.success) {
                alert('Shop deleted successfully');
                loadShops();
            }
        }
    };

    const stats = {
        totalShops: shops.length,
        activeShops: shops.filter(s => s.is_active).length,
        inactiveShops: shops.filter(s => !s.is_active).length,
        newThisMonth: shops.filter(s => {
            const created = new Date(s.created_at);
            const now = new Date();
            return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
        }).length
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Super Admin Dashboard</h1>
                <p className="text-gray-600 mt-1">Manage all shop customers</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Total Shops</p>
                            <p className="text-2xl font-bold text-gray-800">{stats.totalShops}</p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-full">
                            <Store className="text-blue-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Active Shops</p>
                            <p className="text-2xl font-bold text-green-600">{stats.activeShops}</p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-full">
                            <CheckCircle className="text-green-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Inactive Shops</p>
                            <p className="text-2xl font-bold text-red-600">{stats.inactiveShops}</p>
                        </div>
                        <div className="bg-red-100 p-3 rounded-full">
                            <XCircle className="text-red-600" size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">New This Month</p>
                            <p className="text-2xl font-bold text-purple-600">{stats.newThisMonth}</p>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-full">
                            <TrendingUp className="text-purple-600" size={24} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Shop Button */}
            <div className="mb-6">
                <Button
                    variant="primary"
                    onClick={() => setShowCreateModal(true)}
                    style={{ display: 'flex' }}
                >
                    <Plus size={20} className="mr-2" />
                    Create New Shop
                </Button>
            </div>

            {/* Shops Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Shop Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Owner
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Location
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Contact
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {shops.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        No shops yet. Create your first shop customer!
                                    </td>
                                </tr>
                            ) : (
                                shops.map((shop) => (
                                    <tr key={shop.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <Store className="text-gray-400 mr-3" size={20} />
                                                <div>
                                                    <div className="font-medium text-gray-900">{shop.name}</div>
                                                    <div className="text-sm text-gray-500">{shop.business_type}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {shop.owner_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {shop.location}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div>{shop.phone}</div>
                                            <div className="text-xs">{shop.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${shop.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                                }`}>
                                                {shop.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                                            <button
                                                onClick={() => handleEditShop(shop)}
                                                className="inline-flex items-center text-blue-600 hover:text-blue-900"
                                                title="Edit Shop"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button
                                                onClick={() => toggleShopStatus(shop.id, shop.is_active)}
                                                className={`inline-flex items-center ${shop.is_active
                                                    ? 'text-orange-600 hover:text-orange-900'
                                                    : 'text-green-600 hover:text-green-900'
                                                    }`}
                                                title={shop.is_active ? 'Deactivate' : 'Activate'}
                                            >
                                                {shop.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteShop(shop)}
                                                className="inline-flex items-center text-red-600 hover:text-red-900"
                                                title="Delete Shop"
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

            {/* Create Shop Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => {
                    setShowCreateModal(false);
                    resetForm();
                }}
                title="Create New Shop Customer"
                size="xl"
            >
                <form onSubmit={handleCreateShop} className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <p className="text-sm text-blue-800">
                            <strong>Note:</strong> This creates a new shop account for your customer with full access to SmartStock POS.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <ShopFormFields formData={formData} setFormData={setFormData} isEdit={false} />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                setShowCreateModal(false);
                                resetForm();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary">
                            Create Shop & Owner Account
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Edit Shop Modal */}
            <Modal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setEditingShop(null);
                    resetForm();
                }}
                title={`Edit Shop: ${editingShop?.name}`}
                size="xl"
            >
                <form onSubmit={handleUpdateShop} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <ShopFormFields formData={formData} setFormData={setFormData} isEdit={true} />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                setShowEditModal(false);
                                setEditingShop(null);
                                resetForm();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary">
                            Update Shop
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default SuperAdminDashboard;
