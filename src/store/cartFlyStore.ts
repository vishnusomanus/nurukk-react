import { create } from 'zustand'

export const CART_FLY_DURATION_MS = 680

export type CartFlyFlight = {
  id: string
  imageUrl: string
  fromX: number
  fromY: number
  toX: number
  toY: number
}

function getVisibleCartTarget(): HTMLElement | null {
  const targets = document.querySelectorAll<HTMLElement>('[data-cart-target]')
  for (const el of targets) {
    const rect = el.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) return el
  }
  return null
}

function bumpCartTargets() {
  document.querySelectorAll<HTMLElement>('[data-cart-target]').forEach((el) => {
    const rect = el.getBoundingClientRect()
    if (rect.width === 0) return
    el.classList.remove('cart-target-bump')
    void el.offsetWidth
    el.classList.add('cart-target-bump')
  })
}

const flightWaiters = new Map<string, () => void>()

type CartFlyState = {
  flights: CartFlyFlight[]
  bumpTick: number
  launch: (imageUrl: string, fromElement: HTMLElement) => string | null
  complete: (id: string) => void
  waitForFlight: (id: string) => Promise<void>
}

export const useCartFlyStore = create<CartFlyState>((set, get) => ({
  flights: [],
  bumpTick: 0,
  launch: (imageUrl, fromElement) => {
    if (!imageUrl) return null

    const target = getVisibleCartTarget()
    const fromRect = fromElement.getBoundingClientRect()

    let toX: number
    let toY: number

    if (target) {
      const toRect = target.getBoundingClientRect()
      toX = toRect.left + toRect.width / 2
      toY = toRect.top + toRect.height / 2
    } else {
      toX = window.innerWidth - 56
      toY = window.innerHeight - 72
    }

    const id = crypto.randomUUID()

    set({
      flights: [
        ...get().flights,
        {
          id,
          imageUrl,
          fromX: fromRect.left + fromRect.width / 2,
          fromY: fromRect.top + fromRect.height / 2,
          toX,
          toY,
        },
      ],
    })

    return id
  },
  waitForFlight: (id) =>
    new Promise((resolve) => {
      const timeout = window.setTimeout(() => {
        flightWaiters.delete(id)
        resolve()
      }, CART_FLY_DURATION_MS + 120)

      flightWaiters.set(id, () => {
        window.clearTimeout(timeout)
        resolve()
      })
    }),
  complete: (id) => {
    const remaining = get().flights.filter((flight) => flight.id !== id)
    const hadFlight = remaining.length !== get().flights.length
    set({ flights: remaining, bumpTick: hadFlight ? get().bumpTick + 1 : get().bumpTick })
    if (hadFlight) bumpCartTargets()
    const resolve = flightWaiters.get(id)
    if (resolve) {
      flightWaiters.delete(id)
      resolve()
    }
  },
}))

export async function triggerCartFly(imageUrl: string, fromElement: HTMLElement | null | undefined) {
  if (!fromElement || !imageUrl) return
  const store = useCartFlyStore.getState()
  const id = store.launch(imageUrl, fromElement)
  if (!id) return
  await store.waitForFlight(id)
}
