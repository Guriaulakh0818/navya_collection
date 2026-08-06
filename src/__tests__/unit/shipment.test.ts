import { ShipmentService } from '@/backend/services/shipping/shipment.service';

export function testShipmentServiceValidations() {
  console.log('--- Running ShipmentService Unit Tests ---');

  // 1. Address Validation: Invalid PIN code
  const invalidPincodeRes = ShipmentService.validateCustomerAddress({
    fullName: 'Gurvinder Singh',
    mobile: '9991983125',
    pincode: '123', // Invalid 3-digit PIN code
    addressLine1: 'Main Market Street',
    city: 'Delhi',
    state: 'Delhi',
  });

  if (invalidPincodeRes.valid !== false) {
    throw new Error('Address validation should fail for 3-digit PIN code.');
  }

  // 1b. Address Validation: Invalid Mobile Number
  const invalidMobileRes = ShipmentService.validateCustomerAddress({
    fullName: 'Gurvinder Singh',
    mobile: '1234', // Invalid mobile
    pincode: '110001',
    addressLine1: 'Flat 101, Connaught Place',
    city: 'New Delhi',
    state: 'Delhi',
  });

  if (invalidMobileRes.valid !== false) {
    throw new Error('Address validation should fail for invalid mobile number.');
  }

  // 1c. Address Validation: Valid parameters
  const validAddressRes = ShipmentService.validateCustomerAddress({
    fullName: 'Gurvinder Singh',
    mobile: '9991983125',
    pincode: '110001',
    addressLine1: 'Flat 101, Connaught Place',
    city: 'New Delhi',
    state: 'Delhi',
  });

  if (validAddressRes.valid !== true) {
    throw new Error(
      `Valid address should pass validation. Errors: ${validAddressRes.errors.join(', ')}`,
    );
  }

  // 2. Package Parameters Validation
  const invalidWeightRes = ShipmentService.validatePackageParameters(0, 10, 10, 10);
  if (invalidWeightRes.valid !== false) {
    throw new Error('Package parameters should fail when weight is 0.');
  }

  const invalidDimensionRes = ShipmentService.validatePackageParameters(0.5, 0, 10, 10);
  if (invalidDimensionRes.valid !== false) {
    throw new Error('Package parameters should fail when dimension is 0.');
  }

  const validPackageRes = ShipmentService.validatePackageParameters(0.5, 10, 10, 10);
  if (validPackageRes.valid !== true) {
    throw new Error('Package parameters should pass for valid weight and dimensions.');
  }

  // 3. Payment Method Validation (COD / Prepaid)
  const codRes = ShipmentService.validatePaymentMethod('COD');
  if (!codRes.valid || codRes.type !== 'COD') {
    throw new Error('Payment method COD should be valid.');
  }

  const prepaidRes = ShipmentService.validatePaymentMethod('RAZORPAY');
  if (!prepaidRes.valid || prepaidRes.type !== 'Prepaid') {
    throw new Error('Payment method RAZORPAY should be mapped to Prepaid and valid.');
  }

  const invalidPmRes = ShipmentService.validatePaymentMethod('CRYPTO');
  if (invalidPmRes.valid !== false) {
    throw new Error('Payment method CRYPTO should be rejected as invalid.');
  }

  console.log('✅ All ShipmentService unit tests passed successfully!');
  return true;
}

testShipmentServiceValidations();
