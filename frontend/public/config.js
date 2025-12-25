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
  })()
};
