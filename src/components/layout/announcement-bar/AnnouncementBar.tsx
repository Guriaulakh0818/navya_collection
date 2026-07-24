'use client';

const items = [
  '🚚 Free Shipping above ₹999',
  '💳 Secure Payments',
  '📦 Easy Returns',
  '🎉 Festival Sale Live Now!',
];

export default function AnnouncementBar() {
  return (
    <div className="h-10 bg-navy text-white">
      <div className="flex h-full items-center justify-center gap-6 px-4 text-xs font-medium">
        {items.map((item) => (
          <span key={item} className="whitespace-nowrap">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
