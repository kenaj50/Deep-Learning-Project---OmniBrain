import { Bot, User, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import type { UIMessage } from 'ai'

const TOOL_LABELS: Record<string, string> = {
  createTask:       '✅ Tworzę task',
  updateTaskStatus: '🔄 Aktualizuję status',
  listTasks:        '📋 Pobieram taski',
  logWellbeing:     '💤 Loguję wellbeing',
  getDailyBriefing: '📊 Generuję briefing dnia',
}

interface Props {
  message: UIMessage
  isStreaming?: boolean
}

export function MessageBubble({ message, isStreaming }: Props) {
  const isUser = message.role === 'user'

  // Extract text content from parts
  const textParts = message.parts.filter((p) => p.type === 'text')
  const toolParts = message.parts.filter(
    (p) => p.type === 'dynamic-tool' || p.type.startsWith('tool-')
  ) as Array<{
    type: string
    toolName?: string
    state?: string
    output?: { success?: boolean; error?: string; title?: string }
  }>

  const textContent = textParts
    .map((p) => (p as { type: 'text'; text: string }).text)
    .join('')

  return (
    <div className={`flex gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
          isUser ? 'bg-indigo-600' : 'bg-zinc-800 border border-zinc-700'
        }`}
      >
        {isUser
          ? <User size={13} className="text-white" />
          : <Bot size={13} className="text-indigo-400" />
        }
      </div>

      {/* Content */}
      <div className={`max-w-[82%] flex flex-col gap-1.5 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Tool invocation badges */}
        {toolParts.length > 0 && (
          <div className="flex flex-col gap-1">
            {toolParts.map((part, i) => {
              const toolName = part.toolName ?? part.type.replace('tool-', '')
              const isDone = part.state === 'output-available'
              const hasError = isDone && part.output?.success === false

              return (
                <div
                  key={i}
                  className={`flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1.5 border ${
                    hasError
                      ? 'bg-red-500/10 border-red-500/20 text-red-400'
                      : isDone
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                      : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                  }`}
                >
                  {hasError
                    ? <AlertCircle size={11} />
                    : isDone
                    ? <CheckCircle2 size={11} />
                    : <Loader2 size={11} className="animate-spin" />
                  }
                  <span>
                    {TOOL_LABELS[toolName] ?? toolName}
                    {isDone && !hasError && part.output?.title ? `: ${part.output.title}` : ''}
                    {hasError && part.output?.error ? `: ${part.output.error}` : ''}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        {/* Text content */}
        {(textContent || isStreaming) && (
          <div
            className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
              isUser
                ? 'bg-indigo-600 text-white rounded-tr-sm'
                : 'bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-tl-sm'
            }`}
          >
            {textContent}
            {isStreaming && !textContent && toolParts.length === 0 && (
              <span className="flex items-center gap-1.5 text-zinc-500">
                <Loader2 size={12} className="animate-spin" />
                <span className="text-xs">Myślę...</span>
              </span>
            )}
            {isStreaming && textContent && (
              <span className="inline-block w-0.5 h-3.5 bg-indigo-400 ml-0.5 align-middle animate-pulse" />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
