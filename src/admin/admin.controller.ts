import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AtGuard, LoginDto } from '@libs';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.adminService.login(dto);
  }

  @Get('me')
  @UseGuards(AtGuard)
  getMe() {
    return { message: 'ok' };
  }

  @Get('users')
  @UseGuards(AtGuard)
  getUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('users/:userId')
  @UseGuards(AtGuard)
  getUserById(@Param('userId') userId: string) {
    return this.adminService.getUserById(userId);
  }

  @Post('users')
  @UseGuards(AtGuard)
  createUsers() {
    return null;
  }

  @Patch('users/:userId')
  @UseGuards(AtGuard)
  updateUsers(@Param('userId') userId: string) {
    return null;
  }

  @Delete('users/:userId')
  @UseGuards(AtGuard)
  deleteUser(@Param('userId') userId: string) {
    return this.adminService.deleteUser(userId);
  }
}
