import type { ReactNode } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { LanguageId } from '@snipit/shared'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useTheme } from '@/app/theme/theme-context'
import { THEME_OPTIONS } from '@/app/theme/theme-options'
import { getErrorMessage, settingsRepository } from '@/db'
import { useLoadSampleData } from '@/features/library/use-load-sample-data'
import { LanguageSelect } from '@/features/snippets/editor/LanguageSelect'
import { useDocumentTitle } from '@/hooks/use-document-title'
import { cn } from '@/lib/utils'
import { useSettings } from '../use-settings'

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <section className="grid gap-4 border-t py-8 first:border-t-0 first:pt-0 md:grid-cols-[minmax(0,16rem)_1fr] md:gap-10">
      <div>
        <h2 className="font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

export function SettingsPage() {
  useDocumentTitle('Settings')
  const { theme, setTheme } = useTheme()
  const settings = useSettings()
  const sampleData = useLoadSampleData()

  const updateDefaultLanguage = async (language: LanguageId) => {
    try {
      await settingsRepository.update({ defaultLanguage: language })
      toast.success('Default language updated')
    } catch (error) {
      toast.error(getErrorMessage(error))
    }
  }

  return (
    <div className="max-w-4xl space-y-8">
      <PageHeader title="Settings" description="Preferences are stored on this device." />

      <div>
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
                    'relative flex flex-col items-center gap-2 rounded-xl border bg-card px-3 py-4 text-sm font-medium transition-colors',
                    'hover:border-foreground/20 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none',
                    isSelected && 'border-primary bg-accent text-accent-foreground hover:border-primary',
                  )}
                >
                  {isSelected && <Check className="absolute top-2 right-2 size-3.5" aria-hidden="true" />}
                  <Icon className="size-5" aria-hidden="true" />
                  {label}
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
          title="Data"
          description="Your snippets are stored locally in this browser and work offline."
        >
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={sampleData.load} disabled={sampleData.isLoading}>
              {sampleData.isLoading && <Loader2 className="animate-spin" aria-hidden="true" />}
              Load sample snippets
            </Button>
            <p className="text-sm text-muted-foreground">
              Adds a few example snippets and collections to explore.
            </p>
          </div>
        </SettingsSection>
      </div>
    </div>
  )
}
