import { Controller, Get, Post, Body } from '@nestjs/common';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';


@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService, private userService: UserService) {}

  @Post('register')
  signup(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto)
  }
}
