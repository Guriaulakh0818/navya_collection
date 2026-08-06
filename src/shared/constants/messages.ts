export const MESSAGES = {
  ERROR: {
    GENERIC: 'Something went wrong. Please try again.',
    NOT_FOUND: 'Resource not found.',
    UNAUTHORIZED: 'Please login to continue.',
    FORBIDDEN: 'You do not have permission to perform this action.',
    VALIDATION: 'Please check your input and try again.',
    NETWORK: 'Network error. Please check your connection.',
  },
  SUCCESS: {
    SAVED: 'Saved successfully.',
    UPDATED: 'Updated successfully.',
    DELETED: 'Deleted successfully.',
    ORDER_PLACED: 'Order placed successfully!',
    LOGIN: 'Welcome back!',
    SIGNUP: 'Account created successfully!',
  },
  CONFIRM: {
    DELETE: 'Are you sure you want to delete this item?',
    CANCEL_ORDER: 'Are you sure you want to cancel this order?',
  },
} as const;
