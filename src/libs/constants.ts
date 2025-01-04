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
  message: i18n.t('common.REGISTRATION.language', { lang }),
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
    message: i18n.t('common.REGISTRATION.age', { lang }),
  };
};

const userInfoSexOptions = ({
  flow,
  i18n,
  lang,
}: UserInfoLanguageOptionsDto): RegistrationPromptOption => ({
  options: [
    {
      title: i18n.t('common.REGISTRATION.SEX.male', { lang }),
      payload: `${flow}:sex-male`,
    },
    {
      title: i18n.t('common.REGISTRATION.SEX.female', { lang }),
      payload: `${flow}:sex-female`,
    },
    // { title: 'none', payload: `${flow}:sex-none` },
  ],
  message: i18n.t('common.REGISTRATION.SEX.message', { lang }),
});

const userInfoSexInterestOptions = ({
  flow,
  i18n,
  lang,
}: UserInfoLanguageOptionsDto): RegistrationPromptOption => ({
  options: [
    {
      title: i18n.t('common.REGISTRATION.SEX_INTEREST.no_metter', { lang }),
      payload: `${flow}:sexInterest-none`,
    },
    {
      title: i18n.t('common.REGISTRATION.SEX_INTEREST.male', { lang }),
      payload: `${flow}:sexInterest-male`,
    },
    {
      title: i18n.t('common.REGISTRATION.SEX_INTEREST.female', { lang }),
      payload: `${flow}:sexInterest-female`,
    },
  ],
  message: i18n.t('common.REGISTRATION.SEX_INTEREST.message', { lang }),
});

const userInfoBioOptions = ({
  i18n,
  lang,
}: TranslateDto): RegistrationPromptOption => ({
  message: i18n.t('common.REGISTRATION.bio', { lang }),
});

const userInfoLocationOptions = ({
  i18n,
  lang,
}: TranslateDto): RegistrationPromptOption => ({
  message: i18n.t('common.REGISTRATION.location', { lang }),
});

const userInfoNameOptions = ({
  i18n,
  lang,
}: TranslateDto): RegistrationPromptOption => ({
  message: i18n.t('common.REGISTRATION.name', { lang }),
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

//TODO: Check usage of this 2 elements (reportOptions, createReportPrompts)
const reportOptions = ({
  i18n,
  lang,
}: TranslateDto): RegistrationPromptOption => ({
  message: i18n.t('common.REPORT.name', { lang }),
});

export const createReportPrompts = (
  dto: TranslateDto,
): Record<string, PromptFunction> => ({
  ['report:send']: async (httpRepo, igId) =>
    httpRepo.sendMessage(igId, reportOptions(dto).message, 'text'),
});

const deactivateProfileInitOptions = ({
  i18n,
  lang,
}: TranslateDto): RegistrationPromptOption => ({
  options: [
    {
      title: i18n.t('common.DEACTIVATE.execute', { lang }),
      payload: 'deactivate:execute',
    },
    {
      title: i18n.t('common.DEACTIVATE.cancel', { lang }),
      payload: 'deactivate:cancel',
    },
  ],
  message: i18n.t('common.DEACTIVATE.message', { lang }),
});

export const createDeactivateProfilePrompts = (
  dto: TranslateDto,
): Record<string, PromptFunction> => ({
  ['deactivate:init']: async (httpRepo, igId) => {
    const options = deactivateProfileInitOptions(dto);
    return httpRepo.sendQuickReply(igId, options.message, options.options);
  },
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
      payload: 'deactivate:init',
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
