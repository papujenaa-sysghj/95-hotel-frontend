/**
 * Centralized Application Configuration
 * All environment variables are parsed here with fail-safe defaults for development and production.
 */
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  images: {
    loginHero:
      import.meta.env.VITE_LOGIN_HERO_IMAGE_URL ||
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
    checkoutHero:
      import.meta.env.VITE_CHECKOUT_HERO_IMAGE_URL ||
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=600&q=80',
  },
};

export default config;
