import {
  AllUsersResponseDto,
  LoginDto,
  LoginResponseDto,
  options,
  EditUserDto,
  UserDetailsResponseDto,
  CreateNewUserDto,
  PaginatedResponse,
  getPage,
  PaginationQuery,
} from '@libs';
import {
  Injectable,
  NotImplementedException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createId } from '@paralleldrive/cuid2';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from 'src/prisma/prisma.service';

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

  async getAllUsers(
    pagination: PaginationQuery,
  ): Promise<PaginatedResponse<AllUsersResponseDto>> {
    const { search, skip, limit, AND } = pagination;

    if (search) {
      const options = { contains: search, mode: 'insensitive' };
      AND.push({
        OR: [
          { id: options },
          { name: options },
          { city: options },
          { bio: options },
        ],
      });
    }

    const total = await this.prisma.user.count({
      where: {
        AND: AND.length ? AND : undefined,
      },
    });

    const allUsers = await this.prisma.user.findMany({
      where: {
        AND: AND.length ? AND : undefined,
      },
      take: limit,
      skip,
      orderBy: {
        id: 'desc',
      },
    });

    const formattedUsers = plainToInstance(
      AllUsersResponseDto,
      allUsers,
      options,
    );
    const page = getPage(skip, limit);

    return { data: formattedUsers, page, perPage: limit, total };
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
          id: createId(),
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
