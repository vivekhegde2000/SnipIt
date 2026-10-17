import { m } from 'motion/react'
import { Code2, Plus, ShieldCheck, Tags, type LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { STAGGER_STEP, TRANSITION } from '@/lib/motion'
import type { NewSnippetTrigger } from '../use-new-snippet'

const HIGHLIGHTS: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Code2,
    title: 'Code and plain text',
    text: 'Shell commands, SQL, code or email templates — with syntax highlighting.',
  },
  {
    icon: Tags,
    title: 'Organised your way',
    text: 'Tag snippets, group them into collections and star your favorites.',
  },
  {
    icon: ShieldCheck,
    title: 'Private by design',
    text: 'Everything stays in this browser. No account, no tracking.',
  },
]

/** Decorative stack of snippet cards, drawn with theme colours so it works in light and dark. */
function WelcomeIllustration() {
  return (
    <svg viewBox="0 0 280 176" className="h-36 w-auto sm:h-40" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="welcome-accent" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect
        x="62"
        y="18"
        width="168"
        height="118"
        rx="16"
        transform="rotate(-7 146 77)"
        className="fill-muted stroke-border"
      />
      <rect
        x="66"
        y="22"
        width="168"
        height="118"
        rx="16"
        transform="rotate(5 150 81)"
        className="fill-card stroke-border"
      />
      <g transform="translate(40 34)">
        <rect width="200" height="128" rx="16" className="fill-card stroke-border" strokeWidth="1.5" />
        <circle cx="20" cy="20" r="4" className="fill-rose-400" />
        <circle cx="33" cy="20" r="4" className="fill-amber-400" />
        <circle cx="46" cy="20" r="4" className="fill-emerald-400" />
        <rect x="20" y="40" width="44" height="8" rx="4" className="fill-(--syntax-keyword)" opacity="0.85" />
        <rect x="70" y="40" width="70" height="8" rx="4" className="fill-(--syntax-function)" opacity="0.7" />
        <rect x="32" y="56" width="58" height="8" rx="4" className="fill-(--syntax-string)" opacity="0.6" />
        <rect x="96" y="56" width="40" height="8" rx="4" className="fill-(--syntax-number)" opacity="0.7" />
        <rect x="32" y="72" width="84" height="8" rx="4" className="fill-muted-foreground" opacity="0.25" />
        <rect x="128" y="94" width="56" height="22" rx="11" fill="url(#welcome-accent)" />
        <path
          d="M146 105.5l4 4 8-8"
          fill="none"
          stroke="#fff"
          strokeWidth="2.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="163" y="101" width="13" height="4" rx="2" fill="#fff" opacity="0.85" />
      </g>
      <circle cx="30" cy="40" r="5" className="fill-primary" opacity="0.35" />
      <circle cx="252" cy="150" r="7" className="fill-primary" opacity="0.2" />
      <circle cx="248" cy="30" r="3" className="fill-primary" opacity="0.5" />
    </svg>
  )
}

/** First-run screen: what SnipIt is for, and one clear action. */
export function LibraryWelcome({ trigger }: { trigger: NewSnippetTrigger }) {
  return (
    <m.section
      aria-labelledby="welcome-title"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={TRANSITION.base}
      className="relative overflow-hidden rounded-3xl border bg-card px-6 py-12 text-center shadow-xs sm:px-10 sm:py-16"
    >
      {/* Soft accent glow behind the illustration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-32 mx-auto h-72 max-w-xl rounded-full bg-primary/15 blur-3xl"
      />
      <m.div
        className="relative mx-auto flex justify-center"
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ ...TRANSITION.pop, delay: 0.05 }}
      >
        <WelcomeIllustration />
      </m.div>

      {/* The page's only heading in this state, so it is the h1. */}
      <h1
        id="welcome-title"
        className="relative mt-6 text-2xl font-semibold tracking-tight text-balance sm:text-3xl"
      >
        Your snippet library is empty
      </h1>
      <p className="relative mx-auto mt-2 max-w-lg text-pretty text-muted-foreground">
        Save the commands, queries and message templates you reuse — then find and copy them in seconds.
      </p>

      <div className="relative mt-7 flex justify-center">
        <Button size="lg" {...trigger.triggerProps}>
          <Plus aria-hidden="true" />
          Create your first snippet
        </Button>
      </div>

      <ul className="relative mx-auto mt-12 grid max-w-4xl gap-4 text-left sm:grid-cols-3">
        {HIGHLIGHTS.map(({ icon: Icon, title, text }, index) => (
          <m.li
            key={title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...TRANSITION.base, delay: 0.15 + index * STAGGER_STEP * 2 }}
            className="rounded-2xl border bg-background/60 p-4"
          >
            <span className="mb-3 grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground">
              <Icon className="size-[18px]" aria-hidden="true" />
            </span>
            <h2 className="text-sm font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{text}</p>
          </m.li>
        ))}
      </ul>
    </m.section>
  )
}
