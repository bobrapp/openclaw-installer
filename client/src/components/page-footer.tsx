/**
 * PageFooter — Shared footer section used by Patterns and Marketplace pages.
 * Renders a centered footnote with an optional foundation credit link.
 */
export interface PageFooterProps {
  text: string;
  /** Label prefix like "A project of the" or "Curated by the" */
  foundationCredit?: string;
}

export function PageFooter({ text, foundationCredit }: PageFooterProps) {
  return (
    <div className="text-center py-6 border-t border-border">
      <p className="text-xs text-muted-foreground">{text}</p>
      {foundationCredit && (
        <p className="text-xs text-muted-foreground/60 mt-1">
          {foundationCredit}{" "}
          <a
            href="https://www.aigovopsfoundation.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary transition-colors"
          >
            AiGovOps Foundation
          </a>
        </p>
      )}
    </div>
  );
}
