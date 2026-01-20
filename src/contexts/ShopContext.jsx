import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import supabaseService from '../services/supabaseService';

const ShopContext = createContext(null);

export const useShop = () => {
    const context = useContext(ShopContext);
    if (!context) {
        throw new Error('useShop must be used within a ShopProvider');
    }
    return context;
};

export const ShopProvider = ({ children }) => {
    const { user } = useAuth();
    const [currentShop, setCurrentShop] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadShop = async () => {
            // Super admins don't belong to a shop
            if (user?.role === 'super_admin') {
                setCurrentShop(null);
                setLoading(false);
                return;
            }

            // If no user yet, keep loading
            if (!user) {
                setLoading(false);
                return;
            }

            // If user has shop_id, load the shop
            if (user.shop_id) {
                try {
                    console.log('Loading shop for shop_id:', user.shop_id);
                    const shop = await supabaseService.getShopById(user.shop_id);
                    console.log('Shop loaded:', shop);
                    setCurrentShop(shop);
                } catch (error) {
                    console.error('Error loading shop:', error);
                    setCurrentShop(null);
                } finally {
                    setLoading(false);
                }
            } else {
                // User has no shop_id
                console.log('User has no shop_id');
                setCurrentShop(null);
                setLoading(false);
            }
        };

        loadShop();
    }, [user]);

    const value = {
        currentShop,
        loading,
        shopId: currentShop?.id || user?.shop_id || null
    };

    // Only show loading screen if we're actually loading and have a user with shop_id
    if (loading && user && user.shop_id && user.role !== 'super_admin') {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading shop information...</p>
                </div>
            </div>
        );
    }

    return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
};
