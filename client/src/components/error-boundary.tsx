/**
 * Error Boundary — catches runtime errors and shows a friendly recovery UI
 * Prevents white-screen-of-death for the entire app.
 * Automatically retries lazy-chunk failures once (cache-bust import).
 */
import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  chunkRetried: boolean;
}

/** Detect lazy-chunk / dynamic-import failures */
function isChunkLoadError(error: Error): boolean {
  const msg = error.message || "";
  return (
    msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Loading chunk") ||
    msg.includes("Loading CSS chunk") ||
    msg.includes("Importing a module script failed") ||
    error.name === "ChunkLoadError"
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, chunkRetried: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error("[ErrorBoundary]", error, info.componentStack);

    // Auto-retry once for chunk failures (stale cache after deploy)
    if (isChunkLoadError(error) && !this.state.chunkRetried) {
      this.setState({ chunkRetried: true, hasError: false, error: null });
      // Force-reload the page to bust cached chunks
      window.location.reload();
    }
  }

  render() {
    if (this.state.hasError) {
      const isChunk = this.state.error ? isChunkLoadError(this.state.error) : false;

      return (
        <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center space-y-4">
          <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-semibold">
            {this.props.fallbackTitle || (isChunk ? "Page failed to load" : "Something went wrong")}
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">
            {this.props.fallbackMessage ||
              (isChunk
                ? "A new version may have been deployed. Try reloading the page."
                : "An unexpected error occurred. Try refreshing the page or navigating back home.")}
          </p>
          {this.state.error && !isChunk && (
            <details className="text-xs text-muted-foreground/60 max-w-md">
              <summary className="cursor-pointer hover:text-foreground transition-colors">
                Error details
              </summary>
              <pre className="mt-2 p-2 bg-muted rounded text-left overflow-auto max-h-32">
                {this.state.error.message}
              </pre>
            </details>
          )}
          <div className="flex gap-2 pt-2">
            {isChunk ? (
              <Button
                size="sm"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                Reload page
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => this.setState({ hasError: false, error: null })}
                >
                  Try again
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    window.location.hash = "#/";
                    this.setState({ hasError: false, error: null });
                  }}
                >
                  Go home
                </Button>
              </>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
