import { useState, useRef, useEffect } from 'react'
import { Palette, Check, ChevronDown } from 'lucide-react'
import { THEMES, useThemeStore } from '@/lib/theme'

export default function ThemeSelector() {
  const { theme, setTheme } = useThemeStore()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const activeTheme = THEMES.find((t) => t.id === theme) ?? THEMES[0]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg border border-grid-border bg-grid-panelHover px-3 py-2 text-xs font-medium text-theme-text transition hover:bg-grid-panelHover"
        title="Change UI Color Theme"
      >
        <Palette className="h-4 w-4 text-blue-400" />
        <span className="hidden sm:inline font-semibold">{activeTheme.name}</span>
        {/* Color preview dots */}
        <div className="flex -space-x-1 items-center">
          {activeTheme.colors.map((c, i) => (
            <span
              key={i}
              className="h-2.5 w-2.5 rounded-full ring-1 ring-black"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
        <ChevronDown className={`h-3 w-3 text-theme-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-64 rounded-xl border border-grid-border bg-grid-panel p-2 shadow-2xl z-50 backdrop-blur-md">
          <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-theme-muted">
            Select Color Mode
          </div>
          <div className="space-y-1">
            {THEMES.map((t) => {
              const isSelected = t.id === theme
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id)
                    setIsOpen(false)
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition ${
                    isSelected
                      ? 'bg-blue-600/20 text-theme-text font-semibold border border-blue-500/40'
                      : 'text-theme-muted hover:bg-grid-panelHover hover:text-theme-text'
                  }`}
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{t.name}</span>
                      {isSelected && <Check className="h-3.5 w-3.5 text-blue-400" />}
                    </div>
                    <span className="text-[10px] text-theme-muted">{t.subtitle}</span>
                  </div>

                  {/* Swatches */}
                  <div className="flex -space-x-1 items-center shrink-0 ml-2">
                    {t.colors.map((color, i) => (
                      <span
                        key={i}
                        className="h-3 w-3 rounded-full ring-1 ring-black"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
