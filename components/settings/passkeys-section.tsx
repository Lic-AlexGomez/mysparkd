"use client"

import { useCallback, useEffect, useState } from "react"
import { Fingerprint, Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ApiError } from "@/lib/api"
import type { UserProfile } from "@/lib/types"
import {
  deletePasskey,
  isPasskeyHostAllowed,
  isPasskeySupported,
  listPasskeys,
  registerPasskey,
  type PasskeyRecord,
} from "@/lib/services/passkey"

type Props = {
  user: UserProfile | null
}

export function PasskeysSection({ user }: Props) {
  const [supported, setSupported] = useState(false)
  const [hostOk, setHostOk] = useState(false)
  const [rows, setRows] = useState<PasskeyRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [registering, setRegistering] = useState(false)

  const userId = user?.userId ? String(user.userId) : ""
  const username = user?.username ?? ""

  const load = useCallback(async () => {
    if (!userId) {
      setRows([])
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      setRows(await listPasskeys())
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    setSupported(isPasskeySupported())
    setHostOk(isPasskeyHostAllowed())
    void load()
  }, [load])

  const handleRegister = async () => {
    if (!userId || !username) return
    setRegistering(true)
    try {
      await registerPasskey({
        userId,
        username,
        displayName: [user?.nombres, user?.apellidos].filter(Boolean).join(" ") || username,
      })
      toast.success("Passkey registrada. Ya puedes usarla para iniciar sesión.")
      await load()
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo registrar la passkey"
      if (!message.toLowerCase().includes("cancel")) {
        toast.error(message)
      }
    } finally {
      setRegistering(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deletePasskey(id)
      toast.success("Passkey eliminada")
      await load()
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo eliminar")
    }
  }

  if (!supported) {
    return (
      <Card className="border-border/60">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Tu navegador no admite passkeys (WebAuthn).
        </CardContent>
      </Card>
    )
  }

  if (!hostOk) {
    return (
      <Card className="border-border/60">
        <CardContent className="pt-6 text-sm text-muted-foreground">
          Las passkeys solo están disponibles en{" "}
          <span className="font-medium text-foreground">mysparkd.com</span> (no en este dominio).
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/60">
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-start gap-3">
          <Fingerprint className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground">Passkeys</p>
            <p className="text-sm text-muted-foreground mt-1">
              Inicia sesión con Face ID, Touch ID o PIN del dispositivo sin contraseña.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tienes passkeys registradas.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.deviceName}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(p.createdAt).toLocaleDateString("es")}
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="shrink-0 text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar passkey?</AlertDialogTitle>
                      <AlertDialogDescription>
                        No podrás iniciar sesión desde &quot;{p.deviceName}&quot; con esta passkey.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => void handleDelete(p.id)}
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </li>
            ))}
          </ul>
        )}

        <Button
          type="button"
          variant="secondary"
          className="w-full"
          disabled={registering || !userId}
          onClick={() => void handleRegister()}
        >
          {registering ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Registrar passkey en este dispositivo
        </Button>
      </CardContent>
    </Card>
  )
}
