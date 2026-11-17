import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RefreshDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) { }

  async register(dto: RegisterDto) {
    const email = dto.email.toLowerCase();
    const existingUser = await this.prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      throw new ConflictException('E-mail já cadastrado.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email,
        passwordHash,
        role: 'USER',
      },
    });

    const device = await this.ensureDevice(user.id, dto.deviceId, dto.platform);
    const tokens = await this.issueTokens(user, device?.id);

    return {
      user: this.serializeUser(user),
      device,
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const email = dto.email.toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const device = await this.ensureDevice(user.id, dto.deviceId, dto.platform);
    const tokens = await this.issueTokens(user, device?.id);

    return {
      user: this.serializeUser(user),
      device,
      ...tokens,
    };
  }

  async refresh(dto: RefreshDto) {
    const refreshTokenRecords = await this.prisma.refreshToken.findMany({
      where: {
        revoked: false,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    let validRecord = null;

    for (const record of refreshTokenRecords) {
      const matches = await bcrypt.compare(dto.refreshToken, record.tokenHash);
      if (matches) {
        if (dto.deviceId && record.deviceId && record.deviceId !== dto.deviceId) {
          continue;
        }
        validRecord = record;
        break;
      }
    }

    if (!validRecord || !validRecord.user) {
      throw new UnauthorizedException('Refresh token inválido ou expirado.');
    }

    const device = dto.deviceId
      ? await this.prisma.device.findUnique({ where: { id: dto.deviceId } })
      : null;

    const tokens = await this.issueTokens(validRecord.user, device?.id ?? validRecord.deviceId ?? undefined, validRecord.id);

    return tokens;
  }

  async logout(userId: string, deviceId?: string) {
    if (deviceId) {
      await this.prisma.refreshToken.updateMany({
        where: { userId, deviceId },
        data: { revoked: true },
      });

      await this.prisma.device.update({
        where: { id: deviceId },
        data: { revoked: true },
      });

      return { success: true, deviceId };
    }

    await this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });

    return { success: true };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return this.serializeUser(user);
  }

  private async ensureDevice(userId: string, deviceId?: string, platform?: string) {
    if (!deviceId) {
      return null;
    }

    const existingDevice = await this.prisma.device.findFirst({
      where: {
        userId,
        deviceId,
      },
    });

    if (existingDevice) {
      await this.prisma.device.update({
        where: { id: existingDevice.id },
        data: {
          platform: platform ?? existingDevice.platform,
          lastSeen: new Date(),
          revoked: false,
        },
      });

      return { ...existingDevice, platform: platform ?? existingDevice.platform, lastSeen: new Date(), revoked: false };
    }

    return this.prisma.device.create({
      data: {
        userId,
        deviceId,
        platform: platform ?? 'unknown',
        lastSeen: new Date(),
      },
    });
  }

  private async issueTokens(user: User, deviceId?: string, currentRefreshTokenId?: string) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    if (currentRefreshTokenId) {
      await this.prisma.refreshToken.update({
        where: { id: currentRefreshTokenId },
        data: {
          tokenHash: refreshTokenHash,
          expiresAt,
          revoked: false,
          deviceId: deviceId ?? undefined,
        },
      });
    } else {
      await this.prisma.refreshToken.create({
        data: {
          userId: user.id,
          deviceId: deviceId ?? null,
          tokenHash: refreshTokenHash,
          expiresAt,
          revoked: false,
        },
      });
    }

    return {
      accessToken,
      refreshToken,
    };
  }

  private serializeUser(user: User) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
