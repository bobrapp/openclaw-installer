/**
 * i18n — Internationalization system for OpenClaw Guided Install
 * 15 languages + Braille display mode
 * Uses React Context. No localStorage (sandboxed iframe).
 * Language files are split into per-language JSON in src/locales/.
 */
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import enTranslations from "@/locales/en.json";

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

// ── Translation keys ──
// Every UI string gets a key here. Organized by section.
export interface Translations {
  // App chrome
  appName: string;
  installerVersion: string;

  // Sidebar nav
  navNavigation: string;
  navHosts: string;
  navHostSelection: string;
  navCompareFrameworks: string;
  navPreflightRunner: string;
  navInstallLogs: string;
  navAuditLog: string;
  navFoundation: string;
  navHowIBuiltThis: string;
  navReleaseDashboard: string;
  navHostingDeals: string;
  navAgentPatterns: string;
  navSetup: string;
  navMonitor: string;
  navCommunity: string;
  navResources: string;

  // Sidebar hosts
  hostMacOS: string;
  hostDigitalOcean: string;
  hostAzureVM: string;
  hostGenericVPS: string;
  hostHardening: string;
  hostScripts: string;

  // Sidebar footer
  footerSubtitle: string;
  footerHumans: string;
  sidebarCoffee: string;
  sidebarCoffeeDesc: string;

  // Header
  headerSoundOn: string;
  headerSoundOff: string;
  headerLanguage: string;

  // Home page
  homeTitle: string;
  homeSubtitle: string;
  homePreflightChecks: string;
  homePreflightDesc: string;
  homeDryRun: string;
  homeDryRunDesc: string;
  homeHardening: string;
  homeHardeningDesc: string;
  homeStartSetup: string;

  // Patterns page
  patternsTitle: string;
  patternsSubtitle: string;
  patternsOpenSource: string;
  patternsHumanFirst: string;
  patternsGovernanceReady: string;
  patternsWhyMatters: string;
  patternsDownloadYaml: string;
  patternsCopy: string;
  patternsCopied: string;
  patternsViewConfig: string;
  patternsFooter: string;
  patternsFoundationCredit: string;
  patternsTotal?: string;
  patternsSearch?: string;
  patternsAllCategories?: string;
  patternsNoResults?: string;

  // Marketplace page
  navMarketplace: string;
  marketplaceTitle: string;
  marketplaceSubtitle: string;
  marketplaceMcpNative: string;
  marketplaceGovernanceReady: string;
  marketplaceOpenSource: string;
  marketplaceSkillCount: string;
  marketplaceSearch: string;
  marketplaceFooter: string;
  mktFeatured: string;
  mktByProvider: string;
  mktViewConfig: string;
  mktInstall: string;
  mktConfig: string;
  mktCopy: string;
  mktCopied: string;
  mktAllSkills: string;
  mktNoResults: string;
  mktNoResultsHint: string;
  mktCuratedBy: string;
  mktDonationTitle: string;
  mktDonationDesc: string;
  mktDonationPowered: string;
  mktCuratorsTitle: string;
  mktCuratorsDesc: string;
  mktSubmitSkill: string;
  mktSubmitSkillDesc: string;

  // Unified Marketplace page
  unifiedMarketplaceTitle?: string;
  unifiedMarketplaceSubtitle?: string;
  tabAll?: string;
  tabAgents?: string;
  tabConnectors?: string;
  tabHosting?: string;
  tabOneClick?: string;
  mktDeployNow?: string;
  mktEstCost?: string;
  mktIncludes?: string;
  mktSupportsHosts?: string;
  mktViewDetails?: string;

  // Marketplace manage page
  navMarketplaceManage?: string;
  manageTitle?: string;
  manageSubtitle?: string;
  manageAddEntry?: string;
  manageExportYaml?: string;
  manageCopyYaml?: string;
  manageDownloadYaml?: string;
  manageSubmitPr?: string;
  managePreview?: string;

