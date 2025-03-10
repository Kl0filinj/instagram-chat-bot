import { UserInfoFlowType } from './common';
import { allowedAvatarFileFormats, maxAvatarFileSize } from './constants';
import { AvatarFileValidationPipeDto } from './dto';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Fuse = require('fuse.js');
import * as sharp from 'sharp';
import { UnauthorizedException } from '@nestjs/common';
import { CityEntity } from './entities';

export const findCity = (
  allCities: CityEntity[],
  input: string,
): string[] | string => {
  const lowercaseInput = input.toLowerCase().trim();

  const exactMatch = allCities.find(
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

  const fuse = new Fuse(allCities, options);
  console.log('fuse : ', fuse);
  const results = fuse.search(input);

  return results
    .sort((a, b) => (a.score || 1) - (b.score || 1))
    .slice(0, 5)
    .map((result) => result.item.name);
};

export const calculateDistance = (
  sLat: number,
  sLon: number,
  eLat: number,
  eLon: number,
): number => {
  const toRad = (num: number) => (num * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(eLat - sLat);
  const dLon = toRad(eLon - sLon);
  const lat1 = toRad(sLat);
  const lat2 = toRad(eLat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const findClosestCity = (
  allCities: CityEntity[],
  city: string,
  alreadySearched: string[],
) => {
  alreadySearched = [...alreadySearched.map((item) => item.toLowerCase())];

  const currentCity = allCities.find(
    (item) => item.name.toLowerCase() === city.toLowerCase(),
  );

  const closestCities = allCities
    .filter(
      (item) =>
        item.country === currentCity.country &&
        !alreadySearched.includes(item.name.toLowerCase()),
    )
    .map((item) => ({
      ...item,
      distance: calculateDistance(
        parseFloat(currentCity.lat),
        parseFloat(currentCity.lng),
        parseFloat(item.lat),
        parseFloat(item.lng),
      ),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(1);

  return closestCities[0];
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
      i18n.t('common.ERRORS.wrong_avatar_file_extension', {
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

export const getPage = (skip: number, take: number) => {
  return skip ? Math.ceil(skip / take) + 1 : 1;
};

export const getCorsSettings = (urls: string) => ({
  origin: function (origin, callback) {
    if (!origin || urls.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, false);
      throw new UnauthorizedException('Not allowed by CORS');
    }
  },
  credentials: true,
  methods: ['POST', 'PUT', 'PATCH', 'DELETE', 'GET'],
});
