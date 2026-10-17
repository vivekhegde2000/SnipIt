import { NavLink } from 'react-router'
import { LayoutGroup, m } from 'motion/react'
import { TRANSITION } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { BOTTOM_NAV } from './nav-items'

/** Thumb-friendly primary navigation for phones; the active pill slides between tabs. */
export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg supports-backdrop-filter:bg-background/75"
    >
      <LayoutGroup id="bottom-nav">
        <ul className="mx-auto grid h-(--bottom-nav-height) max-w-md grid-cols-4">
          {BOTTOM_NAV.map(({ to, label, icon: Icon, end }) => (
            <li key={to} className="flex">
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors duration-150 select-none',
                    'focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none focus-visible:ring-inset',
                    isActive ? 'text-primary' : 'text-muted-foreground active:text-foreground',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className="relative grid h-7 w-14 place-items-center">
                      {isActive && (
                        <m.span
                          layoutId="bottom-nav-pill"
                          transition={TRANSITION.indicator}
                          aria-hidden="true"
                          className="absolute inset-0 rounded-full bg-accent"
                        />
                      )}
                      <Icon
                        className={cn('relative size-5', isActive && to === '/favorites' && 'fill-current')}
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
      </LayoutGroup>
    </nav>
  )
}
