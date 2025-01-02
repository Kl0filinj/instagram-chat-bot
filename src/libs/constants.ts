import { I18nService } from 'nestjs-i18n';
import { UserInfoFlowType } from './common';
import {
  QuickReplyItemDto,
  QuickReplyTemplateItemDto,
  RegistrationPromptOption,
  TranslateDto,
  UserInfoLanguageOptionsDto,
} from './dto';
import { HttpRepository } from './repositories';
import { RedisClientType } from 'redis';

export const FB_GRAPH_BASE_URL = 'https://graph.facebook.com/v21.0/';
export const IG_GRAPH_BASE_URL = 'https://graph.instagram.com/v21.0/';
export const IG_BASE_URL = 'https://www.instagram.com';
export const startAge = 16;

export type RedisClient = RedisClientType;
export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

export const textAnswersSteps = [
  'registration:bio',
  'resubmit:bio',
  'registration:location',
  'resubmit:location',
  'registration:name',
  'resubmit:name',
  'report:send',
];

const userInfoLanguageOptions = ({
  flow,
  i18n,
  lang,
}: UserInfoLanguageOptionsDto): RegistrationPromptOption => ({
  options: [
    { title: '🇺🇸 English', payload: `${flow}:language-en` },
    { title: '🇩🇪 German', payload: `${flow}:language-de` },
  ],
  message: i18n.t('common.REGISTRATION.language', { lang: lang }),
});

const userInfoAgeOptions = ({
  flow,
  i18n,
  lang,
}: UserInfoLanguageOptionsDto): RegistrationPromptOption => {
  return {
    options: Array.from({ length: 13 }, (_, index) => {
      const currentNumber = index + startAge + 1;

      return {
        title: currentNumber.toString(),
        payload: `${flow}:age-${currentNumber}`,
      };
    }),
    message: i18n.t('common.REGISTRATION.age', { lang: lang }),
  };
};

const userInfoSexOptions = ({
  flow,
  i18n,
  lang,
}: UserInfoLanguageOptionsDto): RegistrationPromptOption => ({
  options: [
    { title: 'Male', payload: `${flow}:sex-male` },
    { title: 'Female', payload: `${flow}:sex-female` },
    // { title: 'none', payload: `${flow}:sex-none` },
  ],
  message: i18n.t('common.REGISTRATION.sex', { lang: lang }),
});

const userInfoSexInterestOptions = ({
  flow,
  i18n,
  lang,
}: UserInfoLanguageOptionsDto): RegistrationPromptOption => ({
  options: [
    { title: 'No Metter', payload: `${flow}:sexInterest-none` },
    { title: 'Male', payload: `${flow}:sexInterest-male` },
    { title: 'Female', payload: `${flow}:sexInterest-female` },
  ],
  message: i18n.t('common.REGISTRATION.sex_interest', { lang: lang }),
});

const userInfoBioOptions = ({
  i18n,
  lang,
}: TranslateDto): RegistrationPromptOption => ({
  message: i18n.t('common.REGISTRATION.bio', { lang: lang }),
});

const userInfoLocationOptions = ({
  i18n,
  lang,
}: TranslateDto): RegistrationPromptOption => ({
  message: i18n.t('common.REGISTRATION.location', { lang: lang }),
});

const userInfoNameOptions = ({
  i18n,
  lang,
}: TranslateDto): RegistrationPromptOption => ({
  message: i18n.t('common.REGISTRATION.name', { lang: lang }),
});

type PromptFunction = (httpRepo: HttpRepository, igId: string) => Promise<any>;
export const createUserInfoPrompts = (
  dto: UserInfoLanguageOptionsDto,
): Record<string, PromptFunction> => ({
  [`${dto.flow}:language`]: async (httpRepo, igId) => {
    const options = userInfoLanguageOptions(dto);
    return httpRepo.sendQuickReply(igId, options.message, options.options);
  },

  [`${dto.flow}:age`]: async (httpRepo, igId) => {
    const options = userInfoAgeOptions(dto);
    return httpRepo.sendQuickReply(igId, options.message, options.options);
  },

  [`${dto.flow}:sex`]: async (httpRepo, igId) => {
    const options = userInfoSexOptions(dto);
    return httpRepo.sendQuickReply(igId, options.message, options.options);
  },

  [`${dto.flow}:sexInterest`]: async (httpRepo, igId) => {
    const options = userInfoSexInterestOptions(dto);
    return httpRepo.sendQuickReply(igId, options.message, options.options);
  },

  [`${dto.flow}:bio`]: async (httpRepo, igId) =>
    httpRepo.sendMessage(igId, userInfoBioOptions(dto).message, 'text'),

  [`${dto.flow}:location`]: async (httpRepo, igId) =>
    httpRepo.sendMessage(igId, userInfoLocationOptions(dto).message, 'text'),

  [`${dto.flow}:name`]: async (httpRepo, igId) =>
    httpRepo.sendMessage(igId, userInfoNameOptions(dto).message, 'text'),
});

const reportOptions: RegistrationPromptOption = {
  message: 'Your report was successfully sent !',
};

export const createReportPrompts = (
  prefix: 'report',
): Record<string, PromptFunction> => ({
  [`${prefix}:send`]: async (httpRepo, igId) =>
    httpRepo.sendMessage(igId, reportOptions.message, 'text'),
});

export const templateButtons = ({
  i18n,
  lang,
}: TranslateDto): Record<
  'hub' | 'scroll' | 'match',
  QuickReplyTemplateItemDto[]
> => ({
  hub: [
    {
      type: 'postback',
      title: i18n.t('common.MENU.start', { lang }),
      payload: 'scroll:start',
    },
    {
      type: 'postback',
      title: i18n.t('common.MENU.resubmit', { lang }),
      payload: 'resubmit:init',
    },
    {
      type: 'postback',
      title: i18n.t('common.MENU.deactivate', { lang }),
      payload: 'deactivate',
    },
  ],
  scroll: [
    {
      type: 'postback',
      title: i18n.t('common.SCROLL.menu', { lang }),
      payload: 'scroll:menu',
    },
    {
      type: 'postback',
      title: i18n.t('common.SCROLL.like', { lang }),
      payload: 'scroll:like',
    },
    {
      type: 'postback',
      title: i18n.t('common.SCROLL.dislike', { lang }),
      payload: 'scroll:dislike',
    },
  ],
  match: [
    {
      type: 'postback',
      title: i18n.t('common.MATCH.like', { lang }),
      payload: 'match:like',
    },
    {
      type: 'postback',
      title: i18n.t('common.MATCH.dislike', { lang }),
      payload: 'match:dislike',
    },
    {
      type: 'postback',
      title: i18n.t('common.MATCH.report', { lang }),
      payload: 'match:report',
    },
  ],
});
