import type { ReactNode } from 'react'
import { m } from 'motion/react'
import { Keyboard } from 'lucide-react'
import { toast } from 'sonner'
import type { LanguageId } from '@snipit/shared'
import { Kbd } from '@/components/Kbd'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useAppCommands } from '@/features/commands/commands-context'
import { useTheme } from '@/app/theme/theme-context'
import { THEME_OPTIONS } from '@/app/theme/theme-options'
import { getErrorMessage, settingsRepository } from '@/db'
import { useLibrary } from '@/features/library/library-context'
import { LanguageSelect } from '@/features/snippets/editor/LanguageSelect'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { TRANSITION } from '@/lib/motion'
import { cn } from '@/lib/utils'
import { DeleteAllDataDialog } from '../components/DeleteAllDataDialog'
import { useSettings } from '../use-settings'

type SettingsSectionProps = {
  title: string
  description: string
  tone?: 'default' | 'danger'
  children: ReactNode
}

function SettingsSection({ title, description, tone = 'default', children }: SettingsSectionProps) {
  return (
    <section
      className={cn(
        'grid gap-5 rounded-2xl border bg-card p-5 shadow-xs sm:p-6 md:grid-cols-[minmax(0,15rem)_1fr] md:gap-10',
        tone === 'danger' && 'border-destructive/30',
      )}
    >
      <div>
        <h2 className={cn('font-semibold', tone === 'danger' && 'text-destructive')}>{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="min-w-0 self-center">{children}</div>
    </section>
  )
}

export function SettingsPage() {
  useDocumentTitle('Settings')
  const { theme, setTheme } = useTheme()
  const settings = useSettings()
  const { counts, collections } = useLibrary()
  const { openShortcuts } = useAppCommands()

  const updateDefaultLanguage = async (language: LanguageId) => {
    try {
      await settingsRepository.update({ defaultLanguage: language })
      toast.success('Default language updated')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    // Settings is a reading/form page: keep a comfortable width, aligned with the page header.
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Settings" description="Preferences and data are stored only on this device." />

      <div className="space-y-4">
        <SettingsSection title="Appearance" description="Choose a theme, or follow your system setting.">
          <div role="radiogroup" aria-label="Theme" className="grid grid-cols-3 gap-3 sm:max-w-md">
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
              const isSelected = theme === value
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setTheme(value)}
                  className={cn(
                    'relative flex flex-col items-center gap-2 rounded-xl border bg-background px-3 py-4 text-sm font-medium transition-[color,border-color] duration-200',
                    'hover:border-foreground/20 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                    isSelected ? 'border-transparent text-accent-foreground' : 'text-muted-foreground',
                  )}
                >
                  {isSelected && (
                    <m.span
                      layoutId="theme-option-indicator"
                      transition={TRANSITION.indicator}
                      aria-hidden="true"
                      className="absolute inset-0 rounded-xl border border-primary bg-accent"
                    />
                  )}
                  <Icon className="relative size-5" aria-hidden="true" />
                  <span className="relative">{label}</span>
                </button>
              )
            })}
          </div>
        </SettingsSection>

        <SettingsSection title="Editor" description="Defaults used when you create a new snippet.">
          <div className="grid max-w-xs gap-2">
            <Label htmlFor="default-language">Default language</Label>
            <LanguageSelect
              id="default-language"
              value={settings.defaultLanguage}
              onChange={updateDefaultLanguage}
            />
          </div>
        </SettingsSection>

        <SettingsSection
          title="Keyboard shortcuts"
          description="Find, copy and manage snippets without leaving the keyboard."
        >
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={openShortcuts}>
              <Keyboard aria-hidden="true" />
              View all shortcuts
            </Button>
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              or press <Kbd keys={['?']} /> anywhere
            </span>
          </div>
        </SettingsSection>

        <SettingsSection
          title="Danger zone"
          description="Remove everything stored by SnipIt in this browser and start fresh."
          tone="danger"
        >
          <DeleteAllDataDialog snippetCount={counts.all} collectionCount={collections.length} />
        </SettingsSection>
      </div>
    </div>
  )
}
