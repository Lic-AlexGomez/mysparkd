"use client"

import { Sparkles } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SPARKY_COPY } from "@/lib/sparky-copy"
import { useSparkyWebOptional } from "@/lib/hooks/use-sparky-web"
import type { SparkyMode } from "@/lib/help-assistant"
import { DEFAULT_SPARKY_AI_SETTINGS, DEFAULT_SPARKY_LIFE_SETTINGS } from "@/lib/help-assistant"

export function SparkySettingsSection() {
  const sparky = useSparkyWebOptional()
  if (!sparky?.loaded) return null

  const { settings, patchSettings, setSparkyMode } = sparky
  const life = settings.sparkyLife ?? DEFAULT_SPARKY_LIFE_SETTINGS

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          {SPARKY_COPY.settings.section}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label>{SPARKY_COPY.settings.enable}</Label>
            <p className="text-xs text-muted-foreground">{SPARKY_COPY.settings.enableSub}</p>
          </div>
          <Switch checked={settings.enabled} onCheckedChange={() => sparky.toggleEnabled()} />
        </div>

        <div className="flex items-center justify-between">
          <Label>Ayuda automática</Label>
          <Switch
            checked={settings.autoShow}
            disabled={!settings.enabled}
            onCheckedChange={(v) => sparky.setAutoShow(v)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Tips contextuales</Label>
          <Switch
            checked={settings.contextualTipsEnabled}
            disabled={!settings.enabled}
            onCheckedChange={(v) => patchSettings({ contextualTipsEnabled: v })}
          />
        </div>

        <div className="space-y-2">
          <Label>Modo Sparky</Label>
          <Select
            value={settings.sparkyMode ?? "companion"}
            onValueChange={(v) => setSparkyMode(v as SparkyMode)}
            disabled={!settings.enabled}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="companion">Companion — mascota discreta</SelectItem>
              <SelectItem value="coach">Coach — más sugerencias</SelectItem>
              <SelectItem value="quiet">Quiet — casi invisible</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <Label>Animaciones idle</Label>
          <Switch
            checked={life.allowIdleAnimations}
            disabled={!settings.enabled}
            onCheckedChange={(v) =>
              patchSettings({ sparkyLife: { ...life, allowIdleAnimations: v } })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>IA de Sparky</Label>
          <Switch
            checked={settings.sparkyAI?.enabled ?? false}
            disabled={!settings.enabled}
            onCheckedChange={(v) =>
              patchSettings({
                sparkyAI: { ...(settings.sparkyAI ?? DEFAULT_SPARKY_AI_SETTINGS), enabled: v },
              })
            }
          />
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => patchSettings({ dismissedRoutes: [], contextualTipsAcknowledgedRoutes: [] })}
        >
          Restablecer pantallas ocultas
        </Button>
      </CardContent>
    </Card>
  )
}
