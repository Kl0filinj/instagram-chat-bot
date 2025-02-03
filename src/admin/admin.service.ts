import {
  AllUsersResponseDto,
  LoginDto,
  LoginResponseDto,
  options,
  EditUserDto,
  UserDetailsResponseDto,
  CreateNewUserDto,
} from '@libs';
import {
  Injectable,
  NotImplementedException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from 'src/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AdminService {
  private readonly adminUsername: string;
  private readonly adminPassword: string;

  constructor(
    private readonly jwtService: JwtService,
    private prisma: PrismaService,
  ) {
    this.adminUsername = process.env.ADMIN_USERNAME;
    this.adminPassword = process.env.ADMIN_PASSWORD;
  }

  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const { username, password } = dto;

    //* Check incoming login data
    const usernameMatch = username === this.adminUsername;
    const passwordMatch = password === this.adminPassword;

    if (!usernameMatch || !passwordMatch) {
      throw new UnauthorizedException();
    }

    const tokenPayload = { username, isAdmin: true };
    const accessToken = await this.jwtService.signAsync(tokenPayload);

    return { accessToken };
  }

  async getAllUsers() {
    const allUsers = await this.prisma.user.findMany({
      orderBy: {
        id: 'desc',
      },
    });
    const qq = plainToInstance(AllUsersResponseDto, allUsers, options);
    console.log('qq : ', qq);
    return qq;
  }

  async getUserById(userId: string) {
    const getUserById = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    // TODO: Do smth if user not found

    return plainToInstance(UserDetailsResponseDto, getUserById, options);
  }

  async createNewUser(dto: CreateNewUserDto) {
    try {
      await this.prisma.user.create({
        data: {
          id: uuidv4(),
          ...dto,
        },
      });
    } catch (error) {}
  }

  async editUser(dto: EditUserDto, userId: string) {
    try {
      await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: dto,
      });
    } catch (error) {
      throw new NotImplementedException();
    }

    return this.getUserById(userId);
  }

  async deleteUser(userId: string) {
    try {
      await this.prisma.user.delete({
        where: {
          id: userId,
        },
      });
    } catch (error) {
      throw new NotImplementedException('User was not deleted');
    }
  }
}
