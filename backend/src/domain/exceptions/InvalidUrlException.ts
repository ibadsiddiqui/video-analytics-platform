import { DomainException } from './DomainException';

/**
 * Thrown when a URL is invalid or unsupported
 */
export class InvalidUrlException extends DomainException {
  constructor(url: string, platform?: string) {
    const message = platform
      ? `Invalid ${platform} URL: ${url}`
      : `Invalid or unsupported URL: ${url}`;

    super(message, 'INVALID_URL', 400);
  }
}
