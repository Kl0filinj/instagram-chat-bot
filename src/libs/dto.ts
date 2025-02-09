import { I18nService } from 'nestjs-i18n';
import { UserInfoFlowType } from './common';
import { IsNotEmpty, IsString } from 'class-validator';
import { Expose } from 'class-transformer';
import { UserEntity } from './entities';
import { OmitType, PartialType } from '@nestjs/mapped-types';

export class MessageDto {
  mid: string;
  text: string;
}

export class QuickReplyPayloadDto {
  payload: string;
}

export class ReplyDto {
  mid: string;
  title: string;
  quick_reply: QuickReplyPayloadDto;
}

export class HandleStartMessageDto {
  senderId: string;
}

export class HandleReplyDto {
  text: string;
  payload: string;
  senderId: string;
}

export class QuickReplyDto {
  title: string;
  payload: string;
}

export class QuickReplyItemDto extends QuickReplyDto {
  content_type?: string;
}

export class QuickReplyTemplateItemDto {
  title: string;
  type: 'postback' | 'web_url';
  url?: string;
  payload?: string;
}

export class RegistrationPayloadDto<T> {
  value: T;
  igId: string;
}

export class RegistrationPromptOption {
  options?: QuickReplyItemDto[];
  message: string;
}

export class SendTemplateDto {
  title: string;
  image_url: string;
  subtitle: string;
  buttons: QuickReplyTemplateItemDto[];
}

export class IgUserProfileIfoDto {
  avatarUrl: string;
  username: string;
}

export class TranslateDto {
  i18n: I18nService;
  lang: string;
}

export class UserInfoLanguageOptionsDto extends TranslateDto {
  flow: UserInfoFlowType;
}

export class AvatarFileValidationPipeDto extends TranslateDto {
  file: Express.Multer.File;
}

export class TemplateButtonsDto extends TranslateDto {
  data?: string;
}

export class CityObject {
  name: string;
  country: string;
  lat: string;
  lng: string;
  admin1: string;
  admin2: string;
}

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

export class LoginResponseDto {
  accessToken: string;
}

export class AllUsersResponseDto {
  @Expose()
  id: string;

  @Expose()
  age: number;

  @Expose()
  sex: string;

  @Expose()
  sexInterest: string;

  @Expose()
  city: string;

  @Expose()
  name: string;

  @Expose()
  isBlocked: boolean;

  @Expose()
  isActive: boolean;

  @Expose()
  isRegistered: boolean;

  @Expose()
  createdAt: Date;
}

export class UserDetailsResponseDto extends AllUsersResponseDto {
  @Expose()
  bio: string;

  @Expose()
  avatarUrl: string;

  @Expose()
  localizationLang: string;
}

export class CreateNewUserDto extends OmitType(UserEntity, [
  'id',
  'avatarUrl',
  'rejectedUsers',
  'likedUsers',
  'createdAt',
  'lastCmd',
  'repotrs',
  'isRegistered',
]) {}

export class EditUserDto extends PartialType(CreateNewUserDto) {}

export class PaginatedResponse<T> {
  data: T[];
  page: number;
  total: number;
  perPage: number;
}

export class PaginationQuery {
  OR?: any[];
  AND?: any[];
  skip?: number;
  limit?: number;
  search?: string;
}
