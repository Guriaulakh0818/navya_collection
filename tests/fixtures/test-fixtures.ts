import { MOCK_PRODUCTS } from '../mocks/products.mock';
import { MOCK_CUSTOMER } from '../mocks/users.mock';

export function createTestCartState() {
  return {
    items: [
      {
        id: MOCK_PRODUCTS[0].id,
        productId: MOCK_PRODUCTS[0].id,
        name: MOCK_PRODUCTS[0].name,
        price: MOCK_PRODUCTS[0].price,
        quantity: 2,
        image: MOCK_PRODUCTS[0].images[0],
      },
    ],
    couponCode: 'WELCOME10',
  };
}

export function createTestCheckoutSession() {
  return {
    user: MOCK_CUSTOMER,
    selectedAddressId: 'addr_home_01',
    paymentMethod: 'COD',
  };
}
