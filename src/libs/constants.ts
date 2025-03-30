import {
  QuickReplyButtonsDto,
  QuickReplyTemplateItemDto,
  RegistrationPromptOption,
  TemplateButtonsDto,
  TranslateDto,
  UserInfoOptionsDto,
} from './dto';
import { HttpRepository } from './repositories';
import { RedisClientType } from 'redis';

export const FB_GRAPH_BASE_URL = 'https://graph.facebook.com/v21.0/';
export const IG_GRAPH_BASE_URL = 'https://graph.instagram.com/v21.0/';
export const IG_BASE_URL = 'https://www.instagram.com';
export const startAge = 16;

export const allowedAvatarFileFormats = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
export const maxAvatarFileSize = 2097152; // in bytes

export type RedisClient = RedisClientType;
export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

export const options = {
  excludeExtraneousValues: true,
  enableImplicitConversion: true,
  exposeUnsetFields: false,
};

export const textAnswersSteps = [
  'registration:age',
  'resubmit:age',
  'registration:bio',
  'resubmit:bio',
  'registration:location',
  'resubmit:location',
  'registration:name',
  'resubmit:name',
  'report:send',
];

export const imageAnswersSteps = ['registration:avatar', 'resubmit:avatar'];

export const userInfoMethodsChain = [
  'language',
  'age',
  'sex',
  'sexInterest',
  'bio',
  'avatar',
  'location',
  'name',
];

const createUserInfoBackOption = (flow: string, step: string) => {
  if (flow !== 'registration') {
    return [];
  }
  return [{ title: '⬅️ Back', payload: `registration:${step}-[back]` }];
};

const userInfoLanguageOptions = ({
  flow,
  i18n,
  lang,
}: UserInfoOptionsDto): RegistrationPromptOption => ({
  options: [
    { title: '🇺🇸 English', payload: `${flow}:language-en` },
    { title: '🇩🇪 German', payload: `${flow}:language-de` },
  ],
  message: i18n.t('common.REGISTRATION.language', { lang }),
});

// TODO: Check if u made right with options.payload CMDs
const userInfoResubmitOptions = ({
  i18n,
  lang,
}: UserInfoOptionsDto): RegistrationPromptOption => ({
  options: [
    {
      title: i18n.t('common.REGISTRATION.OPTIONS.all', { lang }),
      payload: `resubmit:init`,
    },
    {
      title: i18n.t('common.REGISTRATION.OPTIONS.avatar', { lang }),
      payload: `resubmit:avatar::call`,
    },
    {
      title: i18n.t('common.REGISTRATION.OPTIONS.bio', { lang }),
      payload: `resubmit:bio::call`,
    },
    {
      title: i18n.t('common.REGISTRATION.OPTIONS.age', { lang }),
      payload: `resubmit:age::call`,
    },
    {
      title: i18n.t('common.REGISTRATION.OPTIONS.language', { lang }),
      payload: `resubmit:language::call`,
    },
    {
      title: i18n.t('common.REGISTRATION.OPTIONS.location', { lang }),
      payload: `resubmit:location::call`,
    },
  ],
  message: i18n.t('common.REGISTRATION.OPTIONS.options_message', { lang }),
});

const userInfoAgeOptions = ({
  flow,
  i18n,
  lang,
}: UserInfoOptionsDto): RegistrationPromptOption => {
  return {
    options: [
      ...createUserInfoBackOption(flow, 'age'),
      ...Array.from({ length: 12 }, (_, index) => {
        const currentNumber = index + startAge + 1;

        return {
          title: currentNumber.toString(),
          payload: `${flow}:age-${currentNumber}`,
        };
      }),
    ],
    message: i18n.t('common.REGISTRATION.age', { lang }),
  };
};

