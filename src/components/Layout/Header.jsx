import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useShop } from '../../contexts/ShopContext';
import { useTranslation } from 'react-i18next';
import { LogOut, UserCircle } from 'lucide-react';
import Button from '../common/Button';
import LanguageSwitcher from '../common/LanguageSwitcher';

const Header = () => {
    const { user, logout } = useAuth();
    const { currentShop } = useShop();
    const { t } = useTranslation();

    // Determine title based on user role
    const getTitle = () => {
        if (user?.role === 'super_admin') {
            return 'SmartStock POS - Super Admin';
        }
        return currentShop?.name || 'SmartStock POS';
    };

    const getSubtitle = () => {
        if (user?.role === 'super_admin') {
            return 'Manage all shop customers';
        }
        return 'Manage your inventory and sales efficiently';
    };

    return (
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                        Welcome to {getTitle()}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        {getSubtitle()}
                    </p>
                </div>

                <div className="flex items-center space-x-4">
                    {/* <LanguageSwitcher /> */}

                    <div className="flex items-center space-x-3 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                        <UserCircle size={32} className="text-primary-600" />
                        <div>
                            <p className="font-semibold text-gray-800">{user?.full_name}</p>
                            <p className="text-xs text-gray-600 capitalize">{user?.role?.replace('_', ' ')}</p>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        size="md"
                        onClick={logout}
                        className="flex items-center space-x-2"
                    >
                        <LogOut size={18} />
                        <span>{t('auth.logout')}</span>
                    </Button>
                </div>
            </div>
        </header>
    );
};

export default Header;
