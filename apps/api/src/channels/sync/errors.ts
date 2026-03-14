export class SyncError extends Error {
  constructor(
    message: string,
    public readonly errorType: string,
    public readonly humanMessage: string,
  ) {
    super(message);
    this.name = 'SyncError';
  }
}

export class RateLimitError extends SyncError {
  constructor(message = 'API rate limit exceeded') {
    super(message, 'rate_limit', 'The channel API rate limit was exceeded. The sync will retry automatically.');
  }
}

export class AuthExpiredError extends SyncError {
  constructor(message = 'Authentication token expired and refresh failed') {
    super(message, 'auth_expired', 'The channel authentication has expired. Please reconnect the channel.');
  }
}

export class NetworkError extends SyncError {
  constructor(message = 'Network error communicating with channel API') {
    super(message, 'network_error', 'A network error occurred while communicating with the channel API.');
  }
}

export class MappingError extends SyncError {
  constructor(message = 'Failed to map external order to ShopVui format') {
    super(message, 'mapping_error', 'An error occurred while processing order data from the channel.');
  }
}
