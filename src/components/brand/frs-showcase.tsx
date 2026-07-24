import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const modules = [
  { id: 'M01', name: 'Homepage', description: 'Trust-building landing page with categories, offers, testimonials, and newsletter.' },
  { id: 'M02', name: 'Product Catalogue', description: 'Search, sort, filtering, and product grid browsing.' },
  { id: 'M03', name: 'Product Details', description: 'SKU, price, discount, variants, stock, and related product presentation.' },
  { id: 'M04', name: 'Authentication', description: 'Mobile number + OTP login with secure verification rules.' },
  { id: 'M05', name: 'Customer Profile', description: 'Profile editing, address management, order history, and wishlist control.' },
  { id: 'M06', name: 'Wishlist', description: 'Save products for later and move them into the cart.' },
  { id: 'M07', name: 'Shopping Cart', description: 'Add, remove, increase, or decrease stock-safe quantities.' },
  { id: 'M08', name: 'Checkout', description: 'Cart → authentication → address → coupon → payment → review → order.' },
  { id: 'M09', name: 'Orders', description: 'View order records and cancel before shipment.' },
  { id: 'M10', name: 'Order Tracking', description: 'Track order status using mobile number and order ID.' },
  { id: 'M11', name: 'Reviews', description: 'Verified customers can leave ratings and reviews.' },
  { id: 'M12', name: 'Contact', description: 'Call, WhatsApp, email, and contact-form support channels.' },
  { id: 'M13', name: 'Admin Dashboard', description: 'Revenue insights, product management, orders, customers, and coupons.' },
];

const businessRules = [
  'Every Product must belong to one Category.',
  'Every Order must contain at least one Product.',
  'Mobile Number must be unique.',
  'Stock Quantity cannot become negative.',
  'Order ID must always be unique.',
  'Only Verified Users can place Orders.',
  'Only Verified Buyers can submit Reviews.',
];

const integrations = ['Supabase', 'Prisma ORM', 'Cloudinary', 'Razorpay', 'Shiprocket', 'MSG91', 'Google Analytics', 'Google Search Console'];

export function FRSShowcase() {
  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">FRS</p>
        <h1 className="mt-3 font-heading text-5xl text-navy">Navya Collection • Functional Requirements Specification</h1>
        <p className="mt-4 max-w-4xl text-base text-slate-600">
          This specification defines the functional scope of the Navya Collection e-commerce platform, covering customer flows, admin operations, business rules, integrations, and success criteria.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <Card key={module.id}>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">{module.id}</p>
            <h2 className="mt-2 font-heading text-2xl text-navy">{module.name}</h2>
            <p className="mt-3 text-sm text-slate-700">{module.description}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-heading text-4xl text-navy">Authentication Flow</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            <li>Customer enters mobile number</li>
            <li>System validates the mobile number</li>
            <li>OTP is generated and sent</li>
            <li>Customer verifies OTP</li>
            <li>Login is successful</li>
          </ul>
        </Card>

        <Card>
          <h2 className="font-heading text-4xl text-navy">Checkout Flow</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            <li>Cart</li>
            <li>Authentication</li>
            <li>Address</li>
            <li>Coupon</li>
            <li>Payment</li>
            <li>Review Order</li>
            <li>Place Order</li>
          </ul>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-heading text-4xl text-navy">Business Rules</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            {businessRules.map((rule) => (
              <li key={rule} className="rounded-xl bg-slate-50 px-3 py-2">{rule}</li>
            ))}
          </ul>
        </Card>

        <Card>
          <h2 className="font-heading text-4xl text-navy">Third-Party Integrations</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {integrations.map((item) => (
              <Badge key={item} variant="accent">{item}</Badge>
            ))}
          </div>
        </Card>
      </section>

      <section className="rounded-2xl border border-border bg-navy px-6 py-8 text-white shadow-premium">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange">Success Criteria</p>
        <h2 className="mt-3 font-heading text-4xl">A customer can browse, login, order, track, and an admin can manage the store.</h2>
        <p className="mt-3 max-w-3xl text-sm text-slate-200">
          The platform is complete when customers can browse products, use mobile OTP login, place orders, track orders, and administrators can manage products and order operations reliably.
        </p>
      </section>
    </main>
  );
}
