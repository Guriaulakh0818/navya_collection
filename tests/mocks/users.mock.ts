export interface MockUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  role: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
}

export const MOCK_CUSTOMER: MockUser = {
  id: 'usr_cust_001',
  name: 'Priya Sharma',
  email: 'priya.sharma@example.com',
  mobile: '9876543210',
  role: 'USER',
};

export const MOCK_ADMIN: MockUser = {
  id: 'usr_admin_001',
  name: 'Navya Admin',
  email: 'admin@navyacollection.com',
  mobile: '9998887770',
  role: 'ADMIN',
};
