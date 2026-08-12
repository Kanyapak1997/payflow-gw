import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronsUpDown, Store } from 'lucide-react'
import { developerNav, primaryNav, settingsNav, type NavItem } from '@/routes/nav'
import { PayFlowLogo } from '@/components/common/brand-marks'
import { merchantUser } from '@/data/merchant'
import { useSettingsStore } from '@/stores/settings-store'
import { cn } from '@/lib/utils'

function isActive(pathname: string, item: NavItem) {
  return item.matchPrefix ? pathname.startsWith(item.to) : pathname === item.to
}

function NavRow({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={!item.matchPrefix}
      onClick={onNavigate}
      className={({ isActive: active }) =>
        cn(
          'group relative flex items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13.5px] font-medium transition-colors outline-none',
          'focus-visible:ring-sidebar-ring focus-visible:ring-2',
          active
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
        )
      }
    >
      {({ isActive: active }) => (
        <>
          <span
            aria-hidden
            className={cn(
              'bg-primary absolute top-1/2 -left-2.5 h-4 w-[3px] -translate-y-1/2 rounded-r-full transition-opacity',
              active ? 'opacity-100' : 'opacity-0',
            )}
          />
          <Icon className="size-[17px] shrink-0" strokeWidth={active ? 2.2 : 1.9} />
          <span className="truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  )
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation()
  const settings = useSettingsStore((state) => state.settings)
  const [developersOpen, setDevelopersOpen] = useState(
    location.pathname.startsWith('/developers'),
  )

  return (
    <div className="bg-sidebar flex h-full flex-col">
      <div className="flex h-14 items-center px-4">
        <NavLink to="/dashboard" onClick={onNavigate} className="rounded outline-none">
          <PayFlowLogo tone="light" />
        </NavLink>
      </div>

      <nav className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto px-3.5 py-3">
        {primaryNav.map((item) => (
          <NavRow key={item.to} item={item} onNavigate={onNavigate} />
        ))}

        <div className="pt-4">
          <button
            type="button"
            onClick={() => setDevelopersOpen((prev) => !prev)}
            aria-expanded={developersOpen}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-md px-2.5 py-[7px] text-[13.5px] font-medium transition-colors outline-none',
              'focus-visible:ring-sidebar-ring focus-visible:ring-2',
              isActive(location.pathname, developerNav)
                ? 'text-sidebar-accent-foreground'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground',
            )}
          >
            <developerNav.icon className="size-[17px] shrink-0" strokeWidth={1.9} />
            <span className="flex-1 text-left">{developerNav.label}</span>
            <ChevronDown
              className={cn('size-4 transition-transform duration-200', developersOpen && 'rotate-180')}
            />
          </button>

          {developersOpen && (
            <div className="border-sidebar-border mt-0.5 ml-[19px] space-y-0.5 border-l pl-3">
              {developerNav.children?.map((child) => (
                <NavRow key={child.to} item={child} onNavigate={onNavigate} />
              ))}
            </div>
          )}
        </div>

        <div className="pt-4">
          <NavRow item={settingsNav} onNavigate={onNavigate} />
        </div>
      </nav>

      <div className="border-sidebar-border border-t p-3">
        <div className="bg-sidebar-accent/50 flex items-center gap-2.5 rounded-lg px-2.5 py-2">
          <span className="bg-primary/15 text-primary flex size-8 shrink-0 items-center justify-center rounded-md">
            <Store className="size-4" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sidebar-accent-foreground truncate text-[13px] font-medium">
              {settings.checkoutDisplayName}
            </p>
            <p className="text-warning flex items-center gap-1 text-[11px] font-medium">
              <span className="bg-warning size-1.5 rounded-full" />
              Sandbox Mode
            </p>
          </div>
          <ChevronsUpDown className="text-sidebar-foreground/60 size-3.5 shrink-0" />
        </div>

        <div className="mt-1.5 flex items-center gap-2.5 rounded-lg px-2.5 py-2">
          <span className="bg-sidebar-accent text-sidebar-accent-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold">
            {merchantUser.initials}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sidebar-accent-foreground truncate text-[13px] font-medium">
              {merchantUser.name}
            </p>
            <p className="text-sidebar-foreground/70 truncate text-[11px]">{merchantUser.email}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AppSidebar() {
  return (
    <aside className="border-sidebar-border hidden w-[236px] shrink-0 border-r lg:block">
      <div className="fixed inset-y-0 left-0 w-[236px]">
        <SidebarContent />
      </div>
    </aside>
  )
}
