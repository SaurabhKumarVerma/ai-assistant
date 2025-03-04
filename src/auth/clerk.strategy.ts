import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createClerkClient } from '@clerk/clerk-sdk-node';

@Injectable()
export class ClerkStrategy {
  private clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  async validate(token: string) {
    try {
      const payload = await this.clerkClient.verifyToken(token);
      return payload.sub; // 'sub' is the userId in Clerk's JWT
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}