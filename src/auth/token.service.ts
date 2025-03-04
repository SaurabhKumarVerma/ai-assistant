import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { UserEntity } from './user.entity';
import { RefreshTokenEntity } from './refresh-token.entity';

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(RefreshTokenEntity)
    private refreshTokensRepository: Repository<RefreshTokenEntity>,
    private jwtService: JwtService,
  ) {}

  async generateTokens(user: UserEntity) {
    const accessToken = this.jwtService.sign(
      { sub: user.clerkId, id: user.id },
      { secret: process.env.ACCESS_TOKEN_SECRET, expiresIn: '15m' },
    );

    const refreshToken = this.jwtService.sign(
      { sub: user.clerkId, id: user.id },
      { secret: process.env.REFRESH_TOKEN_SECRET, expiresIn: '30d' },
    );

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

    const refreshTokenEntity = this.refreshTokensRepository.create({
      token: refreshToken,
      user,
      expiresAt,
    });
    await this.refreshTokensRepository.save(refreshTokenEntity);

    return { accessToken, refreshToken };
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = this.jwtService.verify(refreshToken, {
        secret: process.env.REFRESH_TOKEN_SECRET,
      });

      const tokenEntity = await this.refreshTokensRepository.findOne({
        where: { token: refreshToken },
        relations: ['user'],
      });

      if (!tokenEntity || tokenEntity.expiresAt < new Date()) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      const accessToken = this.jwtService.sign(
        { sub: tokenEntity.user.clerkId, id: tokenEntity.user.id },
        { secret: process.env.ACCESS_TOKEN_SECRET, expiresIn: '15m' },
      );

      return { accessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}