import { DomainException } from './DomainException';

/**
 * Thrown when a video cannot be found
 */
export class VideoNotFoundException extends DomainException {
  constructor(videoId: string) {
    super(
      `Video with ID '${videoId}' was not found`,
      'VIDEO_NOT_FOUND',
      404
    );
  }
}
