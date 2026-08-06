import './unit/pricing.test';
import './unit/cart.test';
import './unit/shiprocket-auth.test';
import './unit/shipment.test';
import './unit/courier-recommendation.test';
import './unit/awb.test';
import './unit/pickup.test';
import './unit/tracking.test';
import './unit/label.test';
import './unit/shiprocket-module.test';
import './unit/notification.test';
import './unit/brevo-auth.test';
import './unit/seo.test';
import './unit/product-seo-engine.test';
import './unit/security.test';

import { testMarketplaceIntegrationFlow } from '../../tests/integration/marketplace-flow.test';
import { testOrderSplitUnit } from '../../tests/unit/order-split.test';
import { testReviewServiceUnit } from '../../tests/unit/review-service.test';

testOrderSplitUnit();
testReviewServiceUnit();
testMarketplaceIntegrationFlow();

console.log('✅ All unit and integration tests completed successfully!');
