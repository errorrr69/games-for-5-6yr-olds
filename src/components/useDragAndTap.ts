import { useCallback, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'

export type DragState = { itemId: string; x: number; y: number } | null

/**
 * Drag-and-drop that a five-year-old can actually complete, and that a
 * keyboard can complete too (spec §29).
 *
 *   • Drag an item onto a zone, or
 *   • tap the item (it lifts) then tap the zone.
 *
 * Both routes end in the same `onDrop`.
 */
export function useDragAndTap(onDrop: (itemId: string, zoneId: string) => void) {
  const [drag, setDrag] = useState<DragState>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const origin = useRef<{ x: number; y: number; moved: boolean } | null>(null)

  const finish = useCallback(
    (itemId: string, clientX: number, clientY: number) => {
      const element = document.elementFromPoint(clientX, clientY)
      const zone = element?.closest<HTMLElement>('[data-dropzone]')
      if (zone?.dataset.dropzone) {
        onDrop(itemId, zone.dataset.dropzone)
        return true
      }
      return false
    },
    [onDrop],
  )

  const item = useCallback(
    (itemId: string) => ({
      'data-dragging': drag?.itemId === itemId ? '' : undefined,
      'data-selected': selected === itemId ? '' : undefined,
      tabIndex: 0,
      role: 'button' as const,
      onPointerDown: (event: PointerEvent<HTMLElement>) => {
        if (event.button !== 0 && event.pointerType === 'mouse') return
        // Optional: keeps a finger drag tracked outside the element's box.
        event.currentTarget.setPointerCapture?.(event.pointerId)
        origin.current = { x: event.clientX, y: event.clientY, moved: false }
      },
      onPointerMove: (event: PointerEvent<HTMLElement>) => {
        const start = origin.current
        if (!start) return
        const far =
          Math.abs(event.clientX - start.x) > 6 ||
          Math.abs(event.clientY - start.y) > 6
        if (!far && !start.moved) return
        start.moved = true
        setDrag({ itemId, x: event.clientX, y: event.clientY })
      },
      onPointerUp: (event: PointerEvent<HTMLElement>) => {
        const start = origin.current
        origin.current = null
        setDrag(null)
        if (start?.moved) {
          finish(itemId, event.clientX, event.clientY)
          setSelected(null)
          return
        }
        // A plain tap: pick it up, or put it back down.
        setSelected((current) => (current === itemId ? null : itemId))
      },
      onPointerCancel: () => {
        origin.current = null
        setDrag(null)
      },
      onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        setSelected((current) => (current === itemId ? null : itemId))
      },
    }),
    [drag, selected, finish],
  )

  const drop = useCallback(
    (zoneId: string) => {
      if (!selected) return
      onDrop(selected, zoneId)
      setSelected(null)
    },
    [selected, onDrop],
  )

  const zone = useCallback(
    (zoneId: string) => ({
      'data-dropzone': zoneId,
      'data-ready': selected ? '' : undefined,
      role: 'button' as const,
      tabIndex: 0,
      onClick: () => drop(zoneId),
      onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        drop(zoneId)
      },
    }),
    [selected, drop],
  )

  return { drag, selected, item, zone, clear: () => setSelected(null) }
}
