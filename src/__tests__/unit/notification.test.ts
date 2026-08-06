import { AdminAlertService } from '../../frontend/features/notifications/services/admin-alert.service';
import { EmailService } from '../../frontend/features/notifications/services/email.service';
import { NotificationService } from '../../frontend/features/notifications/services/notification.service';
import { SmsService } from '../../frontend/features/notifications/services/sms.service';

export async function testNotificationSystemModule() {
  console.log('--- Running Notification System Unit Tests ---');

  // 1. Test SmsService
  const smsRes = await SmsService.sendSMS({
    recipientMobile: '9991983125',
    type: 'ORDER_PLACED',
    variables: {
      customerName: 'Test Customer',
      orderNumber: 'NC-2026-TEST',
      amount: 1499,
    },
  });

  if (!smsRes.success || smsRes.channel !== 'SMS') {
    throw new Error('SmsService failed to process SMS dispatch.');
  }

  // 2. Test EmailService
  const emailRes = await EmailService.sendEmail({
    recipientEmail: 'customer@example.com',
    recipientName: 'Test Customer',
    type: 'ORDER_CONFIRMED',
    variables: {
      customerName: 'Test Customer',
      orderNumber: 'NC-2026-TEST',
      amount: 1499,
      products: [{ name: 'Royal Navy Shirt', quantity: 1, price: 1499 }],
    },
  });

  if (!emailRes.success || emailRes.channel !== 'EMAIL') {
    throw new Error('EmailService failed to process Email dispatch.');
  }

  // 3. Test Central NotificationService
  const multiRes = await NotificationService.sendNotification({
    channels: ['SMS', 'EMAIL', 'IN_APP'],
    type: 'ORDER_SHIPPED',
    userId: 'test_user_id_101',
    recipientEmail: 'customer@example.com',
    recipientMobile: '9991983125',
    recipientName: 'Test Customer',
    variables: {
      customerName: 'Test Customer',
      orderNumber: 'NC-2026-TEST',
      courierName: 'BlueDart',
      trackingNumber: 'BD123456789IN',
    },
  });

  if (multiRes.length !== 3) {
    throw new Error(
      `Expected 3 dispatch results for multi-channel notification, got ${multiRes.length}`,
    );
  }

  // 4. Test AdminAlertService
  const adminRes = await AdminAlertService.notifyAdmin({
    type: 'ADMIN_NEW_ORDER',
    title: 'New High Value Order Placed',
    message: 'Order #NC-2026-TEST worth ₹1,499 received.',
    variables: {
      orderNumber: 'NC-2026-TEST',
      amount: 1499,
    },
  });

  if (!adminRes.emailResult?.success || !adminRes.smsResult?.success) {
    throw new Error('AdminAlertService failed to process admin alert dispatch.');
  }

  console.log('✅ All Notification System unit tests passed successfully!');
  return true;
}

testNotificationSystemModule();
