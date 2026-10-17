import { useState } from 'react'
import { Link } from 'react-router'
import { Menu } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Sidebar } from './Sidebar'
import { ThemeToggle } from './ThemeToggle'

/** Top bar for phones: drawer menu, logo, theme. */
export function MobileHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 pt-[env(safe-area-inset-top)] backdrop-blur-lg supports-backdrop-filter:bg-background/70">
      <div className="flex h-14 items-center gap-1 px-2">
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="size-5" aria-hidden="true" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-[min(20rem,85vw)] gap-0 bg-sidebar p-0 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
          >
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <SheetDescription className="sr-only">Navigate your snippet library.</SheetDescription>
            <Sidebar variant="full" onNavigate={() => setIsMenuOpen(false)} />
          </SheetContent>
        </Sheet>

        <Link
          to="/"
          className="rounded-lg px-1 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
        >
          <Logo />
        </Link>

        <ThemeToggle className="ml-auto" />
      </div>
    </header>
  )
}
