// Global configuration for frontend

window.CONFIG = {
  API_BASE_URL: (() => {
    // Local development
    if (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1'
    ) {
      return 'http://localhost:5002/api';
    }

    // Production (GCP Cloud Run backend)
    return 'https://backend-api-822693677008.asia-south1.run.app/api';
  })(),
  
  // Google Maps API Key
  // NOTE: This key should be restricted to your domain in Google Cloud Console
  // For production, set this via backend API call or environment variable injection
  GOOGLE_MAPS_API_KEY: 'REPLACE_WITH_YOUR_API_KEY'
};
