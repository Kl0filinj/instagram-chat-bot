import * as cities from 'cities.json';
import { UserInfoFlowType } from './common';
import { allowedAvatarFileFormats, maxAvatarFileSize } from './constants';
import { AvatarFileValidationPipeDto } from './dto';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Fuse = require('fuse.js');
import * as sharp from 'sharp';

export const findCity = (input: string): string[] | string => {
  const lowercaseInput = input.toLowerCase().trim();

  interface City {
    name: string;
    country: string;
  }

  const exactMatch = (cities as City[]).find(
    (city) => city.name.toLowerCase() === lowercaseInput,
  );

  if (exactMatch) {
    return input;
  }

  const options = {
    keys: ['name'],
    threshold: 0.6,
    includeScore: true,
  };

  const fuse = new Fuse(cities as City[], options);
  console.log('fuse : ', fuse);
  const results = fuse.search(input);

  return results
    .sort((a, b) => (a.score || 1) - (b.score || 1))
    .slice(0, 5)
    .map((result) => result.item.name);
};

export const isUserInfoFlowType = (
  value: string,
): value is UserInfoFlowType => {
  return value === 'registration' || value === 'resubmit';
};

export const tryCatchPrismaWrapper = async <T>(
  arg: any,
  alternative: any,
): Promise<T> => {
  let result: T;
  try {
    result = await arg;
  } catch (err) {
    return alternative;
  }

  return result;
};

export const avatarFileValidationPipe = async ({
  file,
  i18n,
  lang,
}: AvatarFileValidationPipeDto) => {
  //* 1 - Check file size
  //* 2 - Check file extension
  //* 3 - Try to compress file
  console.log('FILE ORIG SIZE: ', file.size);

  if (file.size >= maxAvatarFileSize) {
    throw Error(
      i18n.t('common.ERRORS.max_avatar_file_size', {
        lang,
        args: { maxSize: '2' },
      }),
    );
  }

  if (!allowedAvatarFileFormats.includes(file.mimetype.split('/')[1])) {
    throw Error(
      i18n.t('common.ERRORS.max_avatar_file_size', {
        lang,
        args: { formats: allowedAvatarFileFormats.join(', ') },
      }),
    );
  }

  const compressedAvatar = await compressImage(file);

  return compressedAvatar;
};

const compressImage = async (file: Express.Multer.File) => {
  if (!file.buffer || !Buffer.isBuffer(file.buffer)) {
    return file;
  }

  if (!file.mimetype.startsWith('image/')) {
    return file;
  }
  const imageExtension = file.mimetype.split('/')[1];
  const compressionOptions = {
    quality: 70,
    progressive: true,
  };
  const sizeBeforeCompression = file.buffer.length;
  console.log('sizeBeforeCompression : ', sizeBeforeCompression);

  try {
    const compressedBuffer = await sharp(file.buffer)
      .toFormat(imageExtension as keyof sharp.FormatEnum, compressionOptions)
      .toBuffer();
    const sizeAfterCompression = compressedBuffer.length;
    console.log('sizeAfterCompression : ', sizeAfterCompression);

    return sizeAfterCompression < sizeBeforeCompression
      ? { ...file, buffer: compressedBuffer, size: compressedBuffer.length }
      : file;
  } catch (error) {
    return file;
  }
};
