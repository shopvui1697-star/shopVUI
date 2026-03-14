export interface AppConfig {
  name: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}