  // 1-Click Deploy Wizard
  navDeployWizard?: string;
  deployWizardTitle?: string;
  deployWizardSubtitle?: string;
  deployStepBundle?: string;
  deployStepHost?: string;
  deployStepInputs?: string;
  deployStepReview?: string;
  deployStepPipeline?: string;
  deployStepComplete?: string;
  deployPermissionTitle?: string;
  deployPermissionDesc?: string;
  deployConfirmBtn?: string;
  deploySkipped?: string;
  deploySuccess?: string;
  deployAnother?: string;

  // Pattern names and taglines
  patGreeterName: string;
  patGreeterTag: string;
  patGuardianName: string;
  patGuardianTag: string;
  patStorytellerName: string;
  patStorytellerTag: string;
  patTeacherName: string;
  patTeacherTag: string;
  patPeacekeeperName: string;
  patPeacekeeperTag: string;
  patCelebratorName: string;
  patCelebratorTag: string;

  // Humans page
  humansFound: string;
  humansBehind: string;
  humansMadeBy: string;
  humansCofounder: string;
  humansBobDesc: string;
  humansKenDesc: string;
  humansBuiltWith: string;
  humansMission: string;
  humansMissionText: string;
  humansLearnMore: string;
  humansGratitudeWall: string;
  humansWelcome: string;

  // Preflight
  preflightTitle: string;
  preflightSubtitle: string;
  preflightRun: string;
  preflightReset: string;
  preflightNoRun: string;
  preflightSelectHost: string;

  // Releases
  releasesTitle: string;
  releasesSubtitle: string;
  releasesRefresh: string;
  releasesGratitude: string;
  releasesGratitudeDesc: string;

  // Celebrations
  celebPreflight1: string;
  celebPreflight2: string;
  celebPreflight3: string;
  celebInstall1: string;
  celebInstall2: string;
  celebGeneral1: string;
  celebGeneral2: string;
  celebGeneral3: string;

  // Misc
  loading: string;
  error: string;
  notFound: string;
  notFoundDesc: string;
  goHome: string;
}

// ── Dynamic language loader ──
// English is always bundled synchronously; all other languages load on demand.
async function loadLanguage(code: LangCode): Promise<Translations> {
  if (code === "en") return enTranslations as Translations;
  try {
    const mod = await import(`../locales/${code}.json`);
    return mod.default as Translations;
  } catch {
    // Fall back to English if the locale file cannot be loaded
    return enTranslations as Translations;
  }
}

// ── Context ──
interface I18nContextType {
  lang: LangCode;
  setLang: (code: LangCode) => void;
  t: Translations;
  dir: "ltr" | "rtl";
  langMeta: LangMeta;
  loading: boolean;
}

export const I18nContext = createContext<I18nContextType>({
  lang: "en",
  setLang: () => {},
  t: enTranslations as Translations,
  dir: "ltr",
  langMeta: languages[0],
  loading: false,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>("en");
  const [t, setT] = useState<Translations>(enTranslations as Translations);
  const [loading, setLoading] = useState(false);
  const reqId = useRef(0);

  const setLang = useCallback((code: LangCode) => {
    const id = ++reqId.current;
    setLoading(true);
    loadLanguage(code).then((translations) => {
      if (id !== reqId.current) return; // Stale — ignore
      setT(translations);
      setLangState(code);
      setLoading(false);
    });
  }, []);

  // Sync dir/lang on mount and on every lang change
  useEffect(() => {
    const meta = languages.find((l) => l.code === lang) || languages[0];
    document.documentElement.dir = meta.dir;
    document.documentElement.lang = lang === "brl" ? "en" : lang;
  }, [lang]);

  const meta = languages.find((l) => l.code === lang) || languages[0];

  const contextValue = useMemo(() => ({
    lang, setLang, t, dir: meta.dir as "ltr" | "rtl", langMeta: meta, loading
  }), [lang, setLang, t, meta, loading]);

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
