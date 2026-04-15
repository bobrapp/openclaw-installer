/**
 * Sound Toggle — sidebar control for ambient sound mode
 * Muted by default. User opts in with a single click.
 */
import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { setSoundEnabled, isSoundEnabled, playSound } from "@/lib/sound-engine";

export function SoundToggle() {
  const [enabled, setEnabled] = useState(isSoundEnabled());

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    setSoundEnabled(next);
    if (next) {
      playSound("success");
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="h-7 w-7"
          data-testid="button-sound-toggle"
          aria-label={enabled ? "Mute sounds" : "Enable sounds"}
        >
          {enabled ? (
            <Volume2 className="h-3.5 w-3.5 text-primary" />
          ) : (
            <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">
        <p className="text-xs">{enabled ? "Sound on — click to mute" : "Sound off — click to enable"}</p>
      </TooltipContent>
    </Tooltip>
  );
}
