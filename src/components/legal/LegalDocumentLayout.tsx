import { Link } from 'react-router-dom'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { APP_NAME, appCopyright } from '@/constants/app'

export function LegalDocumentLayout({
  title,
  updated,
  children,
}: {
  title: string
  updated: string
  children: React.ReactNode
}) {
  return (
    <div className="stitch-landing stitch-auth-page min-h-dvh bg-[var(--landing-cream,#f7faf4)] text-on-surface">
      <header className="border-b border-primary/10 bg-white/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-margin-mobile py-4 md:px-margin-tablet">
          <Link to="/" className="flex items-center gap-3" aria-label={APP_NAME}>
            <BrandLogo size="sm" className="h-9 w-auto max-w-[80px]" alt="" />
            <span className="text-lg font-bold tracking-tight text-primary">{APP_NAME}</span>
          </Link>
          <Link
            to="/"
            className="text-sm font-semibold text-primary transition-opacity hover:opacity-70"
          >
            Back to home
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-margin-mobile py-10 md:px-margin-tablet md:py-14">
        <p className="mb-3 text-xs font-bold tracking-[0.18em] text-primary/60 uppercase">Legal</p>
        <h1 className="mb-2 text-3xl font-extrabold tracking-tight text-primary md:text-4xl">{title}</h1>
        <p className="mb-10 text-sm text-on-surface-variant">Last updated: {updated}</p>
        <div className="legal-prose space-y-8 text-[15px] leading-relaxed text-on-surface-variant [&_h2]:text-xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:text-on-surface [&_li]:ms-5 [&_li]:list-disc [&_li]:marker:text-primary/50 [&_strong]:font-semibold [&_strong]:text-on-surface [&_ul]:space-y-2">
          {children}
        </div>
      </main>

      <footer className="mt-auto border-t border-primary/10 px-margin-mobile py-8 md:px-margin-tablet">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-3">
            <Link to="/terms" className="text-xs font-bold text-primary hover:opacity-70">
              Terms &amp; Conditions
            </Link>
            <span className="h-1 w-1 rounded-full bg-primary/20" />
            <Link to="/privacy" className="text-xs font-bold text-primary hover:opacity-70">
              Privacy Policy
            </Link>
          </div>
          <p className="text-xs tracking-[0.18em] text-on-surface-variant/50 uppercase">{appCopyright()}</p>
        </div>
      </footer>
    </div>
  )
}
