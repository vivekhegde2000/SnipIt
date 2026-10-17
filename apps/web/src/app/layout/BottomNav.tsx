import { NavLink } from 'react-router'
import { cn } from '@/lib/utils'
import { BOTTOM_NAV } from './nav-items'

/** Thumb-friendly primary navigation for phones. */
export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg supports-backdrop-filter:bg-background/75"
    >
      <ul className="mx-auto grid h-(--bottom-nav-height) max-w-md grid-cols-4">
        {BOTTOM_NAV.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                  'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-inset',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'grid h-7 w-12 place-items-center rounded-full transition-colors',
                      isActive && 'bg-accent',
                    )}
                  >
                    <Icon
                      className={cn('size-5', isActive && to === '/favorites' && 'fill-current')}
                      aria-hidden="true"
                    />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
