import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Globe } from 'lucide-react';

const LanguageSwitcher = () => {
    const { currentLanguage, toggleLanguage, isEnglish } = useLanguage();

    return (
        <button
            onClick={toggleLanguage}
            className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            title={isEnglish ? 'Switch to Sinhala' : 'Switch to English'}
        >
            <Globe size={18} className="text-gray-700" />
            <span className="font-medium text-gray-800 text-sm">
                {isEnglish ? 'සිංහල' : 'English'}
            </span>
        </button>
    );
};

export default LanguageSwitcher;
