import type { NavbarStyle } from "./types"

export type NavbarStyleOption = {
  id: NavbarStyle
  label: string
  description: string
}

/** Estilos de barra inferior disponibles en web (el dock Sparkd sigue siendo el predeterminado). */
export const WEB_NAVBAR_STYLE_OPTIONS: NavbarStyleOption[] = [
  {
    id: "default",
    label: "Sparkd Dock",
    description: "Dock curvo con Eventos en el centro (actual).",
  },
  {
    id: "gradient",
    label: "Neón gradiente",
    description: "Barra plana con degradado cyan–magenta–naranja.",
  },
  {
    id: "glass",
    label: "Glass flotante",
    description: "Pastilla de cristal con iconos en fila.",
  },
  {
    id: "flat",
    label: "Clásica plana",
    description: "Feed, Events, Groups… con punto activo (mockup social).",
  },
  {
    id: "dating-tabs",
    label: "Dating tabs",
    description: "Discover, Likes, Events, Chats, Profile (mockup dating).",
  },
]
