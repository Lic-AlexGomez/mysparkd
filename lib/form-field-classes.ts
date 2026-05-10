/** Clases compartidas: mismo «look» que el buscador de dirección (meetups / Fast Date). */

export const FORM_CONTROL_INPUT =
  "h-11 min-h-11 rounded-xl border border-border/60 bg-muted/40 px-3 py-2 shadow-sm transition-[color,box-shadow,background-color] md:text-sm " +
  "placeholder:text-muted-foreground " +
  "focus-visible:border-primary/40 focus-visible:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/35 " +
  "disabled:pointer-events-none disabled:opacity-50"

export const FORM_CONTROL_TEXTAREA =
  "min-h-[92px] w-full rounded-xl border border-border/60 bg-muted/40 px-3 py-3 shadow-sm transition-[color,box-shadow,background-color] resize-none md:text-sm " +
  "placeholder:text-muted-foreground " +
  "focus-visible:border-primary/40 focus-visible:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/35 " +
  "disabled:pointer-events-none disabled:opacity-50"

/** SelectTrigger: ancho completo + altura alineada al Input */
export const FORM_SELECT_TRIGGER =
  "h-11 min-h-11 w-full rounded-xl border border-border/60 bg-muted/40 px-3 shadow-sm transition-[color,box-shadow,background-color] " +
  "focus-visible:border-primary/40 focus-visible:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/35 " +
  "data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground"

export const FORM_CHIP_BASE =
  "inline-flex items-center justify-center rounded-full border px-3 py-2 text-xs font-semibold transition-all active:scale-[0.98]"

export const FORM_CHIP_IDLE =
  "border-border/70 bg-muted/30 text-muted-foreground hover:border-primary/40 hover:bg-muted/55 hover:text-foreground"

export const FORM_CHIP_PRIMARY_ON =
  "border-primary bg-primary text-black shadow-sm dark:text-black"

export const FORM_CHIP_SECONDARY_ON =
  "border-secondary bg-secondary text-black shadow-sm dark:text-black"

export const FORM_LABEL = "text-sm font-medium leading-none text-foreground"

export const FORM_LABEL_OPTIONAL_HINT = "text-xs font-normal text-muted-foreground"
