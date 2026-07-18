import { Link } from 'react-router-dom'
import { LegalDocumentLayout } from '@/components/legal/LegalDocumentLayout'
import { APP_NAME } from '@/constants/app'

const OPERATOR = 'Candlestack'
const UPDATED = '18 July 2026'

export function TermsPage() {
  return (
    <LegalDocumentLayout title="Terms & Conditions" updated={UPDATED}>
      <section>
        <h2>1. Agreement to these terms</h2>
        <p>
          These Terms &amp; Conditions (“Terms”) govern your access to and use of the {APP_NAME}{' '}
          marketplace, websites, and mobile applications (together, the “Service”) operated by{' '}
          {OPERATOR} (“we”, “us”, or “our”).
        </p>
        <p className="mt-3">
          By creating an account, browsing, placing an order, listing produce, or delivering orders
          through {APP_NAME}, you agree to these Terms and our{' '}
          <Link to="/privacy" className="font-semibold text-primary underline-offset-2 hover:underline">
            Privacy Policy
          </Link>
          . If you do not agree, do not use the Service.
        </p>
      </section>

      <section>
        <h2>2. Who can use {APP_NAME}</h2>
        <p>
          You must be at least 18 years old (or the age of majority in your region) and able to form
          a binding contract. Sellers and delivery partners may need to complete verification or
          onboarding before they can accept orders or deliveries.
        </p>
      </section>

      <section>
        <h2>3. Accounts and roles</h2>
        <p>{APP_NAME} supports different roles on the marketplace:</p>
        <ul className="mt-3">
          <li>
            <strong>Buyers</strong> — browse farms, order produce, pay, and receive deliveries.
          </li>
          <li>
            <strong>Sellers</strong> — list inventory, manage a farm store, fulfill orders, and
            receive payouts.
          </li>
          <li>
            <strong>Delivery partners</strong> — pick up and deliver orders according to assigned
            routes and status rules.
          </li>
        </ul>
        <p className="mt-3">
          You are responsible for keeping your login credentials secure and for all activity under
          your account. Tell us promptly if you suspect unauthorized use.
        </p>
      </section>

      <section>
        <h2>4. Marketplace relationship</h2>
        <p>
          {APP_NAME} is a marketplace platform. Unless we expressly say otherwise, sellers are
          independent businesses selling their own produce, and delivery partners provide logistics
          services. We facilitate discovery, ordering, payments, and coordination; we are not the
          grower of every listed item unless marked as such.
        </p>
      </section>

      <section>
        <h2>5. Orders, pricing, and availability</h2>
        <ul>
          <li>Prices, weights, and availability may change based on harvest and seller updates.</li>
          <li>
            An order is confirmed when payment succeeds (or the selected payment method is
            authorized) and the seller/system accepts the order.
          </li>
          <li>
            If an item becomes unavailable after checkout, we may cancel that line item, offer a
            substitute with your consent, or issue a refund for the affected amount.
          </li>
          <li>
            Delivery windows are estimates. Delays can occur due to weather, traffic, farm readiness,
            or force majeure events.
          </li>
        </ul>
      </section>

      <section>
        <h2>6. Payments, refunds, and payouts</h2>
        <p>
          Payments may be processed through third-party payment providers (such as Razorpay). By
          paying through the Service, you also agree to the provider’s applicable terms.
        </p>
        <ul className="mt-3">
          <li>
            Refunds, cancellations, and chargebacks are handled according to order status, seller
            fulfillment, and our support policies.
          </li>
          <li>
            Seller payouts and delivery earnings are subject to verification, order completion, fees,
            adjustments for refunds/chargebacks, and any applicable tax withholding.
          </li>
          <li>
            You authorize us and our payment partners to collect, hold, and remit amounts as needed
            to complete marketplace transactions.
          </li>
        </ul>
      </section>

      <section>
        <h2>7. Seller and delivery partner obligations</h2>
        <p>If you sell or deliver on {APP_NAME}, you agree to:</p>
        <ul className="mt-3">
          <li>Provide accurate listings, inventory, pricing, and business information.</li>
          <li>Handle food safely and comply with applicable food, trade, and transport laws.</li>
          <li>Fulfill accepted orders on time and communicate issues promptly.</li>
          <li>Not misuse buyer personal data obtained through deliveries or order handling.</li>
          <li>Maintain any licenses, vehicle fitness, or insurance required for your role.</li>
        </ul>
      </section>

      <section>
        <h2>8. Acceptable use</h2>
        <p>You must not:</p>
        <ul className="mt-3">
          <li>Use the Service for unlawful, fraudulent, or harmful activity.</li>
          <li>Scrape, reverse engineer, or disrupt the platform or its security.</li>
          <li>Post false, misleading, or infringing content.</li>
          <li>Interfere with other users’ accounts, orders, or deliveries.</li>
          <li>Attempt to bypass fees, verification, or marketplace controls.</li>
        </ul>
      </section>

      <section>
        <h2>9. Location and communications</h2>
        <p>
          Features such as nearby stores, delivery assignment, and tracking may require location
          access and push/SMS/email notifications. You can manage some permissions in your device
          settings, but certain features may not work without them.
        </p>
      </section>

      <section>
        <h2>10. Intellectual property</h2>
        <p>
          The {APP_NAME} name, branding, software, and platform content are owned by {OPERATOR} or
          its licensors. Sellers retain rights in their own product photos and descriptions, and
          grant us a license to display them for marketplace operation and promotion.
        </p>
      </section>

      <section>
        <h2>11. Disclaimers</h2>
        <p>
          The Service is provided on an “as is” and “as available” basis. Fresh produce quality can
          vary with nature, handling, and storage. To the fullest extent permitted by law, we
          disclaim warranties of merchantability, fitness for a particular purpose, and
          non-infringement, and we do not guarantee uninterrupted or error-free operation.
        </p>
      </section>

      <section>
        <h2>12. Limitation of liability</h2>
        <p>
          To the fullest extent permitted by law, {OPERATOR} and its affiliates will not be liable
          for indirect, incidental, special, consequential, or punitive damages, or for lost
          profits, data, or goodwill. Our aggregate liability arising out of the Service will not
          exceed the greater of (a) the amounts you paid to us for the transaction giving rise to
          the claim in the three months before the claim, or (b) INR 5,000.
        </p>
      </section>

      <section>
        <h2>13. Suspension and termination</h2>
        <p>
          We may suspend or terminate access if you breach these Terms, create risk for users or the
          platform, fail verification, or if required by law. You may stop using the Service at any
          time. Provisions that should survive termination (including payments owed, IP, liability
          limits, and dispute terms) will continue to apply.
        </p>
      </section>

      <section>
        <h2>14. Changes to these Terms</h2>
        <p>
          We may update these Terms from time to time. We will post the revised version with an
          updated “Last updated” date. Continued use after changes become effective constitutes
          acceptance of the revised Terms.
        </p>
      </section>

      <section>
        <h2>15. Governing law</h2>
        <p>
          These Terms are governed by the laws of India, without regard to conflict-of-law rules.
          Courts in India will have exclusive jurisdiction, subject to any mandatory consumer
          protections that apply where you live.
        </p>
      </section>

      <section>
        <h2>16. Contact</h2>
        <p>
          Questions about these Terms can be sent through in-app Help &amp; Support or to{' '}
          <a
            href="mailto:support@vishnusoman.us"
            className="font-semibold text-primary underline-offset-2 hover:underline"
          >
            support@vishnusoman.us
          </a>
          .
        </p>
      </section>
    </LegalDocumentLayout>
  )
}
