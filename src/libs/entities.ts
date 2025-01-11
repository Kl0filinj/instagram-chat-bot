import { UserSexType } from './common';

export class UserEntity {
  id: string;
  age: number | null;
  sex: UserSexType | null;
  sexInterest: UserSexType | null;
  city: string | null;
  name: string | null;
  bio: string | null;
  avatarUrl: string | null;
  rejectedUsers: string[];
  likedUsers: string[];
  isBlocked: boolean;
  isActive: boolean;
  isRegistered: boolean;
  createdAt: Date;
  lastCmd: string | null;
  localizationLang: string;
  repotrs?: any[];
}

export class ReportEntity {
  id: string;
  createdAt: Date;
  topic: string | null;
  description: string | null;
  userId: string;
  user?: UserEntity;
  reportedUserId: string;
  reportedUser?: UserEntity;
}
