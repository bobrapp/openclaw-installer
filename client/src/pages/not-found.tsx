import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <p className="text-5xl font-bold text-muted-foreground/20 mb-2">404</p>
      <h1 className="text-lg font-semibold mb-1">Page not found</h1>
      <p className="text-sm text-muted-foreground mb-6">
        The page you're looking for doesn't exist.
      </p>
      <Link href="/">
        <Button size="sm" variant="outline">
          <ArrowLeft className="h-3 w-3 mr-1" />
          Back to host selection
        </Button>
      </Link>
    </div>
  );
}
