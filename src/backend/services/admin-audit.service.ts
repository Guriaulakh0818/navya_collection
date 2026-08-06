import { logSecurityEvent } from '../security/audit-logger';

export type AdminActionType =
  | 'PRODUCT_CREATE'
  | 'PRODUCT_UPDATE'
  | 'PRODUCT_DELETE'
  | 'ORDER_STATUS_CHANGE'
  | 'COUPON_CREATE'
  | 'COUPON_DELETE'
  | 'BANNER_CREATE'
  | 'BANNER_UPDATE'
  | 'BANNER_DELETE';

export class AdminAuditService {
  /**
   * Log an administrative mutation event with full context and metadata sanitization
   */
  public static logAdminAction(
    adminId: string,
    action: AdminActionType,
    resourceId: string,
    details?: Record<string, any>,
  ) {
    const timestamp = new Date().toISOString();
    const logData = {
      adminId,
      action,
      resourceId,
      timestamp,
      ...details,
    };

    console.log(
      `[ADMIN_ACTIVITY_LOG] [${action}] Admin: ${adminId} | Resource: ${resourceId}`,
      details || '',
    );

    logSecurityEvent(
      'ADMIN_ACTION',
      `Admin action ${action} performed on ${resourceId} by ${adminId}`,
      logData,
    );
  }

  public static logProductAction(
    adminId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    productId: string,
    meta?: Record<string, any>,
  ) {
    const actionType: AdminActionType =
      action === 'CREATE'
        ? 'PRODUCT_CREATE'
        : action === 'UPDATE'
          ? 'PRODUCT_UPDATE'
          : 'PRODUCT_DELETE';
    this.logAdminAction(adminId, actionType, productId, meta);
  }

  public static logOrderStatusChange(
    adminId: string,
    orderId: string,
    previousStatus: string,
    newStatus: string,
    meta?: Record<string, any>,
  ) {
    this.logAdminAction(adminId, 'ORDER_STATUS_CHANGE', orderId, {
      previousStatus,
      newStatus,
      ...meta,
    });
  }

  public static logCouponAction(
    adminId: string,
    action: 'CREATE' | 'DELETE',
    couponId: string,
    meta?: Record<string, any>,
  ) {
    const actionType: AdminActionType = action === 'CREATE' ? 'COUPON_CREATE' : 'COUPON_DELETE';
    this.logAdminAction(adminId, actionType, couponId, meta);
  }

  public static logBannerAction(
    adminId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    bannerId: string,
    meta?: Record<string, any>,
  ) {
    const actionType: AdminActionType =
      action === 'CREATE'
        ? 'BANNER_CREATE'
        : action === 'UPDATE'
          ? 'BANNER_UPDATE'
          : 'BANNER_DELETE';
    this.logAdminAction(adminId, actionType, bannerId, meta);
  }
}
