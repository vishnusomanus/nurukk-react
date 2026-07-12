import { useNavigate } from 'react-router-dom'
import { useThemeStore } from '@/store/themeStore'
import { useSidebarStore } from '@/store/sidebarStore'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/hooks/useAuth'
import { useRoleNav } from '@/hooks/useRoleNav'
import { getLogoutRedirectPath } from '@/utils/authPaths'
import { Moon, Sun, Menu, LogOut } from 'lucide-react'

export function Header() {
  const navigate = useNavigate()
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)
  const toggleSidebar = useSidebarStore((s) => s.toggle)
  const logout = useAuth((s) => s.logout)
  const { user, isAdmin, isBuyer, isSeller } = useRoleNav()

  const title = isAdmin ? 'Admin' : isBuyer ? 'Buyer' : isSeller ? 'Seller' : 'Dashboard'

  const onLogout = async () => {
    const role = user?.role
    await logout()
    navigate(getLogoutRedirectPath(undefined, role), { replace: true })
  }

  return (
    <div className="flex items-center justify-between rounded-xl border border-black/10 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/5 dark:shadow-none">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="md:hidden" onClick={toggleSidebar}>
          <Menu className="h-4 w-4" />
        </Button>
        <div className="text-sm font-semibold">{title}</div>
        {user?.role ? (
          <div className="ml-2 rounded-full bg-zinc-900/5 px-2 py-0.5 text-xs text-zinc-700 dark:bg-white/10 dark:text-white/70">
            {user.role}
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => void onLogout()}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}
