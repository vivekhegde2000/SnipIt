import { useState } from 'react'
import { CheckCircle2, Download, Loader2, PlusSquare, Share } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { promptInstall, useInstallState } from './install-prompt'

/** Settings → Install app. Adapts to what the current browser supports. */
export function InstallAppSection() {
  const { canInstall, isInstalled, isIOS } = useInstallState()
  const [isPrompting, setIsPrompting] = useState(false)

  if (isInstalled) {
    return (
      <p className="flex items-center gap-2 text-sm">
        <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
        You're using the installed app.
      </p>
    )
  }

  if (canInstall) {
    const install = async () => {
      setIsPrompting(true)
      const accepted = await promptInstall()
      setIsPrompting(false)
      if (accepted) toast.success('SnipIt installed — find it with your other apps')
    }
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Opens in its own window, launches from your dock or home screen and works fully offline.
        </p>
        <Button onClick={() => void install()} disabled={isPrompting}>
          {isPrompting ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <Download aria-hidden="true" />
          )}
          Install SnipIt
        </Button>
      </div>
    )
  }

  if (isIOS) {
    return (
      <ol className="space-y-2 text-sm">
        <li className="flex items-center gap-2">
          <span className="grid size-6 place-items-center rounded-full bg-muted text-xs font-semibold">
            1
          </span>
          Tap <Share className="size-4" aria-hidden="true" /> <span className="font-medium">Share</span> in
          Safari's toolbar
        </li>
        <li className="flex items-center gap-2">
          <span className="grid size-6 place-items-center rounded-full bg-muted text-xs font-semibold">
            2
          </span>
          Choose <PlusSquare className="size-4" aria-hidden="true" />
          <span className="font-medium">Add to Home Screen</span>
        </li>
      </ol>
    )
  }

  return (
    <p className="text-sm text-muted-foreground">
      Your browser hasn't offered installation yet. In Chrome or Edge, use the install icon in the address
      bar; in Safari on macOS, choose File → Add to Dock.
    </p>
  )
}
