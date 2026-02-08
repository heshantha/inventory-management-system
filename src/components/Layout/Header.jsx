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
        <header className="bg-white shadow-sm border-b border-gray-200 px-3 py-3 md:px-6 md:py-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-0">
                <div className="w-full md:w-auto">
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 leading-tight">
                        Welcome to {getTitle()}
                    </h2>
                    <p className="hidden sm:block text-xs md:text-sm text-gray-600 mt-1">
                        {getSubtitle()}
                    </p>
                </div>

                <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto justify-between md:justify-end">
                    {/* <LanguageSwitcher /> */}

                    <div className="flex items-center gap-2 md:gap-3 px-2 py-1.5 md:px-4 md:py-2 bg-gray-50 rounded-lg border border-gray-200">
                        <UserCircle size={24} className="text-primary-600 md:w-8 md:h-8" />
                        <div className="min-w-0">
                            <p className="font-semibold text-gray-800 text-sm md:text-base truncate">{user?.full_name}</p>
                            <p className="text-xs text-gray-600 capitalize">{user?.role?.replace('_', ' ')}</p>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        size="md"
                        onClick={logout}
                        className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2"
                    >
                        <LogOut size={16} className="md:w-[18px] md:h-[18px]" />
                        <span className="text-sm md:text-base">{t('auth.logout')}</span>
                    </Button>
                </div>
            </div>
        </header>
    );
};

export default Header;
