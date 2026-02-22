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
    XCircle,
    AlertTriangle,
    Bell
} from 'lucide-react';

// Move form fields component outside to prevent re-renders
const ShopFormFields = ({ formData, setFormData, handleLogoFileUpload, isEdit = false }) => (
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
                <option value="Service Center">Service Center</option>
                <option value="Nevil Windscreen Center">Nevil Windscreen Center</option>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number 1 *</label>
            <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                placeholder="+94 XX XXX XXXX"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number 2</label>
            <input
                type="tel"
                value={formData.phone2 || ''}
                onChange={(e) => setFormData({ ...formData, phone2: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                placeholder="+94 XX XXX XXXX"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number 3</label>
            <input
                type="tel"
                value={formData.phone3 || ''}
                onChange={(e) => setFormData({ ...formData, phone3: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                placeholder="+94 XX XXX XXXX"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subscription Start Date</label>
            <input
                type="date"
                value={formData.subscriptionStartDate}
                onChange={(e) => setFormData({ ...formData, subscriptionStartDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subscription End Date</label>
            <input
                type="date"
                value={formData.subscriptionEndDate}
                onChange={(e) => setFormData({ ...formData, subscriptionEndDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
                This date will be displayed in the shop header
            </p>
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
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Invoice Branding</h3>
        </div>

        <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Logo</label>
            <input
                type="file"
                accept="image/*"
                onChange={handleLogoFileUpload}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
                Optional. Browse and upload an image to use as invoice logo.
            </p>
            {formData.invoiceLogoUrl && (
                <div className="mt-2">
                    <img
                        src={formData.invoiceLogoUrl}
                        alt="Invoice logo preview"
                        className="h-14 w-14 object-contain border border-gray-200 rounded bg-white p-1"
                    />
                </div>
            )}
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Header Color</label>
            <input
                type="color"
                value={formData.invoiceHeaderColor || '#1e3a8a'}
                onChange={(e) => setFormData({ ...formData, invoiceHeaderColor: e.target.value })}
                className="w-full h-10 px-1 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Title Color</label>
            <input
                type="color"
                value={formData.invoiceTitleColor || '#1e3a8a'}
                onChange={(e) => setFormData({ ...formData, invoiceTitleColor: e.target.value })}
                className="w-full h-10 px-1 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
        </div>

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Paragraph Color</label>
            <input
                type="color"
                value={formData.invoiceParagraphColor || '#1f2937'}
                onChange={(e) => setFormData({ ...formData, invoiceParagraphColor: e.target.value })}
                className="w-full h-10 px-1 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
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

        {!isEdit ? (
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
        ) : (
            <>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                    <input
                        type="text"
                        value={formData.username}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <input
                        type="password"
                        value={formData.newPassword || ''}
                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        placeholder="Leave empty to keep current password"
                        minLength={6}
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum 6 characters. Only change if needed.</p>
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
    const [editingShopOwnerUser, setEditingShopOwnerUser] = useState(null);
    const [formData, setFormData] = useState({
        shopName: '',
        ownerName: '',
        businessType: '',
        packageType: 'basic',
        location: '',
        address: '',
        phone: '',
        phone2: '',
        phone3: '',
        email: '',
        invoiceLogoUrl: '',
        invoiceHeaderColor: '#1e3a8a',
        invoiceTitleColor: '#1e3a8a',
        invoiceParagraphColor: '#1f2937',
        username: '',
        password: '',
        newPassword: '',
        subscriptionStartDate: '',
        subscriptionEndDate: ''
    });

    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'active', 'inactive', 'expiring'
    const [clearingSalesHistory, setClearingSalesHistory] = useState(false);

    const handleLogoFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }

        // Keep logo small enough for DB text field storage.
        if (file.size > 2 * 1024 * 1024) {
            alert('Logo image is too large. Please select an image under 2MB.');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setFormData((prev) => ({
                ...prev,
                invoiceLogoUrl: reader.result
            }));
        };
        reader.readAsDataURL(file);
    };

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
                phone2: formData.phone2,
                phone3: formData.phone3,
                email: formData.email,
                invoice_logo_url: formData.invoiceLogoUrl || null,
                invoice_header_color: formData.invoiceHeaderColor || '#1e3a8a',
                invoice_title_color: formData.invoiceTitleColor || '#1e3a8a',
                invoice_paragraph_color: formData.invoiceParagraphColor || '#1f2937',
                subscription_start_date: formData.subscriptionStartDate || null,
                subscription_end_date: formData.subscriptionEndDate || null
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
                const warningText = shopResult.warning ? `\n\nNote: ${shopResult.warning}` : '';
                alert(`Shop created successfully!\n\nCredentials:\nUsername: ${formData.username}\nPassword: ${formData.password}\n\nPlease save these credentials and share with the shop owner.${warningText}`);
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
            phone2: '',
            phone3: '',
            email: '',
            invoiceLogoUrl: '',
            invoiceHeaderColor: '#1e3a8a',
            invoiceTitleColor: '#1e3a8a',
            invoiceParagraphColor: '#1f2937',
            username: '',
            password: '',
            newPassword: '',
            subscriptionStartDate: '',
            subscriptionEndDate: ''
        });
    };

    const handleEditShop = async (shop) => {
        setEditingShop(shop);
        const shopUsers = await supabaseService.getAllUsers(shop.id);
        const ownerUser = shopUsers.find(u => u.role === 'shop_owner') || shopUsers[0] || null;
        setEditingShopOwnerUser(ownerUser);
        setFormData({
            shopName: shop.name,
            ownerName: shop.owner_name,
            businessType: shop.business_type || '',
            packageType: shop.package_type || 'basic',
            location: shop.location,
            address: shop.address || '',
            phone: shop.phone,
            phone2: shop.phone2 || '',
            phone3: shop.phone3 || '',
            email: shop.email,
            invoiceLogoUrl: shop.invoice_logo_url || '',
            invoiceHeaderColor: shop.invoice_header_color || '#1e3a8a',
            invoiceTitleColor: shop.invoice_title_color || '#1e3a8a',
            invoiceParagraphColor: shop.invoice_paragraph_color || '#1f2937',
            username: ownerUser?.username || '',
            password: '',
            newPassword: '',
            subscriptionStartDate: shop.subscription_start_date || '',
            subscriptionEndDate: shop.subscription_end_date || ''
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
            phone2: formData.phone2,
            phone3: formData.phone3,
            email: formData.email,
            invoice_logo_url: formData.invoiceLogoUrl || null,
            invoice_header_color: formData.invoiceHeaderColor || '#1e3a8a',
            invoice_title_color: formData.invoiceTitleColor || '#1e3a8a',
            invoice_paragraph_color: formData.invoiceParagraphColor || '#1f2937',
            subscription_start_date: formData.subscriptionStartDate || null,
            subscription_end_date: formData.subscriptionEndDate || null
        });

        if (result.success) {
            let passwordWarning = '';
            if (formData.newPassword && formData.newPassword.trim().length > 0) {
                if (!editingShopOwnerUser?.auth_id) {
                    passwordWarning = '\n\nNote: Owner login not found, so password was not changed.';
                } else if (formData.newPassword.trim().length < 6) {
                    passwordWarning = '\n\nNote: Password not changed. It must be at least 6 characters.';
                } else {
                    const pwResult = await supabaseService.updateUserPasswordByAuthId(
                        editingShopOwnerUser.auth_id,
                        formData.newPassword.trim()
                    );
                    if (!pwResult.success) {
                        passwordWarning = `\n\nNote: Shop details updated, but password change failed: ${pwResult.message}`;
                    }
                }
            }

            const warningText = result.warning ? `\n\nNote: ${result.warning}` : '';
            alert(`Shop updated successfully!${warningText}${passwordWarning}`);
            setShowEditModal(false);
            setEditingShop(null);
            setEditingShopOwnerUser(null);
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

    const handleClearSalesHistory = async () => {
        if (!editingShop?.id) return;

        const confirmMessage = `⚠️ CLEAR SALES HISTORY?\n\nThis will permanently delete ALL sales/invoices for "${editingShop.name}".\n\nThis action cannot be undone.\n\nType "${editingShop.name}" to confirm:`;
        const userInput = prompt(confirmMessage);

        if (userInput === null) return;
        if (userInput !== editingShop.name) {
            alert('Shop name did not match. Operation cancelled.');
            return;
        }

        setClearingSalesHistory(true);
        try {
            const result = await supabaseService.clearSalesHistoryByShop(editingShop.id);
            if (result.success) {
                alert(`Sales history cleared successfully.\n\nDeleted records: ${result.deletedCount}`);
            } else {
                alert('Error clearing sales history: ' + result.message);
            }
        } catch (error) {
            alert('Error: ' + error.message);
        } finally {
            setClearingSalesHistory(false);
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
        }).length,
        expiringSoon: shops.filter(s => {
            if (!s.subscription_end_date) return false;
            const endDate = new Date(s.subscription_end_date);
            const today = new Date();
            const daysUntilExpiry = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
            return daysUntilExpiry <= 7; // Expiring within 7 days or expired
        }).length
    };

    const getFilteredShops = () => {
        switch (filterStatus) {
            case 'active':
                return shops.filter(s => s.is_active);
            case 'inactive':
                return shops.filter(s => !s.is_active);
            case 'expiring':
                return shops.filter(s => {
                    if (!s.subscription_end_date) return false;
                    const endDate = new Date(s.subscription_end_date);
                    const today = new Date();
                    const daysUntilExpiry = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
                    return daysUntilExpiry <= 7;
                });
            default:
                return shops;
        }
    };

    const filteredShops = getFilteredShops();

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
                <div
                    onClick={() => setFilterStatus(filterStatus === 'all' ? 'all' : 'all')}
                    className={`bg-white rounded-lg shadow-sm border p-6 cursor-pointer transition-colors ${filterStatus === 'all' ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200 hover:border-blue-300'}`}
                >
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

                <div
                    onClick={() => setFilterStatus(filterStatus === 'active' ? 'all' : 'active')}
                    className={`bg-white rounded-lg shadow-sm border p-6 cursor-pointer transition-colors ${filterStatus === 'active' ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-200 hover:border-green-300'}`}
                >
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

                <div
                    onClick={() => setFilterStatus(filterStatus === 'inactive' ? 'all' : 'inactive')}
                    className={`bg-white rounded-lg shadow-sm border p-6 cursor-pointer transition-colors ${filterStatus === 'inactive' ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-200 hover:border-red-300'}`}
                >
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

                <div
                    onClick={() => setFilterStatus(filterStatus === 'expiring' ? 'all' : 'expiring')}
                    className={`bg-white rounded-lg shadow-sm border p-6 cursor-pointer transition-colors ${filterStatus === 'expiring' ? 'border-orange-500 ring-1 ring-orange-500' : 'border-gray-200 hover:border-orange-300'}`}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 mb-1">Expiring Soon</p>
                            <p className="text-2xl font-bold text-orange-600">{stats.expiringSoon}</p>
                        </div>
                        <div className="bg-orange-100 p-3 rounded-full">
                            <AlertTriangle className="text-orange-600" size={24} />
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
                                    Subscription
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
                            {filteredShops.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                                        No shops found matching your filter.
                                    </td>
                                </tr>
                            ) : (
                                filteredShops.map((shop) => (
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
                                            {shop.subscription_end_date ? (
                                                <div className="flex flex-col">
                                                    <span>{new Date(shop.subscription_end_date).toLocaleDateString()}</span>
                                                    {(() => {
                                                        const endDate = new Date(shop.subscription_end_date);
                                                        const today = new Date();
                                                        const daysUntilExpiry = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
                                                        if (daysUntilExpiry < 0) return <span className="text-xs text-red-600 font-semibold">Expired</span>;
                                                        if (daysUntilExpiry <= 7) return <span className="text-xs text-orange-600 font-semibold">{daysUntilExpiry} days left</span>;
                                                        return null;
                                                    })()}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400">Not set</span>
                                            )}
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
                        <ShopFormFields
                            formData={formData}
                            setFormData={setFormData}
                            handleLogoFileUpload={handleLogoFileUpload}
                            isEdit={false}
                        />
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
                    setEditingShopOwnerUser(null);
                    resetForm();
                }}
                title={`Edit Shop: ${editingShop?.name}`}
                size="xl"
            >
                <form onSubmit={handleUpdateShop} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <ShopFormFields
                            formData={formData}
                            setFormData={setFormData}
                            handleLogoFileUpload={handleLogoFileUpload}
                            isEdit={true}
                        />
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <Button
                            type="button"
                            variant="danger"
                            onClick={handleClearSalesHistory}
                            disabled={clearingSalesHistory}
                        >
                            {clearingSalesHistory ? 'Clearing Sales...' : 'Clear Sales History'}
                        </Button>
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
