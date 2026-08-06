export interface User {
  id: string;
  mobile: string;
  name?: string;
  email?: string;
  role: 'customer' | 'admin' | 'staff';
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginCredentials {
  mobile: string;
  otp: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
  errors?: string[];
}
