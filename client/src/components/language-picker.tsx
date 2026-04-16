/**
 * Language Picker — dropdown in the header bar for switching among 15 languages + Braille
 */
import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n";
import { playSound } from "@/lib/sound-engine";

export function LanguagePicker() {
  const { lang, setLang, t, langMeta } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1.5 px-2"
          data-testid="button-language-picker"
          aria-label={t.headerLanguage}
        >
          <Globe className="h-3.5 w-3.5" />
          <span className="text-xs font-medium hidden sm:inline">
            {langMeta.flag} {langMeta.nativeName}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 max-h-80 overflow-y-auto"
        data-testid="dropdown-language-menu"
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          {t.headerLanguage}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {languages.map((l) => (
          <DropdownMenuItem
            key={l.code}
            onClick={() => {
              setLang(l.code);
              playSound("navigate");
            }}
            className={`cursor-pointer gap-3 ${lang === l.code ? "bg-accent" : ""}`}
            data-testid={`button-lang-${l.code}`}
          >
            <span className="text-base w-6 text-center shrink-0">{l.flag}</span>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate">{l.nativeName}</span>
              <span className="text-xs text-muted-foreground">{l.name}</span>
            </div>
            {lang === l.code && (
              <span className="ml-auto text-primary text-xs">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
