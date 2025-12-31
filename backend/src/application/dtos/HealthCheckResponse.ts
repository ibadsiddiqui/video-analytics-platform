/**
 * Health Check Response DTO
 */
export class HealthCheckResponse {
  status: string;
  timestamp: string;
  version: string;
  environment: string;
  services: {
    database: string;
    cache: string;
    youtube: string;
  };

  constructor(
    status: string,
    version: string,
    environment: string,
    services: {
      database: string;
      cache: string;
      youtube: string;
    }
  ) {
    this.status = status;
    this.timestamp = new Date().toISOString();
    this.version = version;
    this.environment = environment;
    this.services = services;
  }
}
