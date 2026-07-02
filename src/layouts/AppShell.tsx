import { Outlet } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import type { ReactNode } from 'react'

export function AppShell({ sidebar }: { sidebar: ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto flex w-full max-w-[1400px] gap-4 px-3 py-3 md:px-6 md:py-6">
        {sidebar}
        <div className="min-w-0 flex-1">
          <Header />
          <main className="mt-4 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
