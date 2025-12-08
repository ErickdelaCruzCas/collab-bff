// src/auth/auth.service.ts
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    Logger.log(`🔐 Autenticating user with email:${email}, and password: ${password}`, 'AuthService');
    console.log(`🔐 Autenticating user with email:${email}, and password: ${password}`, 'AuthService');
  
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    Logger.log(`🤷‍♀️ User Retrieved :${user}`, 'AuthService');
    console.log(`🤷‍♀️ User Retrieved :${user}`, 'AuthService');
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  login(user: { id: number; email: string }) {
    const payload = { sub: user.id, email: user.email };

    return {
      accessToken: this.jwt.sign(payload),
    };
  }
}
