import { Metadata } from 'next';

import { Card } from '@/components/ui/card';
import { ORDERS } from '@/features/orders/constants/orders.constants';
import type { Order } from '@/features/orders/types/orders.types';

export const metadata: Metadata = {
  title: 'Dashboard | Admin',
  description: 'Admin dashboard overview.',
};

const STATS = [
  { label: 'Total Orders', value: ORDERS.length, change: '+12%', color: 'bg-navy' },
  { label: 'Total Products', value: 48, change: '+4%', color: 'bg-orange' },
  { label: 'Total Categories', value: 6, change: '+2%', color: 'bg-emerald-500' },
  { label: 'Revenue', value: '₹4,445', change: '+8%', color: 'bg-sky-600' },
];

export default function AdminDashboardPage() {
  const recentOrders = ORDERS.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl text-navy">Dashboard</h1>
        <p className="text-sm text-slate-600 mt-1">
          Welcome back, Admin! Here&apos;s what&apos;s happening today.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <Card key={stat.label} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">{stat.label}</p>
                <p className="text-2xl font-semibold text-navy mt-1">{stat.value}</p>
                <p className="text-xs text-emerald-600 mt-1">{stat.change} from last month</p>
              </div>
              <div
                className={`h-12 w-12 rounded-lg ${stat.color} flex items-center justify-center text-white`}
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-heading text-xl text-navy mb-4">Recent Orders</h3>
          <div className="space-y-4">
            {recentOrders.map((order: Order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-xl border border-border p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-navy">{order.orderNumber}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(order.date).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-navy">
                    ₹{order.total.toLocaleString('en-IN')}
                  </p>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                      order.status === 'Delivered'
                        ? 'bg-emerald-50 text-emerald-700'
                        : order.status === 'Cancelled'
                          ? 'bg-red-50 text-red-700'
                          : order.status === 'Shipped'
                            ? 'bg-sky-50 text-sky-700'
                            : 'bg-amber-50 text-amber-700'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-heading text-xl text-navy mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <a
              href="/admin/products"
              className="rounded-xl border border-border p-4 hover:border-navy transition-colors"
            >
              <svg
                className="h-8 w-8 text-navy mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <p className="text-sm font-medium text-navy">Add Product</p>
            </a>
            <a
              href="/admin/categories"
              className="rounded-xl border border-border p-4 hover:border-navy transition-colors"
            >
              <svg
                className="h-8 w-8 text-navy mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              <p className="text-sm font-medium text-navy">Add Category</p>
            </a>
            <a
              href="/admin/orders"
              className="rounded-xl border border-border p-4 hover:border-navy transition-colors"
            >
              <svg
                className="h-8 w-8 text-navy mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p className="text-sm font-medium text-navy">View Orders</p>
            </a>
            <a
              href="/admin"
              className="rounded-xl border border-border p-4 hover:border-navy transition-colors"
            >
              <svg
                className="h-8 w-8 text-navy mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <p className="text-sm font-medium text-navy">Analytics</p>
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
