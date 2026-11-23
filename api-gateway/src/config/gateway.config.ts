// Map service names to downstream HTTP addresses and request timeouts (ms).
// Values are read once when this module is imported. ConfigModule's .env
// loading happens separately, so these reads depend on environment load order.
// Missing or empty URLs fall back to the local development addresses below.
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
} as const // Preserve literal keys and readonly types for service-name checking.
