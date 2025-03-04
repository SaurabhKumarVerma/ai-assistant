import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { JwtService } from '@nestjs/jwt';
import { ClerkStrategy } from './clerk.strategy';
import { createClerkClient } from '@clerk/clerk-sdk-node';

@Injectable()
export class AuthService {
  private clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
  });

  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    private jwtService: JwtService,
    private clerkStrategy: ClerkStrategy,
  ) {}

  async validateUser(clerkId: string): Promise<UserEntity> {
    let user = await this.usersRepository.findOne({ where: { clerkId } });

    if (!user) {
      const clerkUser = await this.clerkClient.users.getUser(clerkId);
      user = this.usersRepository.create({
        clerkId,
        email: clerkUser.emailAddresses[0]?.emailAddress,
      });
      await this.usersRepository.save(user);
    }

    return user;
  }

  async loginWithClerk(token: string) {
    const userId = await this.clerkStrategy.validate(token);
    if (!userId) {
      throw new UnauthorizedException('Invalid token');
    }
    const user = await this.validateUser(userId);
    return this.login(user);
  }

  async login(user: UserEntity) {
    const payload = { sub: user.clerkId, id: user.id };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        clerkId: user.clerkId,
        email: user.email,
      },
    };
  }

  async handleClerkWebhook(webhookData: any) {
    switch (webhookData.type) {
      case 'user.created':
      case 'user.updated':
        const userData = webhookData.data;
        await this.usersRepository.upsert(
          {
            clerkId: userData.id,
            email: userData.email_addresses[0]?.email_address,
          },
          ['clerkId'],
        );
        break;
      case 'user.deleted':
        await this.usersRepository.delete({ clerkId: webhookData.data.id });
        break;
    }
  }
}