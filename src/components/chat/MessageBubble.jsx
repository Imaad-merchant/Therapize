import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'
import { Brain, User } from 'lucide-react'

export function MessageBubble({ message, isStreaming }) {
  const isUser = message.role === 'user'

  return (
    <div
      className={cn('flex gap-3 max-w-[85%]', isUser ? 'ml-auto' : 'mr-auto')}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-1">
          <Brain className="w-4 h-4 text-primary" />
        </div>
      )}

      <div
        className={cn(
          'px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-sm whitespace-pre-wrap'
            : 'bg-card border border-border rounded-2xl rounded-bl-sm'
        )}
      >
        {isUser ? (
          <>
            {message.content}
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 ml-0.5 bg-primary/60 animate-pulse rounded-sm" />
            )}
          </>
        ) : (
          <div className="markdown-body">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <h3 className="text-base font-bold mt-3 mb-2 first:mt-0">{children}</h3>,
                h2: ({ children }) => <h3 className="text-base font-bold mt-3 mb-2 first:mt-0">{children}</h3>,
                h3: ({ children }) => (
                  <h4 className="text-sm font-bold mt-3 mb-1.5 first:mt-0 text-primary/90">
                    {children}
                  </h4>
                ),
                h4: ({ children }) => <h5 className="text-xs font-semibold mt-2 mb-1 uppercase tracking-wider text-muted-foreground">{children}</h5>,
                p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                ul: ({ children }) => <ul className="my-2 space-y-1 pl-1">{children}</ul>,
                ol: ({ children }) => <ol className="my-2 space-y-1 pl-4 list-decimal">{children}</ol>,
                li: ({ children }) => (
                  <li className="flex gap-2 pl-1 marker:text-primary">
                    <span className="text-primary/70 leading-relaxed mt-0.5">•</span>
                    <span className="flex-1 leading-relaxed">{children}</span>
                  </li>
                ),
                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                em: ({ children }) => <em className="italic text-foreground/90">{children}</em>,
                blockquote: ({ children }) => (
                  <blockquote className="my-2 pl-3 border-l-2 border-primary/40 italic text-foreground/80">
                    {children}
                  </blockquote>
                ),
                hr: () => <hr className="my-3 border-border/50" />,
                code: ({ inline, children }) =>
                  inline ? (
                    <code className="px-1 py-0.5 rounded bg-muted text-[0.85em] font-mono">
                      {children}
                    </code>
                  ) : (
                    <pre className="my-2 p-3 rounded-lg bg-muted overflow-x-auto">
                      <code className="text-[0.85em] font-mono">{children}</code>
                    </pre>
                  ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline underline-offset-2 hover:text-primary/80"
                  >
                    {children}
                  </a>
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 ml-0.5 bg-primary/60 animate-pulse rounded-sm align-middle" />
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 mt-1">
          <User className="w-4 h-4 text-secondary-foreground" />
        </div>
      )}
    </div>
  )
}
