import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useShop } from '../contexts/ShopContext';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { UserPlus, Edit2, Trash2, User, Mail, Lock, Shield } from 'lucide-react';

const Users = () => {
    const { user } = useAuth(); // Get current logged-in user
    const { shopId } = useShop();
    const [users, setUsers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        full_name: '',
        password: '',
        role: 'cashier',
        is_active: true,
    });

    useEffect(() => {
        if (shopId) {
            loadUsers();
        }
    }, [shopId]);

    const loadUsers = async () => {
        const data = await api.users.getAll(shopId);
        setUsers(data);
    };

    // Get available roles based on current user's role
    const getAvailableRoles = () => {
        if (user?.role === 'shop_owner' || user?.role === 'admin') {
            // Shop owner and Admin can create manager and cashier
            return [
                { value: 'manager', label: 'Manager' },
                { value: 'cashier', label: 'Cashier' },
            ];
        } else if (user?.role === 'manager') {
            // Manager can create manager and cashier
            return [
                { value: 'manager', label: 'Manager' },
                { value: 'cashier', label: 'Cashier' },
            ];
        } else {
            // Cashier can only create cashier
            return [
                { value: 'cashier', label: 'Cashier' },
            ];
        }
    };

    const handleOpenModal = (userToEdit = null) => {
        const availableRoles = getAvailableRoles();
        const defaultRole = availableRoles[availableRoles.length - 1].value; // Default to lowest role

        if (userToEdit) {
            setEditingUser(userToEdit);
            setFormData({
                username: userToEdit.username,
                full_name: userToEdit.full_name,
                password: '', // Don't show existing password
                role: userToEdit.role,
                is_active: userToEdit.is_active !== false,
            });
        } else {
            setEditingUser(null);
            setFormData({
                username: '',
                full_name: '',
                password: '',
                role: defaultRole, // Set default to lowest available role
                is_active: true,
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
        setFormData({
            username: '',
            full_name: '',
            password: '',
            role: 'cashier',
            is_active: true,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.username || !formData.full_name) {
            alert('Username and Full Name are required');
            return;
        }

        if (!editingUser && !formData.password) {
            alert('Password is required for new users');
            return;
        }

        // Check if user has permission to create/edit this role
        const availableRoles = getAvailableRoles();
        const canAssignRole = availableRoles.some(r => r.value === formData.role);

        if (!canAssignRole && !editingUser) {
            alert(`You don't have permission to create ${formData.role} users`);
            return;
        }

        const userData = {
            ...formData,
            shop_id: editingUser ? formData.shop_id : shopId, // Add shop_id for new users
            // Only include password if it's provided
            ...(formData.password && { password: formData.password }),
        };

        let result;
        if (editingUser) {
            result = await api.users.update(editingUser.id, userData);
        } else {
            result = await api.users.create(userData);
        }

        // Check if the operation was successful
        if (result && result.success === false) {
            alert('Error: ' + (result.message || 'Failed to save user'));
            return;
        }

        loadUsers();
        handleCloseModal();
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            await api.users.delete(id);
            loadUsers();
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const getRoleBadgeColor = (role) => {
        const colors = {
            shop_owner: 'bg-purple-100 text-purple-800',
            admin: 'bg-red-100 text-red-800',
            manager: 'bg-blue-100 text-blue-800',
            cashier: 'bg-green-100 text-green-800',
        };
        return colors[role] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="p-3 md:p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-0 mb-6">
                <div className="min-w-0 flex-1">
                    <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-800">Users Management</h1>
                    <p className="text-sm md:text-base text-gray-600 mt-1">Manage system users and permissions</p>
                </div>
                <Button
                    onClick={() => handleOpenModal()}
                    className="w-full md:w-auto flex items-center justify-center"
                >
                    <UserPlus size={18} className="mr-2" />
                    <span>Add User</span>
                </Button>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Username
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
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
                            {users.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                                        No users found. Click "Add User" to create one.
                                    </td>
                                </tr>
                            ) : (
                                users.map((userItem) => (
                                    <tr key={userItem.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="bg-primary-100 rounded-full p-2 mr-3">
                                                    <User size={20} className="text-primary-600" />
                                                </div>
                                                <div className="font-medium text-gray-900">{userItem.full_name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {userItem.username}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full uppercase ${getRoleBadgeColor(userItem.role)}`}>
                                                {userItem.role.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${userItem.is_active !== false
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {userItem.is_active !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleOpenModal(userItem)}
                                                className="text-indigo-600 hover:text-indigo-900 mr-4"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(userItem.id)}
                                                className="text-red-600 hover:text-red-900"
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

            {/* Add/Edit User Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingUser ? 'Edit User' : 'Add New User'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            placeholder="John Doe"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Username <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            placeholder="johndoe"
                        />
                    </div>


                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Password {!editingUser && <span className="text-red-500">*</span>}
                            {editingUser && <span className="text-gray-500 text-xs">(leave blank to keep current)</span>}
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required={!editingUser}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            placeholder="••••••••"
                            minLength={6}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Role <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="role"
                            value={formData.role}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        >
                            {getAvailableRoles().map(role => (
                                <option key={role.value} value={role.value}>
                                    {role.label}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                            Select the role for this user (Manager or Cashier)
                        </p>
                    </div>

                    <div className="flex items-center">
                        <input
                            type="checkbox"
                            name="is_active"
                            checked={formData.is_active}
                            onChange={handleChange}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-700">
                            Active User
                        </label>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button type="button" variant="outline" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary">
                            {editingUser ? 'Update User' : 'Create User'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Users;
