import { DomainException } from './DomainException';

/**
 * Thrown when a service is not properly configured
 */
export class ServiceNotConfiguredException extends DomainException {
  constructor(serviceName: string, missingConfig: string) {
    super(
      `${serviceName} service is not configured. Missing: ${missingConfig}`,
      'SERVICE_NOT_CONFIGURED',
      503
    );
  }
}
