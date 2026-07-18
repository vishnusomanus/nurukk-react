import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { orderChatService } from '@/api/services'
import { BottomSheetHandle } from '@/components/ui/BottomSheetHandle'
import { useSwipeToClose } from '@/hooks/useSwipeToClose'
import { getApiErrorMessage } from '@/utils/apiErrorMessage'
import { cn } from '@/utils/cn'
import { setActiveOrderChat } from '@/native/pushAlertBus'

function formatMessageTime(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

export function OrderChatSheet({
  open,
  orderUuid,
  title = 'Delivery chat',
  subtitle,
  onClose,
}: {
  open: boolean
  orderUuid: string | null
  title?: string
  subtitle?: string
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLDivElement | null>(null)
  const { handleProps, sheetStyle } = useSwipeToClose(onClose, { enabled: open })

  useEffect(() => {
    if (open && orderUuid) {
      setActiveOrderChat(orderUuid)
      return () => setActiveOrderChat(null)
    }
    setActiveOrderChat(null)
    return undefined
  }, [open, orderUuid])

  const chatQuery = useQuery({
    queryKey: ['order-chat', orderUuid],
    queryFn: () => orderChatService.getOrderChat(orderUuid!),
    enabled: open && !!orderUuid,
    refetchInterval: open && orderUuid ? 5_000 : false,
  })

  const sendMutation = useMutation({
    mutationFn: (body: string) => orderChatService.sendOrderChatMessage(orderUuid!, body),
    onSuccess: async () => {
      setDraft('')
      await queryClient.invalidateQueries({ queryKey: ['order-chat', orderUuid] })
    },
  })

  const thread = chatQuery.data?.data
  const messages = thread?.messages ?? []
  const canSend = Boolean(thread?.can_send)

  useEffect(() => {
    if (!open) {
      setDraft('')
      sendMutation.reset()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (!open || !listRef.current) return
    listRef.current.scrollTop = listRef.current.scrollHeight
  }, [open, messages.length, chatQuery.dataUpdatedAt])

  if (!open || !orderUuid) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const body = draft.trim()
    if (!body || !canSend || sendMutation.isPending) return
    sendMutation.mutate(body)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center lg:items-center lg:p-6"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
        aria-label="Close chat"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-chat-title"
        className="relative z-10 flex h-[min(85dvh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.75rem] bg-surface shadow-[0_-12px_40px_-8px_rgba(15,23,42,0.35)] lg:h-[min(80vh,640px)] lg:rounded-[1.75rem] lg:shadow-2xl"
        style={sheetStyle}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-outline-variant/30 px-4 pt-1 lg:px-5 lg:pt-4">
          <div className="lg:hidden">
            <BottomSheetHandle {...handleProps} />
          </div>
          <div className="flex items-start justify-between gap-3 pb-3">
            <div className="min-w-0">
              <h2 id="order-chat-title" className="text-lg font-bold text-on-surface">
                {title}
              </h2>
              {subtitle ? (
                <p className="mt-0.5 truncate text-sm text-on-surface-variant">{subtitle}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high"
              aria-label="Close"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        <div ref={listRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 lg:px-5">
          {chatQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-12 max-w-[75%] animate-pulse rounded-2xl bg-surface-container',
                    i % 2 === 0 ? 'ml-auto' : '',
                  )}
                />
              ))}
            </div>
          ) : chatQuery.isError ? (
            <p className="rounded-2xl bg-error-container/25 px-4 py-3 text-sm text-error">
              {getApiErrorMessage(chatQuery.error, 'Could not load chat')}
            </p>
          ) : messages.length === 0 ? (
            <div className="flex h-full min-h-[12rem] flex-col items-center justify-center px-6 text-center">
              <span className="material-symbols-outlined mb-2 text-4xl text-primary">chat</span>
              <p className="text-sm font-semibold text-on-surface">No messages yet</p>
              <p className="mt-1 text-sm text-on-surface-variant">
                {canSend
                  ? 'Say hello — share gate codes, landmarks, or timing updates.'
                  : 'This delivery chat is closed for new messages.'}
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const mine = Boolean(message.is_mine)
              return (
                <div
                  key={message.uuid}
                  className={cn('flex flex-col gap-1', mine ? 'items-end' : 'items-start')}
                >
                  {!mine && message.sender?.name ? (
                    <span className="px-1 text-[11px] font-semibold text-on-surface-variant">
                      {message.sender.name}
                    </span>
                  ) : null}
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed',
                      mine
                        ? 'rounded-br-md bg-primary text-on-primary'
                        : 'rounded-bl-md bg-surface-container-high text-on-surface',
                    )}
                  >
                    {message.body}
                  </div>
                  <span className="px-1 text-[10px] text-on-surface-variant">
                    {formatMessageTime(message.created_at)}
                  </span>
                </div>
              )
            })
          )}
        </div>

        <div className="shrink-0 border-t border-outline-variant/30 bg-surface px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] lg:px-5">
          {!canSend && !chatQuery.isLoading && !chatQuery.isError ? (
            <p className="mb-2 text-center text-xs text-on-surface-variant">
              Chat is read-only after delivery ends.
            </p>
          ) : null}
          {sendMutation.isError ? (
            <p className="mb-2 text-sm text-error">
              {getApiErrorMessage(sendMutation.error, 'Could not send message')}
            </p>
          ) : null}
          <form className="flex items-end gap-2" onSubmit={handleSubmit}>
            <label className="min-w-0 flex-1">
              <span className="sr-only">Message</span>
              <textarea
                rows={1}
                value={draft}
                disabled={!canSend || sendMutation.isPending}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e)
                  }
                }}
                placeholder={canSend ? 'Type a message…' : 'Messaging closed'}
                maxLength={1000}
                className="max-h-28 min-h-11 w-full resize-none rounded-2xl border-none bg-surface-container-low px-4 py-2.5 text-[16px] text-on-surface outline-none ring-0 placeholder:text-outline focus:ring-2 focus:ring-primary/25 disabled:opacity-60"
              />
            </label>
            <button
              type="submit"
              disabled={!canSend || sendMutation.isPending || !draft.trim()}
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary shadow-[0_8px_16px_-8px_rgba(13,99,27,0.5)] transition-transform active:scale-[0.96] disabled:opacity-50"
              aria-label="Send message"
            >
              <span className="material-symbols-outlined text-[22px]">send</span>
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  )
}
