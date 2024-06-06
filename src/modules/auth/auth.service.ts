import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/schemas/user.schema';
import { UserRepository } from '../user/user.repository';
import { AuthDto } from './dto/auth.dto';


@Injectable()
export class AuthService {

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private userRepository: UserRepository
  ) {}

  async login(authDto: AuthDto): Promise<{ accessToken: string, refreshToken: string, expiresIn}> {
    const user = await this.validateUser(authDto);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(user);
    const expiresIn = new Date().getTime() + this.configService.get<string>('ACCESS_TOKEN_EXPIRES_IN');
    return { accessToken, refreshToken, expiresIn };
  }

  async validateUser(dto: AuthDto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await user.comparePassword(dto.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  async generateAccessToken(user: User): Promise<string> {
    const payload = { email: user.email, sub: user._id };
    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
      expiresIn: this.configService.get<string>('ACCESS_TOKEN_EXPIRES_IN'),
    });
  }

  async generateRefreshToken(user: User): Promise<string> {
    const refreshToken = this.jwtService.sign({ email: user.email, sub: user._id },
       {
        secret: this.configService.get<string>('REFRESH_TOKEN_SECRET'),
        expiresIn: this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN'),
      });
    user.addRefreshToken(refreshToken);
    await user.save();
    return refreshToken;
  }
}
