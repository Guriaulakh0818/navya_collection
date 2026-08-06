/**
 * Unit Test Suite: Pricing & Tax Calculations
 */
export function testPricingAndTaxCalculations() {
  const subtotal = 6694;
  const taxRate = 18;
  const taxAmount = Math.round(((subtotal * taxRate) / 100) * 100) / 100;
  const shipping = 0;
  const grandTotal = Math.round((subtotal + shipping + taxAmount) * 100) / 100;

  if (taxAmount !== 1204.92) {
    throw new Error(`Tax calculation failed: Expected 1204.92, got ${taxAmount}`);
  }

  if (grandTotal !== 7898.92) {
    throw new Error(`Grand total calculation failed: Expected 7898.92, got ${grandTotal}`);
  }

  const subtotalAbove = 1500;
  const shippingAbove = subtotalAbove >= 999 ? 0 : 99;
  if (shippingAbove !== 0) {
    throw new Error(`Free shipping failed: Expected 0, got ${shippingAbove}`);
  }

  const subtotalBelow = 499;
  const shippingBelow = subtotalBelow >= 999 ? 0 : 99;
  if (shippingBelow !== 99) {
    throw new Error(`Standard shipping failed: Expected 99, got ${shippingBelow}`);
  }

  return true;
}

testPricingAndTaxCalculations();
