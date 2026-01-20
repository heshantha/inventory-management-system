import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import siTranslations from './locales/si.json';

i18n
    .use(LanguageDetector) // Detects user language  
    .use(initReactI18next) // Passes i18n down to react-i18next
    .init({
        resources: {
            en: {
                translation: enTranslations
            },
            si: {
                translation: siTranslations
            }
        },
        fallbackLng: 'en', // Use English if selected language is not available
        debug: false, // Set to true for debugging

        interpolation: {
            escapeValue: false // React already escapes values
        },

        detection: {
            // Order and from where user language should be detected
            order: ['localStorage', 'navigator'],

            // Keys or params to lookup language from
            caches: ['localStorage'],
            lookupLocalStorage: 'language',
        }
    });

export default i18n;
