export const serviceConfig = {
  users: {
    url: process.env.USERS_SERVICE_URL || 'http://localhost:8001',
    timeout: 10000, // 10 seconds
  },
  products: {
    url: process.env.PRODUCTS_SERVICE_URL || 'http://localhost:8002',
    timeout: 10000, // 10 seconds
  },
  checkout: {
    url: process.env.CHECKOUT_SERVICE_URL || 'http://localhost:8003',
    timeout: 10000, // 10 seconds
  },
  payments: {
    url: process.env.PAYMENTS_SERVICE_URL || 'http://localhost:8004',
    timeout: 10000, // 10 seconds
  },
} as const
