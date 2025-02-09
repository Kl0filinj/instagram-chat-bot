import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import {
  AtGuard,
  LoginDto,
  EditUserDto,
  CreateNewUserDto,
  PaginationQuery,
  GetPagination,
} from '@libs';

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
  getUsers(@GetPagination() pagination: PaginationQuery) {
    return this.adminService.getAllUsers(pagination);
  }

  @Get('users/:userId')
  @UseGuards(AtGuard)
  getUserById(@Param('userId') userId: string) {
    return this.adminService.getUserById(userId);
  }

  @Post('users')
  @UseGuards(AtGuard)
  createUsers(@Body() dto: CreateNewUserDto) {
    return this.adminService.createNewUser(dto);
  }

  @Patch('users/:userId')
  @UseGuards(AtGuard)
  editUsers(@Param('userId') userId: string, @Body() dto: EditUserDto) {
    return this.adminService.editUser(dto, userId);
  }

  @Delete('users/:userId')
  @UseGuards(AtGuard)
  deleteUser(@Param('userId') userId: string) {
    return this.adminService.deleteUser(userId);
  }
}
