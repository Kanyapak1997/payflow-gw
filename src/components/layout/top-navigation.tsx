import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bell,
  BookOpen,
  ExternalLink,
  LifeBuoy,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Plus,
  Search,
  Settings,
  Sun,
  UserRound,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip } from '@/components/ui/tooltip'
import { SandboxBadge } from '@/components/common/misc'
import { SidebarContent } from './app-sidebar'
import { GlobalSearch } from './global-search'
import { merchantUser } from '@/data/merchant'
import { useTheme } from '@/hooks/use-theme'

export function TopNavigation() {
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor

  return (
    <header className="bg-background/85 sticky top-0 z-30 flex h-14 items-center gap-3 border-b px-4 backdrop-blur-md lg:px-6">
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[236px] p-0 sm:max-w-[236px] [&>button]:text-white">
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <button
        type="button"
        onClick={() => setSearchOpen(true)}
        className="border-input bg-muted/50 text-muted-foreground hover:bg-muted focus-visible:ring-ring/30 hidden h-8 w-full max-w-xs items-center gap-2 rounded-md border px-2.5 text-[13px] transition-colors outline-none focus-visible:ring-2 md:flex"
      >
        <Search className="size-3.5" />
        <span className="flex-1 text-left">Search transactions, customers…</span>
        <kbd className="bg-background text-muted-foreground rounded border px-1.5 py-0.5 font-mono text-[10px]">
          /
        </kbd>
      </button>

      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Search"
        onClick={() => setSearchOpen(true)}
      >
        <Search />
      </Button>

      <div className="flex-1" />

      <SandboxBadge className="hidden sm:inline-flex" />

      <Button
        size="sm"
        className="hidden sm:inline-flex"
        onClick={() => navigate('/payments/create')}
      >
        <Plus />
        Create Payment
      </Button>

      <Tooltip content={`Theme: ${theme}`}>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Toggle theme"
          onClick={() => setTheme(theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light')}
        >
          <ThemeIcon />
        </Button>
      </Tooltip>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
            <Bell />
            <span className="bg-primary absolute top-2 right-2.5 size-1.5 rounded-full" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="space-y-2 px-2 py-1.5">
            <p className="text-[13px] font-medium">Sandbox environment</p>
            <p className="text-muted-foreground text-[12.5px] leading-relaxed">
              You are running PayFlow in test mode. Payments are simulated and no real money moves.
            </p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/developers/webhooks">
              <BookOpen />
              View recent webhook deliveries
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="focus-visible:ring-ring/40 flex items-center gap-2 rounded-full outline-none focus-visible:ring-2"
            aria-label="Account menu"
          >
            <span className="bg-primary-subtle text-primary flex size-8 items-center justify-center rounded-full text-[11px] font-semibold">
              {merchantUser.initials}
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <div className="px-2 py-1.5">
            <p className="text-[13px] font-medium">{merchantUser.name}</p>
            <p className="text-muted-foreground text-[12px]">{merchantUser.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link to="/settings">
              <UserRound />
              Business profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/settings">
              <Settings />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/developers/api-keys">
              <ExternalLink />
              API keys
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <LifeBuoy />
            Support (demo only)
          </DropdownMenuItem>
          <DropdownMenuItem disabled>
            <LogOut />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  )
}
