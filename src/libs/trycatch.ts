import { NotImplementedException } from '@nestjs/common';

class TryCatchWrapperMetaDto {
  igId?: string;
  errorName?: string;
}
export async function tryCatchWrapper<T>(
  fn: any,
  meta?: TryCatchWrapperMetaDto,
): Promise<T> {
  let result: T;
  try {
    result = await fn;
  } catch (error) {
    console.log('ERROR: PRISMA', error?.message);
    throw new NotImplementedException(
      `⚠️ !WARNING! - !WARNING! - !WARNING! ⚠️\nUNPREDICTABLE ERROR WITH USER ${meta.igId}\nError name: ${meta.errorName}\n\nError body: ${error}`,
    );
  }

  return result;
}

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
