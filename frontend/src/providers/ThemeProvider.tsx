import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/store'
import { setTheme } from '@/store/slices/uiSlice'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useSelector((state: RootState) => state.ui)
  const dispatch = useDispatch()

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (savedTheme && savedTheme !== theme) {
      // Sync localStorage with Redux if they differ
      dispatch(setTheme(savedTheme))
    }
  }, [theme, dispatch])

  // Apply theme to document whenever it changes
  useEffect(() => {
    const root = document.documentElement
    
    // Remove existing theme classes
    root.classList.remove('dark', 'light')
    
    // Add current theme class
    root.classList.add(theme)
    
    // Store theme preference
    localStorage.setItem('theme', theme)
    
    // Also set data-theme attribute for additional targeting
    root.setAttribute('data-theme', theme)
    
    // Add theme to body for additional specificity
    document.body.classList.remove('dark', 'light')
    document.body.classList.add(theme)
  }, [theme])

  return <>{children}</>
}
