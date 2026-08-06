export function testOrderSplitUnit() {
  console.log('--- Running Multi-Vendor Order Split Unit Tests ---');

  const cartItems = [
    { productId: 'p1', shopId: 'shop-a', name: 'Lehenga A', price: 5000, quantity: 1 },
    { productId: 'p2', shopId: 'shop-a', name: 'Dupatta A', price: 1000, quantity: 1 },
    { productId: 'p3', shopId: 'shop-b', name: 'Saree B', price: 4000, quantity: 1 },
  ];

  // Group items by shopId
  const shopGroups: Record<string, typeof cartItems> = {};
  cartItems.forEach((item) => {
    if (!shopGroups[item.shopId]) shopGroups[item.shopId] = [];
    shopGroups[item.shopId].push(item);
  });

  if (Object.keys(shopGroups).length !== 2) throw new Error('Failed to group cart items by shopId');
  if (shopGroups['shop-a'].length !== 2) throw new Error('Shop A item count mismatch');
  if (shopGroups['shop-b'].length !== 1) throw new Error('Shop B item count mismatch');

  // Calculate Shop A totals (6000 gross)
  const shopAGross = shopGroups['shop-a'].reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );
  const shopACommission = shopAGross * 0.1 + 15; // 10% + 15 Flat Fee
  const shopANetPayout = shopAGross - shopACommission;

  if (shopAGross !== 6000) throw new Error('Shop A Gross calculation mismatch');
  if (shopACommission !== 615) throw new Error('Shop A Commission calculation mismatch');
  if (shopANetPayout !== 5385) throw new Error('Shop A Net Payout calculation mismatch');

  // Calculate Shop B totals (4000 gross)
  const shopBGross = shopGroups['shop-b'].reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );
  const shopBCommission = shopBGross * 0.1 + 15;
  const shopBNetPayout = shopBGross - shopBCommission;

  if (shopBGross !== 4000) throw new Error('Shop B Gross calculation mismatch');
  if (shopBCommission !== 415) throw new Error('Shop B Commission calculation mismatch');
  if (shopBNetPayout !== 3585) throw new Error('Shop B Net Payout calculation mismatch');

  console.log('✅ Multi-Vendor Order Split Unit Tests Passed!');
}
