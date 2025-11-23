/**
 * Shared API configuration
 * This file centralizes the API base URL so it can be used across the application
 */

export const getApiBaseUrl = (): string => {
  // Check for environment variable first, then use defaults
  return (
    process.env.NEXT_PUBLIC_API_URL || 
    'https://192.168.1.96:8443/api/v1' || 
    'http://localhost:8001/api/v1'
  );
};

