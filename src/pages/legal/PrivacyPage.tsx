import { Link } from 'react-router-dom'
import { LegalDocumentLayout } from '@/components/legal/LegalDocumentLayout'
import { APP_NAME } from '@/constants/app'

const OPERATOR = 'Candlestack'
const UPDATED = '18 July 2026'

export function PrivacyPage() {
  return (
    <LegalDocumentLayout title="Privacy Policy" updated={UPDATED}>
      <section>
        <h2>1. Overview</h2>
        <p>
          This Privacy Policy explains how {OPERATOR} (“we”, “us”, or “our”) collects, uses, shares,
          and protects personal information when you use the {APP_NAME} marketplace, websites, and
          mobile apps (the “Service”).
        </p>
        <p className="mt-3">
          By using {APP_NAME}, you acknowledge this Policy and our{' '}
          <Link to="/terms" className="font-semibold text-primary underline-offset-2 hover:underline">
            Terms &amp; Conditions
          </Link>
          . If you do not agree, please do not use the Service.
        </p>
      </section>

      <section>
        <h2>2. Information we collect</h2>
        <p>Depending on your role and device permissions, we may collect:</p>
        <ul className="mt-3">
          <li>
            <strong>Account details</strong> — name, phone number, email, password/OTP verification
            data, profile photo, and role (buyer, seller, delivery).
          </li>
          <li>
            <strong>Business / onboarding data</strong> — farm or store details, addresses, identity
            or verification documents, bank/payout details for sellers and delivery partners.
          </li>
          <li>
            <strong>Order and transaction data</strong> — cart contents, addresses, delivery notes,
            order history, refunds, ratings, and payment references from payment providers.
          </li>
          <li>
            <strong>Location data</strong> — approximate or precise location to show nearby farms,
            confirm delivery addresses, assign riders, and support live delivery features when you
            allow it.
          </li>
          <li>
            <strong>Device and usage data</strong> — app version, device identifiers, IP address, log
            data, crash diagnostics, and how you interact with the Service.
          </li>
          <li>
            <strong>Communications</strong> — support messages, feedback, and notification
            preferences.
          </li>
          <li>
            <strong>Push notification tokens</strong> — so we can send order, delivery, and account
            alerts when enabled.
          </li>
        </ul>
      </section>

      <section>
        <h2>3. How we use information</h2>
        <p>We use personal information to:</p>
        <ul className="mt-3">
          <li>Create and manage accounts, authentication, and role-based access.</li>
          <li>Process orders, payments, refunds, payouts, and deliveries.</li>
          <li>Show relevant farms, products, and delivery options near you.</li>
          <li>Communicate about orders, security alerts, and service updates.</li>
          <li>Verify sellers/delivery partners and prevent fraud or abuse.</li>
          <li>Improve product quality, safety, performance, and customer support.</li>
          <li>Comply with legal obligations and enforce our Terms.</li>
        </ul>
      </section>

      <section>
        <h2>4. How we share information</h2>
        <p>We share information only as needed to operate the marketplace, including with:</p>
        <ul className="mt-3">
          <li>
            <strong>Other marketplace participants</strong> — for example, sellers may see order and
            delivery details needed to fulfill; delivery partners may see pickup/drop-off details for
            active assignments. Sensitive customer contact details may be limited until an order
            reaches the appropriate delivery stage.
          </li>
          <li>
            <strong>Service providers</strong> — hosting, analytics, maps, messaging, payments (e.g.
            Razorpay), and push notification providers such as Firebase.
          </li>
          <li>
            <strong>Legal and safety parties</strong> — when required by law, court order, or to
            protect users, rights, or the Service.
          </li>
          <li>
            <strong>Business transfers</strong> — if we are involved in a merger, acquisition, or
            asset sale, information may transfer subject to this Policy or equivalent protections.
          </li>
        </ul>
        <p className="mt-3">We do not sell your personal information.</p>
      </section>

      <section>
        <h2>5. Payments</h2>
        <p>
          Card and UPI payments are typically processed by third-party payment gateways. We receive
          payment status and references needed for orders and refunds; we do not store full card
          numbers on {APP_NAME} servers.
        </p>
      </section>

      <section>
        <h2>6. Location and notifications</h2>
        <p>
          Location and notification permissions are optional at the OS level, but some features
          (nearby stores, delivery tracking, rider assignment, push alerts) may not work without
          them. You can revoke permissions in your device settings at any time.
        </p>
      </section>

      <section>
        <h2>7. Data retention</h2>
        <p>
          We keep personal information for as long as your account is active or as needed to provide
          the Service, resolve disputes, meet legal/accounting requirements, and enforce our
          agreements. When information is no longer needed, we delete or anonymize it where
          practicable.
        </p>
      </section>

      <section>
        <h2>8. Security</h2>
        <p>
          We use administrative, technical, and organizational measures designed to protect personal
          information. No method of transmission or storage is completely secure; please use a
          strong device lock and keep OTP codes private.
        </p>
      </section>

      <section>
        <h2>9. Your choices and rights</h2>
        <p>Subject to applicable law, you may be able to:</p>
        <ul className="mt-3">
          <li>Access or update profile and address information in the app.</li>
          <li>Request correction or deletion of certain personal data.</li>
          <li>Withdraw consent for optional permissions (location, notifications, camera).</li>
          <li>Ask questions about how we process your information.</li>
        </ul>
        <p className="mt-3">
          Contact us through Help &amp; Support or{' '}
          <a
            href="mailto:support@vishnusoman.us"
            className="font-semibold text-primary underline-offset-2 hover:underline"
          >
            support@vishnusoman.us
          </a>
          . We may need to verify your identity before fulfilling a request.
        </p>
      </section>

      <section>
        <h2>10. Children’s privacy</h2>
        <p>
          {APP_NAME} is not directed to children under 18. We do not knowingly collect personal
          information from children. If you believe a child has provided us data, contact us so we
          can take appropriate action.
        </p>
      </section>

      <section>
        <h2>11. International processing</h2>
        <p>
          Information may be processed on servers or by providers located in India or other
          countries where we or our vendors operate. We take steps designed to protect information
          in line with this Policy.
        </p>
      </section>

      <section>
        <h2>12. Changes to this Policy</h2>
        <p>
          We may update this Privacy Policy periodically. The “Last updated” date at the top will
          change when we do. Continued use of the Service after an update means you acknowledge the
          revised Policy.
        </p>
      </section>

      <section>
        <h2>13. Contact</h2>
        <p>
          For privacy questions or requests related to {APP_NAME}, contact {OPERATOR} at{' '}
          <a
            href="mailto:support@vishnusoman.us"
            className="font-semibold text-primary underline-offset-2 hover:underline"
          >
            support@vishnusoman.us
          </a>{' '}
          or through in-app Help &amp; Support.
        </p>
      </section>
    </LegalDocumentLayout>
  )
}
