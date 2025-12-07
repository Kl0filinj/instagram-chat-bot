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
  UserSexEnum,
} from '@libs';
import {
  BadRequestException,
  Injectable,
  NotImplementedException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createId } from '@paralleldrive/cuid2';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from 'src/prisma/prisma.service';
import { S3Service } from 'src/s3/s3.service';
import * as AdmZip from 'adm-zip';
import * as csv from 'csv-parser';
import { Readable } from 'stream';

@Injectable()
export class AdminService {
  private readonly adminUsername: string;
  private readonly adminPassword: string;

  constructor(
    private readonly jwtService: JwtService,
    private prisma: PrismaService,
    private s3Service: S3Service,
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

  async createNewUsersBulk(file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const zip = new AdmZip(file.buffer);
      const zipEntries = zip.getEntries();

      const csvEntry = zipEntries.find(
        (entry) =>
          !entry.isDirectory && entry.entryName.toLowerCase().endsWith('.csv'),
      );

      if (!csvEntry) {
        throw new BadRequestException('No CSV file found in the archive');
      }

      const imageEntries = zipEntries.filter(
        (entry) =>
          !entry.isDirectory &&
          (entry.entryName.toLowerCase().includes('/images/') ||
            entry.entryName.toLowerCase().includes('/avatars/')) &&
          /\.(jpg|jpeg|png|gif|webp)$/i.test(entry.entryName),
      );

      const csvData = csvEntry.getData().toString('utf8');
      const users = await this.parseCSV(csvData);

      const createdUsers = [];
      const errors = [];

      for (let i = 0; i < users.length; i++) {
        const userData = users[i];

        try {
          let avatarUrl: string | null = null;

          const imageEntry =
            imageEntries[i] ||
            imageEntries[Math.floor(Math.random() * imageEntries.length)];

          if (imageEntry) {
            const imageBuffer = imageEntry.getData();
            const fileName = imageEntry.name;
            const mimeType = this.getMimeType(fileName);

            const multerFile: Express.Multer.File = {
              buffer: imageBuffer,
              originalname: fileName,
              mimetype: mimeType,
              fieldname: 'avatar',
              encoding: '7bit',
              size: imageBuffer.length,
              stream: null,
              destination: '',
              filename: fileName,
              path: '',
            };

            const s3Key = await this.s3Service.uploadFile(multerFile);
            avatarUrl = await this.s3Service.getFileUrl(s3Key);
          }

          const sexInterest = userData.sex
            ? userData.sex?.toLowerCase() === 'male'
              ? UserSexEnum.female
              : UserSexEnum.male
            : UserSexEnum.none;
          const newUser = await this.prisma.user.create({
            data: {
              id: createId(),
              name: userData.name || null,
              age: userData.age || 18,
              sex: userData.sex || null,
              sexInterest,
              city: userData.city || null,
              bio: userData.bio || null,
              avatarUrl: avatarUrl,
              isBlocked: false,
              isActive: true,
              isRegistered: true,
              localizationLang: 'en',
              rejectedUsers: [],
              likedUsers: [],
              lastCmd: null,
            },
          });

          createdUsers.push(newUser);
        } catch (error) {
          errors.push({
            user: userData.name || 'Unknown',
            error: error.message,
          });
        }
      }

      return {
        success: true,
        created: createdUsers.length,
        errors: errors.length,
        details: {
          createdUsers: createdUsers.map((u) => ({
            id: u.id,
            name: u.name,
          })),
          errors,
        },
      };
    } catch (error) {
      throw new BadRequestException(
        `Failed to process bulk upload: ${error.message}`,
      );
    }
  }

  private parseCSV(csvData: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const results = [];
      const stream = Readable.from([csvData]);

      stream
        .pipe(csv())
        .on('data', (data) => {
          const age = data.age || data.Age;
          results.push({
            name: data.name || data.Name,
            age: age ? parseInt(age) : null,
            sex: data.sex || data.Sex,
            sexInterest:
              data.sexInterest || data.SexInterest || data['Sex Interest'],
            city: data.city || data.City,
            bio: data.bio || data.Bio,
            // isBlocked: data.isBlocked === 'true' || data.isBlocked === true,
            // isActive: data.isActive !== 'false' && data.isActive !== false,
            // isRegistered:
            //   data.isRegistered !== 'false' && data.isRegistered !== false,
            // localizationLang: data.localizationLang || data.lang || 'en',
          });
        })
        .on('end', () => resolve(results))
        .on('error', (error) => reject(error));
    });
  }

  private getMimeType(filename: string): string {
    const ext = filename.toLowerCase().split('.').pop();
    const mimeTypes = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  async clearAllBots() {
    await this.prisma.user.deleteMany({
      where: {
        id: {
          not: {
            contains: '-',
          },
        },
      },
    });
  }
}
