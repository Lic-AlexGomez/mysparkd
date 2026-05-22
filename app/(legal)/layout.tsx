import { LegalFooter } from "@/components/layout/legal-footer"

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <LegalFooter />
    </>
  )
}
