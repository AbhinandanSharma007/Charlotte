import { create } from 'zustand'

export type ThemeMode = 'spiderman' | 'cyberpunk' | 'professional' | 'dark' | 'light'

export interface ThemeConfig {
  id: ThemeMode
  name: string
  subtitle: string
  colors: string[] // preview swatches [primary, accent1, accent2]
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'spiderman',
    name: 'Spider-Man',
    subtitle: 'Pitch Black, Web Red & Electric Blue',
    colors: ['#090a0f', '#ef4444', '#2563eb'],
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    subtitle: 'Neon Void, Electric Yellow & Cyan',
    colors: ['#090314', '#ffe600', '#00f0ff'],
  },
  {
    id: 'professional',
    name: 'Professional',
    subtitle: 'Black, Blue, White & Alert Red',
    colors: ['#080c14', '#3b82f6', '#ffffff', '#ef4444'],
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    subtitle: 'Deep Slate, Charcoal & Emerald',
    colors: ['#0b0f19', '#1e293b', '#38bdf8'],
  },
  {
    id: 'light',
    name: 'Light Mode',
    subtitle: 'Crisp Alabaster, Clean Slate & Indigo',
    colors: ['#f8fafc', '#ffffff', '#2563eb'],
  },
]

interface ThemeStore {
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
}

const STORAGE_KEY = 'charlotte-color-theme'

export function getInitialTheme(): ThemeMode {
  const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null
  if (saved && ['spiderman', 'cyberpunk', 'professional', 'dark', 'light'].includes(saved)) {
    return saved
  }
  return 'professional' // High-clarity default requested by user
}

export function applyThemeToDOM(theme: ThemeMode) {
  const root = document.documentElement
  root.classList.remove('theme-spiderman', 'theme-cyberpunk', 'theme-professional', 'theme-dark', 'theme-light')
  root.classList.add(`theme-${theme}`)
  root.setAttribute('data-theme', theme)
  localStorage.setItem(STORAGE_KEY, theme)
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: getInitialTheme(),
  setTheme: (theme: ThemeMode) => {
    applyThemeToDOM(theme)
    set({ theme })
  },
}))