const userInfoSexOptions = ({
  flow,
  i18n,
  lang,
}: UserInfoOptionsDto): RegistrationPromptOption => ({
  options: [
    ...createUserInfoBackOption(flow, 'sex'),
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
}: UserInfoOptionsDto): RegistrationPromptOption => ({
  options: [
    ...createUserInfoBackOption(flow, 'sexInterest'),
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
  flow,
  i18n,
  lang,
}: UserInfoOptionsDto): RegistrationPromptOption => ({
  options: [...createUserInfoBackOption(flow, 'bio')],
  message: i18n.t('common.REGISTRATION.bio', { lang }),
});

const userInfoAvatarOptions = ({
  flow,
  i18n,
  lang,
}: UserInfoOptionsDto): RegistrationPromptOption => ({
  options: [...createUserInfoBackOption(flow, 'avatar')],
  message: i18n.t('common.REGISTRATION.avatar', {
    lang,
    args: { maxSize: '2' },
  }),
});

const userInfoLocationOptions = ({
  flow,
  i18n,
  lang,
}: UserInfoOptionsDto): RegistrationPromptOption => ({
  options: [...createUserInfoBackOption(flow, 'location')],
  message: i18n.t('common.REGISTRATION.location', { lang }),
});

const userInfoNameOptions = ({
  flow,
  i18n,
  lang,
}: UserInfoOptionsDto): RegistrationPromptOption => ({
  options: [...createUserInfoBackOption(flow, 'name')],
  message: i18n.t('common.REGISTRATION.name', { lang }),
});

type PromptFunction = (httpRepo: HttpRepository, igId: string) => Promise<any>;
export const createUserInfoPrompts = (
  dto: UserInfoOptionsDto,
): Record<string, PromptFunction> => ({
  [`resubmit:options`]: async (httpRepo, igId) => {
    const options = userInfoResubmitOptions(dto);
    return httpRepo.sendQuickReply(igId, options.message, options.options);
  },

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

  [`${dto.flow}:bio`]: async (httpRepo, igId) => {
    if (dto.flow === 'registration') {
      const options = userInfoBioOptions(dto);
      return httpRepo.sendQuickReply(igId, options.message, options.options);
    }
    return httpRepo.sendMessage(igId, userInfoBioOptions(dto).message, 'text');
  },

  [`${dto.flow}:avatar`]: async (httpRepo, igId) => {
    if (dto.flow === 'registration') {
      const options = userInfoAvatarOptions(dto);
      return httpRepo.sendQuickReply(igId, options.message, options.options);
    }
    return httpRepo.sendMessage(
      igId,
      userInfoAvatarOptions(dto).message,
      'text',
    );
  },
  [`${dto.flow}:location`]: async (httpRepo, igId) => {
    if (dto.flow === 'registration') {
      const options = userInfoLocationOptions(dto);
      return httpRepo.sendQuickReply(igId, options.message, options.options);
    }
    return httpRepo.sendMessage(
      igId,
      userInfoLocationOptions(dto).message,
      'text',
    );
  },
  [`${dto.flow}:name`]: async (httpRepo, igId) => {
    if (dto.flow === 'registration') {
      const options = userInfoNameOptions(dto);
      return httpRepo.sendQuickReply(igId, options.message, options.options);
    }
    return httpRepo.sendMessage(igId, userInfoNameOptions(dto).message, 'text');
  },
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

const scrollQuickReplyOptions = ({
  i18n,
  lang,
}: TranslateDto): RegistrationPromptOption => ({
  options: [
    {
      title: i18n.t('common.SCROLL.menu', { lang }),
      payload: 'scroll:menu',
    },
    {
      title: i18n.t('common.SCROLL.like', { lang }),
      payload: 'scroll:like',
    },
    {
      title: i18n.t('common.SCROLL.dislike', { lang }),
      payload: 'scroll:dislike',
    },
    {
      title: i18n.t('common.MATCH.report', { lang }),
      payload: 'match:report',
    },
  ],
  message: i18n.t('common.SCROLL.options', { lang }),
});

export const quickReplyButtons = (
  dto: QuickReplyButtonsDto,
): Record<'scroll', PromptFunction> => ({
  scroll: async (httpRepo, igId) => {
    const options = scrollQuickReplyOptions(dto);
    const mappedOptions = options.options.map((item) => ({
      ...item,
      payload: `${item.payload}-${dto.targetIgId}`,
    }));
    return httpRepo.sendQuickReply(igId, options.message, mappedOptions);
  },
});

export const templateButtons = ({
  i18n,
  lang,
}: TemplateButtonsDto): Record<
  'hub' | 'match',
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
      payload: 'resubmit:options',
    },
    {
      type: 'postback',
      title: i18n.t('common.MENU.deactivate', { lang }),
      payload: 'deactivate:init',
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
