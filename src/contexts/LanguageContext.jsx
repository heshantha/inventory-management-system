import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageContext = createContext();

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
};

export const LanguageProvider = ({ children }) => {
    const { i18n } = useTranslation();
    const [currentLanguage, setCurrentLanguage] = useState(i18n.language || 'en');

    useEffect(() => {
        // Initialize from localStorage or default to 'en'
        const savedLanguage = localStorage.getItem('language') || 'en';
        changeLanguage(savedLanguage);
    }, []);

    const changeLanguage = (lang) => {
        i18n.changeLanguage(lang);
        setCurrentLanguage(lang);
        localStorage.setItem('language', lang);
        // Update HTML lang attribute for accessibility
        document.documentElement.lang = lang;
    };

    const toggleLanguage = () => {
        const newLang = currentLanguage === 'en' ? 'si' : 'en';
        changeLanguage(newLang);
    };

    const value = {
        currentLanguage,
        changeLanguage,
        toggleLanguage,
        isEnglish: currentLanguage === 'en',
        isSinhala: currentLanguage === 'si',
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};
