'use client';

import React, { createContext, useContext, useEffect, useState, useTransition } from 'react';

import { SELLER_DICTIONARY, SELLER_LANGUAGES, SellerLanguage } from '../i18n/seller-dictionary';

interface SellerLanguageContextType {
  language: SellerLanguage;
  setLanguage: (lang: SellerLanguage) => void;
  t: (path: string, fallback?: string) => string;
  isInitialPromptNeeded: boolean;
  dismissInitialPrompt: () => void;
}

const SellerLanguageContext = createContext<SellerLanguageContextType | undefined>(undefined);

const STORAGE_KEY = 'seller_preferred_language';
const PROMPT_SEEN_KEY = 'seller_lang_prompt_seen';

export function SellerLanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SellerLanguage>('hinglish');
  const [isInitialPromptNeeded, setIsInitialPromptNeeded] = useState<boolean>(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as SellerLanguage | null;
      if (stored && ['en', 'hinglish', 'hi'].includes(stored)) {
        setLanguageState(stored);
      } else {
        // If no preference stored yet, prompt the seller once
        const seen = localStorage.getItem(PROMPT_SEEN_KEY);
        if (!seen) {
          setIsInitialPromptNeeded(true);
        }
      }
    } catch {
      // In case localStorage is blocked or SSR
    }
  }, []);

  const setLanguage = (newLang: SellerLanguage) => {
    startTransition(() => {
      setLanguageState(newLang);
    });
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      localStorage.setItem(PROMPT_SEEN_KEY, 'true');
      document.cookie = `seller_language=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // ignore storage errors
    }
    setIsInitialPromptNeeded(false);
  };

  const dismissInitialPrompt = () => {
    setIsInitialPromptNeeded(false);
    try {
      localStorage.setItem(PROMPT_SEEN_KEY, 'true');
    } catch {}
  };

  /**
   * Helper function to get localized string from dot-notation key (e.g. "form.productTitle")
   */
  const t = (path: string, fallback?: string): string => {
    const parts = path.split('.');
    let current: any = SELLER_DICTIONARY;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return fallback || path;
      }
    }

    if (current && typeof current === 'object') {
      return current[language] || current['hinglish'] || current['en'] || fallback || path;
    }

    if (typeof current === 'string') {
      return current;
    }

    return fallback || path;
  };

  return (
    <SellerLanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isInitialPromptNeeded,
        dismissInitialPrompt,
      }}
    >
      {children}
    </SellerLanguageContext.Provider>
  );
}

export function useSellerLanguage() {
  const context = useContext(SellerLanguageContext);
  if (!context) {
    throw new Error('useSellerLanguage must be used within a SellerLanguageProvider');
  }
  return context;
}
