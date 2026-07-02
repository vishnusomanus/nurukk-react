import { useEffect, useRef } from 'react'
import { CART_FLY_DURATION_MS, useCartFlyStore, type CartFlyFlight } from '@/store/cartFlyStore'

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3)
}

function quadPoint(t: number, start: number, control: number, end: number) {
  const inv = 1 - t
  return inv * inv * start + 2 * inv * t * control + t * t * end
}

function FlyItem({ flight }: { flight: CartFlyFlight }) {
  const ref = useRef<HTMLDivElement>(null)
  const complete = useCartFlyStore((s) => s.complete)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    const dx = flight.toX - flight.fromX
    const dy = flight.toY - flight.fromY
    const arcLift = Math.min(140, Math.max(72, Math.hypot(dx, dy) * 0.35))
    const controlX = flight.fromX + dx * 0.55
    const controlY = flight.fromY + dy * 0.25 - arcLift

    const startAt = performance.now()
    let frame = 0

    const applyFrame = (raw: number) => {
      const t = easeOutCubic(raw)
      const x = quadPoint(t, flight.fromX, controlX, flight.toX)
      const y = quadPoint(t, flight.fromY, controlY, flight.toY)
      const scale = 1 - t * 0.82
      const rotate = t * 16
      const opacity = 1 - t * 0.95
      node.style.transform = `translate3d(${x - flight.fromX}px, ${y - flight.fromY}px, 0) scale(${scale}) rotate(${rotate}deg)`
      node.style.opacity = String(opacity)
    }

    applyFrame(0)

    const tick = (now: number) => {
      const raw = Math.min((now - startAt) / CART_FLY_DURATION_MS, 1)
      applyFrame(raw)

      if (raw < 1) {
        frame = requestAnimationFrame(tick)
      } else {
        complete(flight.id)
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [flight, complete])

  return (
    <div
      ref={ref}
      className="cart-fly-item"
      style={{
        left: flight.fromX,
        top: flight.fromY,
      }}
    >
      <img src={flight.imageUrl} alt="" referrerPolicy="no-referrer" />
    </div>
  )
}

export function CartFlyLayer() {
  const flights = useCartFlyStore((s) => s.flights)

  if (flights.length === 0) return null

  return (
    <div className="cart-fly-layer" aria-hidden>
      {flights.map((flight) => (
        <FlyItem key={flight.id} flight={flight} />
      ))}
    </div>
  )
}
