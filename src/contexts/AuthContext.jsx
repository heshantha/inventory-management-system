import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import supabaseService from '../services/supabaseService';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
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
                // User is signed in, fetch user data from database
                try {
                    const users = await supabaseService.getAllUsers();
                    const userData = users.find(u => u.auth_id === supabaseUser.id);
                    if (userData) {
                        setUser(userData);
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
        console.log('🔐 AuthContext login called with:', { username });
        try {
            const result = await api.login({ username, password });
            console.log('📩 Login result:', result);

            if (result.success) {
                console.log('✅ Setting user in context');
                setUser(result.user);
                return { success: true };
            } else {
                console.log('❌ Login failed:', result.message);
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
