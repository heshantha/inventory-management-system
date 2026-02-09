import React, { useState } from 'react';
import { useShop } from '../../contexts/ShopContext';
import { useAuth } from '../../contexts/AuthContext';
import { AlertTriangle, X, Calendar, AlertCircle } from 'lucide-react';

const SubscriptionAlert = () => {
    const { currentShop, loading } = useShop();
    const { user } = useAuth();
    const [isVisible, setIsVisible] = useState(true);

    // Don't show for super admin or if loading or no shop
    if (loading || !currentShop || user?.role === 'super_admin') {
        return null;
    }

    if (!isVisible) return null;

    const endDate = currentShop.subscription_end_date ? new Date(currentShop.subscription_end_date) : null;

    // If no subscription date set, don't show alert
    if (!endDate) return null;

    const today = new Date();
    const daysUntilExpiry = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

    // Determine alert state
    let alertConfig = null;

    if (daysUntilExpiry < 0) {
        // Expired
        alertConfig = {
            type: 'expired',
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200',
            textColor: 'text-red-800',
            icon: AlertCircle,
            iconColor: 'text-red-600',
            title: 'Subscription Expired',
            message: `Your subscription expired on ${endDate.toLocaleDateString()}. Please contact the administrator to renew your services immediately.`
        };
    } else if (daysUntilExpiry <= 2) {
        // Expiring Soon (Critical - 2 days or less)
        alertConfig = {
            type: 'critical',
            bgColor: 'bg-red-50',
            borderColor: 'border-red-200',
            textColor: 'text-red-800',
            icon: AlertTriangle,
            iconColor: 'text-red-600',
            title: 'Subscription Expiring Soon',
            message: `Your subscription will expire in ${daysUntilExpiry} days (${endDate.toLocaleDateString()}). Please renew soon to avoid service interruption.`
        };
    }

    if (!alertConfig) return null;

    return (
        <div className={`mb-6 p-4 rounded-lg border ${alertConfig.bgColor} ${alertConfig.borderColor} relative shadow-sm`}>
            {alertConfig.type !== 'expired' && (
                <button
                    onClick={() => setIsVisible(false)}
                    className={`absolute top-4 right-4 ${alertConfig.textColor} hover:opacity-70`}
                >
                    <X size={20} />
                </button>
            )}

            <div className="flex items-start">
                <div className={`flex-shrink-0 mr-3 mt-0.5`}>
                    <alertConfig.icon className={`h-6 w-6 ${alertConfig.iconColor}`} />
                </div>
                <div>
                    <h3 className={`text-base font-semibold ${alertConfig.textColor}`}>
                        {alertConfig.title}
                    </h3>
                    <div className={`mt-1 text-sm ${alertConfig.textColor} opacity-90`}>
                        {alertConfig.message}
                    </div>
                    {alertConfig.type === 'expired' && (
                        <div className="mt-3">
                            <span className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                                Contact Admin
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubscriptionAlert;
