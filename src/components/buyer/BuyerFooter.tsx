import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { APP_NAME, appCopyright } from '@/constants/app'

const shopLinks = [
  { label: 'Vegetables', to: '/buyer/categories' },
  { label: 'Cut Veggies', to: '/buyer/categories' },
  { label: 'Leafy Greens', to: '/buyer/categories' },
  { label: 'Weekly Boxes', to: '/buyer/categories' },
]

const supportLinks = [
  { label: 'Sustainability', to: '/buyer/profile' },
  { label: 'Shipping Info', to: '/buyer/profile' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms & Conditions', to: '/terms' },
  { label: 'Contact', to: '/buyer/profile' },
]

export function BuyerFooter() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const onNewsletter = (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setSubscribed(true)
    setEmail('')
  }

  return (
    <footer className="mt-8 hidden w-full bg-surface-container-high lg:block">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-12 md:grid-cols-4 xl:px-8">
        <div className="md:col-span-1">
          <Link to="/buyer" className="mb-4 flex items-center gap-2.5" aria-label={APP_NAME}>
            <BrandLogo size="sm" className="h-11 w-auto max-w-[96px]" alt="" />
            <span className="text-headline-lg font-bold text-primary">{APP_NAME}</span>
          </Link>
          <p className="text-body-md mb-6 text-on-surface-variant">
            Bringing the morning dew to your doorstep with 100% organic, traceable produce.
          </p>
          <div className="flex gap-4 text-primary">
            <span className="material-symbols-outlined cursor-default transition-transform hover:scale-110">public</span>
            <span className="material-symbols-outlined cursor-default transition-transform hover:scale-110">eco</span>
            <span className="material-symbols-outlined cursor-default transition-transform hover:scale-110">verified</span>
          </div>
        </div>

        <div>
          <h4 className="mb-4 font-bold text-on-surface">Shop</h4>
          <ul className="space-y-3">
            {shopLinks.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.to}
                  className="text-body-md text-on-surface-variant underline-offset-2 transition-colors hover:text-primary hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-bold text-on-surface">Support</h4>
          <ul className="space-y-3">
            {supportLinks.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.to}
                  className="text-body-md text-on-surface-variant underline-offset-2 transition-colors hover:text-primary hover:underline"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 font-bold text-on-surface">Newsletter</h4>
          <p className="text-body-md mb-4 text-on-surface-variant">Get fresh deals delivered to your inbox.</p>
          {subscribed ? (
            <p className="text-body-md font-semibold text-primary">Thanks for subscribing!</p>
          ) : (
            <form onSubmit={onNewsletter} className="flex rounded-full border border-outline-variant bg-surface p-1">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="text-body-md w-full border-none bg-transparent px-4 focus:ring-0"
                required
              />
              <button
                type="submit"
                className="text-label-md shrink-0 rounded-full bg-primary px-4 py-2 font-bold text-on-primary"
              >
                Join
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="border-t border-outline-variant/30 py-4 text-center">
        <p className="text-label-md text-on-surface-variant opacity-80">
          {appCopyright()}. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
