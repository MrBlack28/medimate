'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { z } from 'zod';

export const LanguageSchema = z.enum(['en', 'hi', 'or']);
export type Language = z.infer<typeof LanguageSchema>;

type Translations = {
  [key: string]: string;
};

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  translations: Translations | null;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [translations, setTranslations] = useState<Translations | null>(null);

  useEffect(() => {
    async function loadTranslations() {
      try {
        const module = await import(`@/locales/${language}.json`);
        setTranslations(module.default);
      } catch (error) {
        console.error(`Could not load translations for ${language}`, error);
        // Fallback to English if loading fails
        const module = await import(`@/locales/en.json`);
        setTranslations(module.default);
      }
    }
    loadTranslations();
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, translations }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
