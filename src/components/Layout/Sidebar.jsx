import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useShop } from '../../contexts/ShopContext';
import { useTranslation } from 'react-i18next';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    FileText,
    Settings,
    TruckIcon,
    FolderTree,
    UserPlus,
    Shield,
    Wrench,
    Monitor,
} from 'lucide-react';

const Sidebar = () => {
    const { hasRole, user } = useAuth();
    const { currentShop } = useShop();
    const { t } = useTranslation();

    // Super admin only sees super admin dashboard
    const isSuperAdmin = user?.role === 'super_admin';

    // Super Admin menu
    const superAdminMenu = [
        { path: '/super-admin', icon: Shield, label: 'Super Admin', roles: ['super_admin'] },
    ];

    // Shop Owner/Staff menu (hidden for super admins)
    const shopMenu = [
        { path: '/', icon: LayoutDashboard, label: t('nav.dashboard'), roles: ['shop_owner', 'manager'] },
        { path: '/pos', icon: ShoppingCart, label: t('nav.pos'), roles: ['shop_owner', 'cashier'] },
        { path: '/products', icon: Package, label: t('nav.products'), roles: ['shop_owner', 'manager', 'cashier'] },
        { path: '/customers', icon: Users, label: t('nav.customers'), roles: ['shop_owner', 'cashier', 'manager'] },
        { path: '/sales', icon: FileText, label: t('nav.sales'), roles: ['shop_owner', 'manager'] },
        { path: '/reports', icon: FileText, label: t('nav.reports'), roles: ['shop_owner', 'manager'] },
        { path: '/categories', icon: FolderTree, label: t('nav.categories'), roles: ['shop_owner', 'cashier'] },
        { path: '/suppliers', icon: TruckIcon, label: t('nav.suppliers'), roles: ['shop_owner', 'cashier'] },
        { path: '/users', icon: UserPlus, label: t('nav.users'), roles: ['shop_owner'] },
    ];

    // Add Garage menu item for Service Center shops only
    const businessType = currentShop?.business_type?.toLowerCase();
    if (businessType === 'service center' || businessType === 'garage') {
        // Insert Garage after POS (index 2)
        shopMenu.splice(2, 0, { path: '/garage', icon: Wrench, label: 'Garage', roles: ['shop_owner', 'cashier', 'manager'] });
    }

    // Add Repair Service menu for Computer Shop
    if (currentShop?.business_type === 'Computer Shop' || currentShop?.business_type === 'Electronics') {
        shopMenu.splice(2, 0, { path: '/repair-service', icon: Monitor, label: 'Repairs', roles: ['shop_owner', 'cashier'] });
    }

    // Choose menu based on user type
    const menuItems = isSuperAdmin ? superAdminMenu : shopMenu;
    const filteredMenu = menuItems.filter(item => hasRole(item.roles));

    return (
        <aside className="w-16 lg:w-64 bg-gray-900 text-white min-h-screen flex flex-col">
            {/* Logo */}
            <div className="p-4 lg:p-6 border-b border-gray-700">
                <div className="flex items-center lg:space-x-3">
                    <div className="bg-primary-600 rounded-lg p-2">
                        <Package size={28} />
                    </div>
                    <div className="hidden lg:block">
                        <h1 className="text-xl font-bold">SmartStock POS</h1>
                        <p className="text-xs text-gray-400">Inventory System</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4">
                <ul className="space-y-2">
                    {filteredMenu.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                end={item.path === '/'}
                                className={({ isActive }) =>
                                    `flex items-center justify-center lg:justify-start lg:space-x-3 px-2 lg:px-4 py-3 rounded-lg transition-all duration-200 ${isActive
                                        ? 'bg-primary-600 text-white shadow-lg'
                                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                                    }`
                                }
                                title={item.label}
                            >
                                <item.icon size={20} />
                                <span className="hidden lg:inline font-medium">{item.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-gray-700">
                <p className="text-xs text-gray-500 text-center hidden lg:block">
                    Version 1.0.0
                </p>
            </div>
        </aside>
    );
};

export default Sidebar;
