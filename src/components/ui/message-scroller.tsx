"use client"

import * as React from "react"
import { cn } from "cn"
import { ArrowDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

/*
 * Same component names as the shadcn message-scroller, without the
 * @shadcn/react runtime: a viewport that sticks to the bottom while new
 * messages arrive, and a "jump down" button once the reader scrolls up.
 */
const Ctx = React.createContext<{ atBottom: boolean; setAtBottom: (v: boolean) => void; viewportRef: React.RefObject<HTMLDivElement | null> } | null>(null)

function MessageScrollerProvider({ children }: { children: React.ReactNode; autoScroll?: boolean }) {
  const [atBottom, setAtBottom] = React.useState(true)
  const viewportRef = React.useRef<HTMLDivElement>(null)
  return <Ctx.Provider value={{ atBottom, setAtBottom, viewportRef }}>{children}</Ctx.Provider>
}

function MessageScroller({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="message-scroller" className={cn("group/message-scroller relative flex size-full min-h-0 flex-col overflow-hidden", className)} {...props} />
}

function MessageScrollerViewport({ className, children, ...props }: React.ComponentProps<"div">) {
  const ctx = React.useContext(Ctx)
  const viewportRef = ctx?.viewportRef
  const atBottom = ctx?.atBottom ?? true
  React.useEffect(() => {
    const el = viewportRef?.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight })
    const observer = new MutationObserver(() => { if (atBottom) el.scrollTo({ top: el.scrollHeight }) })
    observer.observe(el, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [viewportRef, atBottom])
  return (
    <div
      ref={viewportRef}
      data-slot="message-scroller-viewport"
      className={cn("size-full min-h-0 min-w-0 overflow-y-auto overscroll-contain", className)}
      onScroll={(e) => { const el = e.currentTarget; ctx?.setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 24) }}
      {...props}
    >
      {children}
    </div>
  )
}

function MessageScrollerContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="message-scroller-content" className={cn("flex h-max min-h-full flex-col gap-6", className)} {...props} />
}

function MessageScrollerItem({ className, messageId, scrollAnchor, ...props }: React.ComponentProps<"div"> & { messageId?: string; scrollAnchor?: boolean }) {
  return <div data-slot="message-scroller-item" data-message-id={messageId} data-scroll-anchor={scrollAnchor || undefined} className={className} {...props} />
}

function MessageScrollerButton({ className, ...props }: React.ComponentProps<typeof Button>) {
  const ctx = React.useContext(Ctx)
  if (!ctx || ctx.atBottom) return null
  return (
    <Button
      data-slot="message-scroller-button"
      variant="outline"
      size="icon-sm"
      className={cn("absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full shadow-sm", className)}
      onClick={() => { const el = ctx.viewportRef.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }) }}
      aria-label="Naar laatste bericht"
      {...props}
    >
      <ArrowDownIcon />
    </Button>
  )
}

export { MessageScrollerProvider, MessageScroller, MessageScrollerViewport, MessageScrollerContent, MessageScrollerItem, MessageScrollerButton }
