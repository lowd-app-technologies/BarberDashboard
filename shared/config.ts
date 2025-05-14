// Configuration for domain/subdomain architecture

/**
 * Environment configuration that defines domain and subdomain settings
 */
export const domainConfig = {
  // Main domain for barbershop management (admin and barber interfaces)
  mainDomain: process.env.MAIN_DOMAIN || 'barberpro.com',
  
  // Subdomain for client booking system
  bookingSubdomain: process.env.BOOKING_SUBDOMAIN || 'booking.barberpro.com',
  
  // In development environment, we use different ports to simulate domains
  isDevelopment: process.env.NODE_ENV === 'development',
  
  // API endpoints
  apiEndpoint: '/api',
  
  // Auth paths
  authPaths: {
    login: '/login',
    register: '/register',
    logout: '/api/auth/logout'
  }
};

/**
 * Helper functions to work with domains
 */
export const domainHelpers = {
  /**
   * Check if the current hostname is the booking subdomain
   */
  isBookingDomain: (hostname: string): boolean => {
    if (domainConfig.isDevelopment) {
      // In development, check if the path contains /booking
      return hostname.includes('booking') || window.location.pathname.startsWith('/booking');
    }
    
    // In production, check the actual hostname
    return hostname === domainConfig.bookingSubdomain || 
           hostname.startsWith(`booking.`);
  },
  
  /**
   * Get the appropriate API endpoint for the current domain
   */
  getApiEndpoint: (hostname: string): string => {
    return domainConfig.apiEndpoint;
  },
  
  /**
   * Get the appropriate login path for the current domain
   */
  getLoginPath: (hostname: string): string => {
    if (domainHelpers.isBookingDomain(hostname)) {
      return '/booking/login';
    }
    return domainConfig.authPaths.login;
  },
  
  /**
   * Get the appropriate registration path for the current domain
   */
  getRegisterPath: (hostname: string): string => {
    if (domainHelpers.isBookingDomain(hostname)) {
      return '/booking/register';
    }
    return domainConfig.authPaths.register;
  },
  
  /**
   * Get the base URL for redirecting
   */
  getBaseUrl: (hostname: string): string => {
    if (domainHelpers.isBookingDomain(hostname)) {
      return '/booking';
    }
    return '';
  }
};