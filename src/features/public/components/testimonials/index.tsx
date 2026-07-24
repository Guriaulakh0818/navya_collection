'use client';

type TestimonialsProps = {
  items: {
    name: string;
    text: string;
  }[];
};

export function Testimonials({ items }: TestimonialsProps) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.name} className="rounded-xl bg-white p-4">
          <div className="font-semibold text-navy">{item.name}</div>
          <p className="mt-1 text-sm text-slate-600">&ldquo;{item.text}&rdquo;</p>
        </div>
      ))}
    </div>
  );
}
