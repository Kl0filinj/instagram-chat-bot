import { UserInfoFlowType } from './common';
import {
  QuickReplyItemDto,
  QuickReplyTemplateItemDto,
  RegistrationPromptOption,
} from './dto';
import { HttpRepository } from './repositories';

export const FB_GRAPH_BASE_URL = 'https://graph.facebook.com/v21.0/';
export const IG_GRAPH_BASE_URL = 'https://graph.instagram.com/v21.0/';
export const IG_BASE_URL = 'https://www.instagram.com';
export const startAge = 16;

export const userInfoTextSteps = [
  'registration:bio',
  'resubmit:bio',
  'registration:location',
  'resubmit:location',
  'registration:name',
  'resubmit:name',
];

const userInfoAgeOptions = (
  flow: UserInfoFlowType,
): RegistrationPromptOption => {
  const text = flow === 'registration' ? 'create' : 'resubmit';
  return {
    options: Array.from({ length: 13 }, (_, index) => {
      const currentNumber = index + startAge + 1;

      return {
        title: currentNumber.toString(),
        payload: `${flow}:age-${currentNumber}`,
      };
    }),
    message: `Lets ${text} your personal card.\nHow old are you ?`,
  };
};

const userInfoSexOptions = (
  flow: UserInfoFlowType,
): RegistrationPromptOption => ({
  options: [
    { title: 'Male', payload: `${flow}:sex-male` },
    { title: 'Female', payload: `${flow}:sex-female` },
    // { title: 'none', payload: `${flow}:sex-none` },
  ],
  message: 'What gender are you ?',
});

const userInfoSexInterestOptions = (
  flow: UserInfoFlowType,
): RegistrationPromptOption => ({
  options: [
    { title: 'No Metter', payload: `${flow}:sexInterest-none` },
    { title: 'Male', payload: `${flow}:sexInterest-male` },
    { title: 'Female', payload: `${flow}:sexInterest-female` },
  ],
  message: 'Who are you interested in ?',
});

const userInfoBioOptions: RegistrationPromptOption = {
  message: 'Tell us about yourself. 1-3 short sentences',
};

const userInfoLocationOptions: RegistrationPromptOption = {
  message: 'Now specify your location',
};

const userInfoNameOptions: RegistrationPromptOption = {
  message: 'Finally, what is your name ?',
};

type PromptFunction = (httpRepo: HttpRepository, igId: string) => Promise<any>;
export const createUserInfoPrompts = (
  prefix: UserInfoFlowType,
): Record<string, PromptFunction> => ({
  [`${prefix}:age`]: async (httpRepo, igId) => {
    const options = userInfoAgeOptions(prefix);
    return httpRepo.sendQuickReply(igId, options.message, options.options);
  },
  [`${prefix}:sex`]: async (httpRepo, igId) => {
    const options = userInfoSexOptions(prefix);
    return httpRepo.sendQuickReply(igId, options.message, options.options);
  },
  [`${prefix}:sexInterest`]: async (httpRepo, igId) => {
    const options = userInfoSexInterestOptions(prefix);
    return httpRepo.sendQuickReply(igId, options.message, options.options);
  },
  [`${prefix}:bio`]: async (httpRepo, igId) =>
    httpRepo.sendMessage(igId, userInfoBioOptions.message, 'text'),
  [`${prefix}:location`]: async (httpRepo, igId) =>
    httpRepo.sendMessage(igId, userInfoLocationOptions.message, 'text'),
  [`${prefix}:name`]: async (httpRepo, igId) =>
    httpRepo.sendMessage(igId, userInfoNameOptions.message, 'text'),
});

export const templateButtons: Record<
  'hub' | 'scroll' | 'match',
  QuickReplyTemplateItemDto[]
> = {
  hub: [
    {
      type: 'postback',
      title: 'Start scrolling',
      payload: 'scroll:start',
    },
    {
      type: 'postback',
      title: 'Resubmit my profile',
      payload: 'resubmit:init',
    },
    {
      type: 'postback',
      title: 'Deactivate my profile',
      payload: 'deactivate',
    },
  ],
  scroll: [
    // {
    //   type: 'postback',
    //   title: 'Report user',
    //   payload: 'scroll:report',
    // },
    {
      type: 'postback',
      title: 'Menu',
      payload: 'scroll:menu',
    },
    {
      type: 'postback',
      title: '👍 Like',
      payload: 'scroll:like',
    },
    {
      type: 'postback',
      title: '👎 Dislike',
      payload: 'scroll:dislike',
    },
  ],
  match: [
    {
      type: 'postback',
      title: 'Like',
      payload: 'match:like',
    },
    {
      type: 'postback',
      title: 'Dislike',
      payload: 'match:dislike',
    },
  ],
};
