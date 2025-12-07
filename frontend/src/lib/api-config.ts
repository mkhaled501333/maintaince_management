/**
 * Shared API configuration
 * This file centralizes the API base URL so it can be used across the application
 */

export const getApiBaseUrl = (): string => {
  // Check for environment variable first, then use defaults
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    'https://janssencmma.com/api/v1' ||
    'http://localhost:8001/api/v1'
  );
};

