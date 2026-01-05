// React hook for translations
import { useState, useEffect } from "react";
import { t, getLanguage, setLanguage as setLang, type Language } from "../utils/i18n";

export const useTranslation = () => {
  const [lang, setLangState] = useState<Language>(getLanguage());

  useEffect(() => {
    const handleLanguageChange = () => {
      setLangState(getLanguage());
    };

    window.addEventListener("languagechange", handleLanguageChange);
    return () => {
      window.removeEventListener("languagechange", handleLanguageChange);
    };
  }, []);

  return {
    t,
    language: lang,
    setLanguage: (newLang: Language) => {
      setLang(newLang);
      setLangState(newLang);
    },
  };
};

