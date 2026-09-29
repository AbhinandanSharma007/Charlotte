import { Bot, Send, Zap, User, RefreshCw } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { api } from '@/lib/api'

interface Message {
  role: 'user' | 'assistant'
  text: string
  source?: string
  timestamp: Date
}

const QUICK_PROMPTS = [
  { label: '🔴 Theft Risk', query: 'Which meters have the highest theft risk right now and what should I do?' },
  { label: '🧠 Meter Anomalies', query: 'Classify recent meter anomalies with NVIDIA Kumo and summarize the results.' },
  { label: '⚡ Transformer', query: 'What is the current health and load of transformer DT-001? Does it need inspection?' },
  { label: '🔮 Digital Twin', query: 'Which meter has the highest digital twin deviation and what does it mean?' },
  { label: '💰 Revenue', query: 'How much revenue is at risk from electricity theft? Break it down.' },
  { label: '🚨 Alerts', query: 'Summarize the current grid alerts and their severity levels.' },
  { label: '🤖 ML Model', query: 'Tell me about the active ML model – accuracy, features, and what it detects.' },
  { label: '📊 Grid Status', query: 'Give me a full status report of the smart grid right now.' },
  { label: '🔋 Power Quality', query: 'How is the power quality across the grid? Any THD or power factor issues?' },
]

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      text: "Hello! I'm Charlotte, your Smart Grid AI Assistant. I have live access to your grid data — transformer health, theft predictions, digital twin deviations, alerts, and more. Ask me anything about your grid or type a custom question below.",
      source: 'Charlotte AI',
      timestamp: new Date(),
    },
  ])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (question: string) => {
    if (!question.trim() || loading) return

    const userMsg: Message = { role: 'user', text: question.trim(), timestamp: new Date() }
    setMessages((prev) => [...prev, userMsg])
    setQuery('')
    setLoading(true)

    try {
      const res = await api.assistantQuery(question.trim())
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: res.answer, source: res.source, timestamp: new Date() },
      ])
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `Error: ${err?.message ?? 'Request failed. Please try again.'}`,
          source: 'System',
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(query)
    }
  }

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        text: "Chat cleared. I'm ready for your next question about the grid!",
        source: 'Charlotte AI',
        timestamp: new Date(),
      },
    ])
  }

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-theme-text flex items-center gap-2">
            <img
              src="/frontendpublicspider-logo.png.png"
              alt="Charlotte spider mark"
              className="h-7 w-7 rounded-md bg-black object-contain"
            />
            Charlotte AI Assistant
          </h2>
          <p className="mt-1 text-sm text-theme-muted">
            NVIDIA Kumo Relational · Live meter anomaly classification · Grid context
          </p>
        </div>
        <button
          onClick={clearChat}
          className="flex items-center gap-1.5 rounded-lg border border-grid-border px-3 py-2 text-xs text-theme-muted transition hover:bg-grid-panelHover hover:text-theme-text"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Clear Chat
        </button>
      </div>

      {/* Quick Prompts */}
      <div className="flex flex-wrap gap-2">
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p.label}
            onClick={() => sendMessage(p.query)}
            disabled={loading}
            className="rounded-full border border-grid-border bg-grid-panelHover px-3 py-1.5 text-xs font-medium text-theme-muted transition hover:border-theme-primary hover:text-theme-text disabled:opacity-50"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Chat Window */}
      <div className="panel flex-1 overflow-y-auto space-y-4 scroll-smooth">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                msg.role === 'assistant'
                  ? 'bg-theme-primary/20 text-theme-primary'
                  : 'bg-grid-panelHover text-theme-muted'
              }`}
            >
              {msg.role === 'assistant' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </div>

            {/* Bubble */}
            <div className={`flex max-w-[80%] flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'assistant'
                    ? 'bg-grid-panelHover border border-grid-border text-theme-text'
                    : 'bg-theme-primary/20 border border-theme-primary/30 text-theme-text'
                }`}
              >
                {/* Render newlines */}
                {msg.text.split('\n').map((line, li) => (
                  <span key={li}>
                    {line}
                    {li < msg.text.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-theme-muted">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.source && (
                  <span className="text-[10px] text-theme-primary font-mono opacity-70">· {msg.source}</span>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-theme-primary/20 text-theme-primary">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-xl border border-grid-border bg-grid-panelHover px-4 py-3">
              <div className="flex gap-1 items-center">
                <span className="h-2 w-2 animate-bounce rounded-full bg-theme-primary [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-theme-primary [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-theme-primary [animation-delay:300ms]" />
                <span className="ml-2 text-xs text-theme-muted">Charlotte is thinking…</span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="panel flex gap-3 items-center">
        <Zap className="h-4 w-4 shrink-0 text-theme-primary" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Charlotte anything about your grid… (Enter to send)"
          className="flex-1 bg-transparent text-sm text-theme-text outline-none placeholder:text-theme-muted"
          disabled={loading}
          autoFocus
        />
        <button
          onClick={() => sendMessage(query)}
          disabled={loading || !query.trim()}
          className="flex items-center gap-2 rounded-lg bg-theme-primary px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
          {loading ? 'Sending…' : 'Send'}
        </button>
      </div>
    </div>
  )
}
