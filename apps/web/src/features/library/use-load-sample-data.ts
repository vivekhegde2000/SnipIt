import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { getErrorMessage, seedSampleData } from '@/db'

/** Adds the sample library with feedback; guards against double clicks. */
export function useLoadSampleData() {
  const [isLoading, setIsLoading] = useState(false)

  const load = useCallback(async () => {
    if (isLoading) return
    setIsLoading(true)
    try {
      const added = await seedSampleData()
      toast.success(`Added ${added} sample snippets`)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not load the sample snippets.'))
    } finally {
      setIsLoading(false)
    }
  }, [isLoading])

  return { load, isLoading }
}
