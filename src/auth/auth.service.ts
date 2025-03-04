import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';
import { verifyToken } from '@clerk/backend';
import { TokenService } from './token.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    private tokenService: TokenService,
  ) {}

  async validateUser(clerkId: string, email?: string): Promise<UserEntity> {
    let user = await this.usersRepository.findOne({ where: { clerkId } });
    if (!user) {
      user = this.usersRepository.create({ clerkId, email });
      await this.usersRepository.save(user);
    } else if (email && !user.email) {
      user.email = email;
      await this.usersRepository.save(user);
    }
    return user;
  }

  async loginWithClerk(clerkToken: string) {
    const payload = await verifyToken(clerkToken, { secretKey: process.env.CLERK_SECRET_KEY });
    const userId = payload.sub as string;
    const userEmail = payload.email as string | undefined;
    
    const user = await this.validateUser(userId, userEmail);

    const tokens = await this.tokenService.generateTokens(user);
    
    return {
      ...tokens,
      user: { id: user.id, clerkId: user.clerkId, email: user.email },
    };
  }
}