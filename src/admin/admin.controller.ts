import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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
  async login(@Body() dto: LoginDto) {
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

  @Post('users/bulk')
  @UseGuards(AtGuard)
  @UseInterceptors(FileInterceptor('file'))
  createUsersBulk(@UploadedFile() file: Express.Multer.File) {
    return this.adminService.createNewUsersBulk(file);
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

  @Delete('users/dev/all-bots')
  @UseGuards(AtGuard)
  clearAllBots() {
    return this.adminService.clearAllBots();
  }
}
