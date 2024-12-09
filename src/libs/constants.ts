import {
  QuickReplyItemDto,
  QuickReplyTemplateItemDto,
  RegistrationPromptOption,
} from './dto';
import { HttpRepository } from './repositories';

export const FB_GRAPH_BASE_URL = 'https://graph.facebook.com/v21.0/';
export const IG_GRAPH_BASE_URL = 'https://graph.instagram.com/v21.0/';
export const startAge = 16;

export const registrationTextSteps = [
  'registration:bio',
  'registration:location',
  'registration:name',
];

const registrationAgeOptions: RegistrationPromptOption = {
  options: Array.from({ length: 13 }, (_, index) => {
    const currentNumber = index + startAge + 1;

    return {
      title: currentNumber.toString(),
      payload: `registration:age-${currentNumber}`,
    };
  }),
  message: 'Lets create your personal card.\nHow old are you ?',
};

const registrationSexOptions: RegistrationPromptOption = {
  options: [
    { title: 'male', payload: 'registration:sex-male' },
    { title: 'female', payload: 'registration:sex-female' },
    // { title: 'none', payload: 'registration:sex-none' },
  ],
  message: 'Tell us about yourself. 1-3 short sentences',
};

const registrationSexInterestOptions: RegistrationPromptOption = {
  options: [
    { title: 'none', payload: 'registration:sex-none' },
    { title: 'male', payload: 'registration:sex-male' },
    { title: 'female', payload: 'registration:sex-female' },
  ],
  message: 'Who are you interested in ?',
};

const registrationBioOptions: RegistrationPromptOption = {
  message: 'Tell us about yourself. 1-3 short sentences',
};

const registrationLocationOptions: RegistrationPromptOption = {
  message: 'Now specify your location',
};

const registrationNameOptions: RegistrationPromptOption = {
  message: 'Finally, what is your name ?',
};

export const registrationPrompts: Record<
  string,
  (httpRepo: HttpRepository, igId: string) => Promise<any>
> = {
  'registration:age': async (httpRepo: HttpRepository, igId: string) =>
    httpRepo.sendQuickReply(
      igId,
      registrationAgeOptions.message,
      registrationAgeOptions.options,
    ),
  'registration:sex': async (httpRepo: HttpRepository, igId: string) =>
    httpRepo.sendQuickReply(
      igId,
      registrationSexOptions.message,
      registrationSexOptions.options,
    ),
  'registration:sexInterest': async (httpRepo: HttpRepository, igId: string) =>
    httpRepo.sendQuickReply(
      igId,
      registrationSexInterestOptions.message,
      registrationSexInterestOptions.options,
    ),
  'registration:bio': async (httpRepo: HttpRepository, igId: string) =>
    httpRepo.sendMessage(igId, registrationBioOptions.message, 'text'),
  'registration:location': async (httpRepo: HttpRepository, igId: string) =>
    httpRepo.sendMessage(igId, registrationLocationOptions.message, 'text'),
  'registration:name': async (httpRepo: HttpRepository, igId: string) =>
    httpRepo.sendMessage(igId, registrationNameOptions.message, 'text'),
};

export const templateButtons: Record<
  'hub' | 'scroll',
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
      title: 'Resubmit your profile',
      payload: 'resubmit',
    },
    {
      type: 'postback',
      title: 'Deactivate my profile',
      payload: 'deactivate',
    },
  ],
  scroll: [
    {
      type: 'postback',
      title: 'Like',
      payload: 'scroll:like',
    },
    {
      type: 'postback',
      title: 'Dislike',
      payload: 'scroll:dislike',
    },
  ],
};
