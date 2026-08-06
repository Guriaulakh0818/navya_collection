/**
 * Unit Test Suite: Cart Totals & Subtotal Calculations
 */
interface CartItem {
  id: string;
  price: number;
  quantity: number;
}

function calculateCartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function testCartCalculations() {
  const items: CartItem[] = [
    { id: '1', price: 699, quantity: 1 },
    { id: '2', price: 949, quantity: 1 },
    { id: '3', price: 1199, quantity: 1 },
    { id: '4', price: 1449, quantity: 1 },
  ];

  const subtotal = calculateCartSubtotal(items);
  if (subtotal !== 4296) {
    throw new Error(`Cart subtotal calculation failed: Expected 4296, got ${subtotal}`);
  }

  if (calculateCartSubtotal([]) !== 0) {
    throw new Error('Empty cart subtotal failed: Expected 0');
  }

  return true;
}

testCartCalculations();
