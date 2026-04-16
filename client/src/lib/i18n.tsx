/**
 * i18n — Internationalization system for OpenClaw Installer
 * 15 languages + Braille display mode
 * Uses React Context. No localStorage (sandboxed iframe).
 * Translations loaded from per-language JSON files in /locales/.
 */
import { createContext, useContext, useState, useCallback } from "react";

// ── Language codes and metadata ──
export type LangCode =
  | "en" | "fr" | "de" | "zh" | "pt" | "hi" | "es"
  | "ar" | "ru" | "tr" | "ur" | "ps" | "sw" | "chr" | "brl";

export interface LangMeta {
  code: LangCode;
  name: string;        // English name
  nativeName: string;  // Native script name
  dir: "ltr" | "rtl";
  flag: string;        // Emoji flag or symbol
}

export const languages: LangMeta[] = [
  { code: "en",  name: "English",              nativeName: "English",        dir: "ltr", flag: "🇺🇸" },
  { code: "fr",  name: "French",               nativeName: "Français",       dir: "ltr", flag: "🇫🇷" },
  { code: "de",  name: "German",               nativeName: "Deutsch",        dir: "ltr", flag: "🇩🇪" },
  { code: "zh",  name: "Chinese (Simplified)", nativeName: "简体中文",         dir: "ltr", flag: "🇨🇳" },
  { code: "pt",  name: "Portuguese",           nativeName: "Português",      dir: "ltr", flag: "🇧🇷" },
  { code: "hi",  name: "Hindi",                nativeName: "हिन्दी",            dir: "ltr", flag: "🇮🇳" },
  { code: "es",  name: "Spanish",              nativeName: "Español",        dir: "ltr", flag: "🇪🇸" },
  { code: "ar",  name: "Arabic",               nativeName: "العربية",         dir: "rtl", flag: "🇸🇦" },
  { code: "ru",  name: "Russian",              nativeName: "Русский",        dir: "ltr", flag: "🇷🇺" },
  { code: "tr",  name: "Turkish",              nativeName: "Türkçe",         dir: "ltr", flag: "🇹🇷" },
  { code: "ur",  name: "Urdu",                 nativeName: "اردو",            dir: "rtl", flag: "🇵🇰" },
  { code: "ps",  name: "Pashto",               nativeName: "پښتو",            dir: "rtl", flag: "🇦🇫" },
  { code: "sw",  name: "Swahili",              nativeName: "Kiswahili",      dir: "ltr", flag: "🇰🇪" },
  { code: "chr", name: "Cherokee",             nativeName: "ᏣᎳᎩ",           dir: "ltr", flag: "🪶" },
  { code: "brl", name: "Braille",              nativeName: "⠃⠗⠇",            dir: "ltr", flag: "⠃" },
];

// ── Translation type (keys shared across all languages) ──
export type Translations = Record<string, string>;

// ── Import all locale JSON files ──
import en from "@/locales/en.json";
import fr from "@/locales/fr.json";
import de from "@/locales/de.json";
import zh from "@/locales/zh.json";
import pt from "@/locales/pt.json";
import hi from "@/locales/hi.json";
import es from "@/locales/es.json";
import ar from "@/locales/ar.json";
import ru from "@/locales/ru.json";
import tr from "@/locales/tr.json";
import ur from "@/locales/ur.json";
import ps from "@/locales/ps.json";
import sw from "@/locales/sw.json";
import chr from "@/locales/chr.json";
import brl from "@/locales/brl.json";

// ── All translations map ──
const allTranslations: Record<LangCode, Translations> = {
  en, fr, de, zh, pt, hi, es, ar, ru, tr, ur, ps, sw, chr, brl,
};

// ── Context ──
interface I18nContextType {
  lang: LangCode;
  setLang: (code: LangCode) => void;
  t: Translations;
  dir: "ltr" | "rtl";
  langMeta: LangMeta;
}

const I18nContext = createContext<I18nContextType>({
  lang: "en",
  setLang: () => {},
  t: en,
  dir: "ltr",
  langMeta: languages[0],
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("en");

  const setLang = useCallback((code: LangCode) => {
    setLangState(code);
    const meta = languages.find((l) => l.code === code) || languages[0];
    document.documentElement.dir = meta.dir;
    document.documentElement.lang = code === "brl" ? "en" : code;
  }, []);

  const meta = languages.find((l) => l.code === lang) || languages[0];
  const t = allTranslations[lang] || en;

  return (
    <I18nContext.Provider value={{ lang, setLang, t, dir: meta.dir, langMeta: meta }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
