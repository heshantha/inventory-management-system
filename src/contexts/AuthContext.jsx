import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import supabaseService from '../services/supabaseService';

const AuthContext = createContext(null);

const fallbackAuthContext = {
    user: null,
    login: async () => ({ success: false, message: 'Auth provider unavailable' }),
    logout: async () => ({ success: false, message: 'Auth provider unavailable' }),
    hasRole: () => false,
    isAuthenticated: false,
    loading: false,
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        // In dev/hot-reload there can be brief render timing where context is not ready.
        // Return safe defaults so route guards/components do not hard-crash.
        console.error('useAuth called outside AuthProvider. Falling back to safe defaults.');
        return fallbackAuthContext;
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Listen to Supabase Auth state changes
        const unsubscribe = supabaseService.onAuthStateChange(async (supabaseUser) => {
            if (supabaseUser) {
                // User is signed in, fetch only current user profile
                try {
                    const userData = await supabaseService.getUserByAuthId(supabaseUser.id);
                    if (userData) {
                        setUser(userData);
                    } else {
                        setUser(null);
                    }
                } catch (error) {
                    console.error('Error fetching user data:', error);
                }
            } else {
                // User is signed out
                setUser(null);
            }
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, []);

    const login = async (username, password) => {
        try {
            const result = await api.login({ username, password });

            if (result.success) {
                setUser(result.user);
                return { success: true };
            } else {
                return { success: false, message: result.message };
            }
        } catch (error) {
            console.error('💥 Login error:', error);
            return { success: false, message: 'Login failed. Please try again.' };
        }
    };

    const logout = async () => {
        try {
            await supabaseService.logout();

            // Clear POS data on logout to prevent data persistence between users
            localStorage.removeItem('pos_cart');
            localStorage.removeItem('pos_bill_discount');
            localStorage.removeItem('pos_tax_rate');
            localStorage.removeItem('pos_warranty');
            localStorage.removeItem('pos_payment_method');

            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const hasRole = (roles) => {
        if (!user) return false;
        if (typeof roles === 'string') {
            return user.role === roles;
        }
        return roles.includes(user.role);
    };

    const value = {
        user,
        login,
        logout,
        hasRole,
        isAuthenticated: !!user,
        loading,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
