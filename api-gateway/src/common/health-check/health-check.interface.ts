// Compile-time probe contracts; these do not validate or serialize HTTP output.
export enum HealthStatus {
  HEALTHY = 'healthy',
  UNHEALTHY = 'unhealthy',
  DEGRADED = 'degraded',
}

export interface ServiceHealth {
  name: string
  url: string
  status: HealthStatus
  responseTime: number
  lastCheck: Date
  // Public failure text excludes upstream objects, credentials, and stack traces.
  error?: string
}
