export const config = {
    clerk: {
      secretKey: process.env.CLERK_SECRET_KEY,
      publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'your-secret-key',
    },
  };