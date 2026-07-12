import { useCallback, useRef, useState, type CSSProperties, type PointerEvent, type TouchEvent } from 'react'

type UseSwipeToCloseOptions = {
  /** Pixels dragged down before dismiss. Default 112. */
  threshold?: number
  enabled?: boolean
}

/**
 * Swipe-down dismiss for bottom sheets.
 * Bind `handleProps` to the drag handle / header; apply `sheetStyle` to the sheet panel.
 */
export function useSwipeToClose(
  onClose: () => void,
  { threshold = 112, enabled = true }: UseSwipeToCloseOptions = {},
) {
  const [offset, setOffset] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startY = useRef(0)
  const lastY = useRef(0)
  const active = useRef(false)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  const begin = useCallback(
    (clientY: number) => {
      if (!enabled) return
      active.current = true
      startY.current = clientY
      lastY.current = clientY
      setDragging(true)
      setOffset(0)
    },
    [enabled],
  )

  const move = useCallback(
    (clientY: number) => {
      if (!active.current || !enabled) return
      lastY.current = clientY
      setOffset(Math.max(0, clientY - startY.current))
    },
    [enabled],
  )

  const end = useCallback(() => {
    if (!active.current) return
    active.current = false
    const dy = lastY.current - startY.current
    setDragging(false)
    if (dy >= threshold) {
      setOffset(0)
      onCloseRef.current()
      return
    }
    setOffset(0)
  }, [threshold])

  const handleProps = {
    onTouchStart: (e: TouchEvent) => {
      begin(e.touches[0]?.clientY ?? 0)
    },
    onTouchMove: (e: TouchEvent) => {
      if (!active.current) return
      move(e.touches[0]?.clientY ?? 0)
      if (lastY.current - startY.current > 6) {
        e.preventDefault()
      }
    },
    onTouchEnd: end,
    onTouchCancel: end,
    onPointerDown: (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      e.currentTarget.setPointerCapture?.(e.pointerId)
      begin(e.clientY)
    },
    onPointerMove: (e: PointerEvent) => {
      if (!active.current) return
      move(e.clientY)
    },
    onPointerUp: end,
    onPointerCancel: end,
  }

  const sheetStyle: CSSProperties = {
    transform: offset > 0 ? `translateY(${offset}px)` : undefined,
    transition: dragging ? 'none' : 'transform 200ms ease-out',
    willChange: dragging ? 'transform' : undefined,
  }

  return { handleProps, sheetStyle, offset, dragging }
}
