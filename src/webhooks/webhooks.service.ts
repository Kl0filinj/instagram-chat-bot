import { Injectable } from '@nestjs/common';
import {
  continueCmd,
  findCity,
  HandleReplyDto,
  HandleStartMessageDto,
  HttpRepository,
  isUserInfoFlowType,
  menuCmd,
  QuickReplyItemDto,
  RegistrationPayloadDto,
  createUserInfoPrompts,
  startAge,
  startCmd,
  templateButtons,
  UserEntity,
  UserInfoFlowType,
  UserSexType,
  wrongReplyBaseMessage,
  IG_BASE_URL,
  createReportPrompts,
  textAnswersSteps,
  RedisRepository,
  createDeactivateProfilePrompts,
  imageAnswersSteps,
  avatarFileValidationPipe,
  ReportEntity,
  // findClosestCity,
  CityDistance,
  CityObject,
  calculateDistance,
  findClosestCity,
} from '@libs';
import { PrismaService } from 'src/prisma/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { S3Service } from 'src/s3/s3.service';
import * as crypto from 'crypto';
// import * as citiesData from 'cities.json';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const TelegramBot = require('node-telegram-bot-api');

// TODO: REPORT SYSTEM - ✅
// TODO: DEACTIVATE USER PROFILE FUNCTIONALITY - ✅
// TODO: ADD PHOTOS UPLOAD STEP/FUNCTIONALITY - ✅
// TODO: IMPROVE CITY SEARCH - ✅
// TODO: CHANGE CMDs TO BUTTONS - ✅
// TODO: IMPROVE CODE & ARCH
// TODO: ADD EMOJI AS SIGN OF START (you know)
// TODO: ADD ERROR TryCatchFnc with logger to tg
// TODO: VALIDATION REGISTER DATA (Length) - ✅
// TODO: CHECK SUBSCRIPTION FUNCTIONALITY - 🐷⚠️🐷
// TODO: ADD GLOBAL FILTER TO CATCH TOKEN EXPIRY ERROR AND REFRESH IT
// TODO: PROJECT DOCUMENTATION
// TODO: Add Ice Breakers (OPT) - ✅

@Injectable()
export class WebhooksService {
  private readonly telegramBot = new TelegramBot(process.env.TG_ACCESS_TOKEN);
  // private cityDistanceCache = new Map<string, CityDistance[]>();
  // private cityNameMap = new Map<string, CityObject[]>();

  constructor(
    private prisma: PrismaService,
    private readonly httpRepository: HttpRepository,
    private readonly i18nService: I18nService,
    private readonly redisRepo: RedisRepository,
    private readonly s3Service: S3Service,
  ) {
    // this.initializeCityCache();
  }

  async handleMenu(igId: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: {
        id: igId,
      },
    });
    const avatarUrl = await this.s3Service.getFileUrl(targetUser.avatarUrl);
    // console.log('avatarUrl : ', avatarUrl);

    // TODO: Find all places like this and make a reusable fnc for it
    const languageT = { lang: targetUser.localizationLang };
    const nameT = this.i18nService.t('common.CARD_INFO.name', languageT);
    const ageT = this.i18nService.t('common.CARD_INFO.age', languageT);
    const locationT = this.i18nService.t(
      'common.CARD_INFO.location',
      languageT,
    );
    const aboutT = this.i18nService.t('common.CARD_INFO.about', languageT);

    await this.httpRepository.sendTemplate(targetUser.id, {
      title: `${nameT}: ${targetUser.name}`,
      subtitle: `${ageT}: ${targetUser.age}\n${locationT}: ${targetUser.city}\n${aboutT}: ${targetUser.bio}`,
      image_url: avatarUrl,
      buttons: templateButtons({ i18n: this.i18nService, ...languageT }).hub,
    });
  }

  async handleContinueRegistration(igId: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: {
        id: igId,
      },
    });

    if (!targetUser) {
      await this.handleStartMessage(igId);
      return;
    }

    // if (targetUser && targetUser.isRegistered) {
    //   await this.wrongReply(igId, targetUser.isRegistered);
    //   return;
    // }

    // if (targetUser && !targetUser.isRegistered && targetUser.lastCmd) {
    //   //* Sending last cmd to user
    //   await userInfoPrompts[targetUser.lastCmd](this.httpRepository, igId);
    //   return;
    // }

    if (targetUser && targetUser.lastCmd) {
      const flowOrigin = targetUser.lastCmd.split(':')[0];

      if (isUserInfoFlowType(flowOrigin)) {
        const currentUserInfoPrompt = createUserInfoPrompts({
          flow: flowOrigin,
          i18n: this.i18nService,
          lang: targetUser.localizationLang,
        });
        await currentUserInfoPrompt[targetUser.lastCmd](
          this.httpRepository,
          igId,
        );
        return;
      }
    }

    await this.wrongReply(igId);
    return;
  }

  async handleStartMessage(igId: string) {
    //* Check if user is already registered - do smth (check schema)
    //* If user is new and already started registration - do smth (check schema)
    //* If user is new  - do smth (check schema)

    const targetUser = await this.prisma.user.findUnique({
      where: {
        id: igId,
      },
    });

    if (!targetUser) {
      await this.userInfoFlow('registration:init', igId);
      return;
    }

    if (targetUser && targetUser.isRegistered) {
      await this.wrongReply(igId);
      return;
    }

    if (targetUser && !targetUser.isRegistered) {
      await this.handleContinueRegistration(igId);
      return;
    }

    await this.wrongReply(igId);
    return;
  }

  private async startFlow(igId: string) {
    //* Check is user subscribed to main acc
    //* IF Yes - Send message about start of registration and quick replie with first question
    //* IF No - Send message to subscribe and quick reply to check

    const isSubscribed = true; // await this.checkSubscription();
    // console.log('isSubscribed : ', isSubscribed);

    if (isSubscribed) {
      await this.userInfoInitStep(igId, 'registration');
      return;
    } else {
      // TODO: Maybe change from message to template
      await this.httpRepository.sendMessage(
        igId,
        'Dear customer, you need to subscribed to our instagram page to registrate and use bot',
        'text',
      );
      return;
    }
  }

  // private async continueFlow(igId: string) {
  //   //* Check last send cmd and send it again
  // }

  private async checkSubscription() {
    const followersResponse = await this.httpRepository.getFollowers();
    // console.log('followersResponse : ', followersResponse);
  }

  async handleReply(dto: HandleReplyDto) {
    const { senderId, text, payload } = dto;
    const generalFlow = payload.split(':')[0];
    console.log('payload (FLOW) : ', payload);

    switch (generalFlow) {
      case 'resubmit':
      case 'registration':
        await this.userInfoFlow(payload, senderId);
        return;
      case 'scroll':
        await this.scrollFlow(payload, senderId);
        return;
      case 'match':
        await this.matchFlow(payload, senderId);
        return;
      case 'deactivate':
        await this.deactivateProfileFlow(payload, senderId);
        return;
      case 'report':
        await this.reportFlow(payload, senderId);
      case 'start_cmd':
        await this.handleStartMessage(senderId);
      case 'continue_cmd':
        await this.handleContinueRegistration(senderId);
      case 'hub_cmd':
        await this.handleMenu(senderId);
        return;
      default:
        await this.wrongReply(payload);
        return;
    }
  }

  async userInfoFlow(flow: string, igId: string) {
    const userInfoFlow = flow.split('-')[0];
    const userInfoValuePart = flow.split('-');
    const userInfoValue = userInfoValuePart
      .slice(1, userInfoValuePart.length)
      .join('-');

    const flowOrigin = flow.split(':')[0];

    // console.log('userInfoFlow : ', userInfoFlow);
    // console.log('userInfoValue : ', userInfoValue);
    // console.log('flowOrigin : ', flowOrigin);

    if (!isUserInfoFlowType(flowOrigin)) {
      await this.unpredictableError(igId, 'User flow type error');
      return;
    }

    switch (userInfoFlow) {
      case 'resubmit:init':
      case 'registration:init':
        await this.userInfoInitStep(igId, flowOrigin);
        return;
      case 'resubmit:language':
      case 'registration:language':
        await this.languageStep(igId, userInfoValue, flowOrigin);
        return;
      case 'resubmit:age':
      case 'registration:age':
        await this.ageStep(igId, parseInt(userInfoValue), flowOrigin);
        return;
      case 'resubmit:sex':
      case 'registration:sex':
        await this.sexStep(igId, userInfoValue as UserSexType, flowOrigin);
        return;
      case 'resubmit:sexInterest':
      case 'registration:sexInterest':
        await this.sexInterestStep(
          igId,
          userInfoValue as UserSexType,
          flowOrigin,
        );
        return;
      case 'resubmit:bio':
      case 'registration:bio':
        await this.bioStep(igId, userInfoValue, flowOrigin);
        return;
      case 'resubmit:avatar':
      case 'registration:avatar':
        await this.avatarStep(igId, userInfoValue, flowOrigin);
        return;
      case 'resubmit:location':
      case 'registration:location':
        await this.locationStep(igId, userInfoValue, flowOrigin);
        return;
      case 'resubmit:name':
      case 'registration:name':
        await this.nameStep(igId, userInfoValue);
        return;
      default:
        await this.wrongReply(igId);
        return;
    }
  }

  private async userInfoInitStep(igId: string, flow: UserInfoFlowType) {
    const targetUser = await this.prisma.user.findUnique({
      where: {
        id: igId,
      },
    });

    if (targetUser) {
      await this.handleMenu(igId);
      return;
    }

    const currentStepCmd = `${flow}:language`;
    // await this.setLastStep(igId, currentStepCmd);
    const currentUserInfoPrompt = createUserInfoPrompts({
      flow,
      i18n: this.i18nService,
      lang: 'en',
    });
    await currentUserInfoPrompt[currentStepCmd](this.httpRepository, igId);
    return;
  }

  private async languageStep(
    igId: string,
    language: string,
    flow: UserInfoFlowType,
  ) {
    try {
      if (flow === 'registration') {
        await this.prisma.user.create({
          data: {
            id: igId,
            localizationLang: language,
          },
        });
      } else if (flow === 'resubmit') {
        await this.prisma.user.update({
          where: {
            id: igId,
          },
          data: {
            localizationLang: language,
          },
        });
      }

      await this.redisRepo.setUserLocalizationLang(igId, language);
    } catch (error) {
      console.log('ERROR: languageStep PRISMA or REDIS', error?.message);
      await this.unpredictableError(
        igId,
        'languageStep PRISMA or REDIS',
        JSON.stringify(error, null, ' '),
      );
      return;
    }

    const currentStepCmd = `${flow}:age`;
    await this.setLastStep(igId, `${flow}:age`);
    const currentUserInfoPrompt = createUserInfoPrompts({
      flow,
      i18n: this.i18nService,
      lang: language,
    });
    await currentUserInfoPrompt[currentStepCmd](this.httpRepository, igId);
    return;
  }

  private async ageStep(igId: string, age: number, flow: UserInfoFlowType) {
    let user: UserEntity;

    try {
      user = await this.prisma.user.update({
        where: {
          id: igId,
        },
        data: {
          age,
        },
      });
    } catch (error) {
      console.log('ERROR: ageStep PRISMA', error?.message);
      await this.unpredictableError(
        igId,
        'ageStep PRISMA',
        JSON.stringify(error, null, ' '),
      );
      return;
    }

    const currentStepCmd = `${flow}:sex`;
    await this.setLastStep(igId, currentStepCmd);
    const currentUserInfoPrompt = createUserInfoPrompts({
      flow,
      i18n: this.i18nService,
      lang: user.localizationLang,
    });
    await currentUserInfoPrompt[currentStepCmd](this.httpRepository, igId);
    return;
  }

  private async sexStep(
    igId: string,
    sex: UserSexType,
    flow: UserInfoFlowType,
  ) {
    let user: UserEntity;
    try {
      user = await this.prisma.user.update({
        where: {
          id: igId,
        },
        data: {
          sex,
        },
      });
    } catch (error) {
      console.log('ERROR: sexStep PRISMA', error?.message);
      await this.unpredictableError(
        igId,
        'sexStep PRISMA',
        JSON.stringify(error, null, ' '),
      );
      return;
    }

    const currentStepCmd = `${flow}:sexInterest`;
    await this.setLastStep(igId, `${flow}:sexInterest`);
    const currentUserInfoPrompt = createUserInfoPrompts({
      flow,
      i18n: this.i18nService,
      lang: user.localizationLang,
    });
    await currentUserInfoPrompt[currentStepCmd](this.httpRepository, igId);
    return;
  }

  private async sexInterestStep(
    igId: string,
    sexInterest: UserSexType,
    flow: UserInfoFlowType,
  ) {
    let user: UserEntity;
    try {
      user = await this.prisma.user.update({
        where: {
          id: igId,
        },
        data: {
          sexInterest,
        },
      });
    } catch (error) {
      console.log('ERROR: sexInterest PRISMA', error?.message);
      await this.unpredictableError(
        igId,
        'sexInterest PRISMA',
        JSON.stringify(error, null, ' '),
      );
      return;
    }

    const currentStepCmd = `${flow}:bio`;
    await this.setLastStep(igId, `${flow}:bio`);
    const currentUserInfoPrompt = createUserInfoPrompts({
      flow,
      i18n: this.i18nService,
      lang: user.localizationLang,
    });
    await currentUserInfoPrompt[currentStepCmd](this.httpRepository, igId);
    return;
  }

  private async bioStep(igId: string, bio: string, flow: UserInfoFlowType) {
    const pureBioLength = bio.trim().length;

    if (pureBioLength === 0 || pureBioLength >= 100) {
      const lang = await this.defineUserLocalization(igId);
      await this.httpRepository.sendMessage(
        igId,
        this.i18nService.t('common.ERRORS.message_length', {
          lang,
          args: { length: 100 },
        }),
        'text',
      );
      return;
    }

    let user: UserEntity;
    try {
      user = await this.prisma.user.update({
        where: {
          id: igId,
        },
        data: {
          bio,
        },
      });
    } catch (error) {
      console.log('ERROR: bioStep PRISMA', error?.message);
      await this.unpredictableError(
        igId,
        'bioStep PRISMA',
        JSON.stringify(error, null, ' '),
      );
      return;
    }

    const currentStepCmd = `${flow}:avatar`;
    await this.setLastStep(igId, `${flow}:avatar`);
    const currentUserInfoPrompt = createUserInfoPrompts({
      flow,
      i18n: this.i18nService,
      lang: user.localizationLang,
    });
    await currentUserInfoPrompt[currentStepCmd](this.httpRepository, igId);
    return;
  }

  private async avatarStep(
    igId: string,
    igAvatarUrl: string,
    flow: UserInfoFlowType,
  ) {
    let validatedAvatarFile: Express.Multer.File;
    const lang = await this.defineUserLocalization(igId);

    try {
      const avatarFile = await this.httpRepository.getIgImageFile(igAvatarUrl);
      validatedAvatarFile = await avatarFileValidationPipe({
        file: avatarFile,
        i18n: this.i18nService,
        lang,
      });
    } catch (error) {
      await this.httpRepository.sendMessage(
        igId,
        error.message ||
          this.i18nService.t('common.ERRORS.avatar_upload_unpredictable', {
            lang,
          }),
        'text',
      );
      return;
    }

    let avatarKey: string;
    // console.log('validatedAvatarFile : ', validatedAvatarFile);

    try {
      avatarKey = await this.s3Service.uploadFile(validatedAvatarFile);
    } catch (error) {
      console.log('ERROR: avatarStep S3 uploadFile', error?.message);
      await this.unpredictableError(
        igId,
        'avatarStep S3 uploadFile',
        JSON.stringify(error, null, ' '),
      );
      return;
    }

    let user: UserEntity;
    try {
      user = await this.prisma.user.update({
        where: {
          id: igId,
        },
        data: {
          avatarUrl: avatarKey,
        },
      });
    } catch (error) {
      console.log('ERROR: avatarStep PRISMA', error?.message);
      await this.unpredictableError(
        igId,
        'avatarStep PRISMA',
        JSON.stringify(error, null, ' '),
      );
      return;
    }

    const currentStepCmd = `${flow}:location`;
    await this.setLastStep(igId, `${flow}:location`);
    const currentUserInfoPrompt = createUserInfoPrompts({
      flow,
      i18n: this.i18nService,
      lang: user.localizationLang,
    });
    await currentUserInfoPrompt[currentStepCmd](this.httpRepository, igId);
    return;
  }

  private async locationStep(
    igId: string,
    location: string,
    flow: UserInfoFlowType,
  ) {
    const findCityResp = findCity(location);
    // console.log('findCityResp : ', findCityResp);

    if (findCityResp !== location && Array.isArray(findCityResp)) {
      const localizationLang = await this.defineUserLocalization(igId);
      const formattedCities = findCityResp.reduce(
        (acc, item) => acc + `\n- ${item}`,
        '',
      );
      await this.httpRepository.sendMessage(
        igId,
        `${this.i18nService.t('common.REGISTRATION.location_available', {
          lang: localizationLang,
        })}: ${formattedCities}`,
        'text',
      );
      return;
    }

    let user: UserEntity;
    try {
      user = await this.prisma.user.update({
        where: {
          id: igId,
        },
        data: {
          city: location,
        },
      });
    } catch (error) {
      console.log('ERROR: locationStep PRISMA', error?.message);
      await this.unpredictableError(
        igId,
        'locationStep PRISMA',
        JSON.stringify(error, null, ' '),
      );
      return;
    }

    const currentStepCmd = `${flow}:name`;
    await this.setLastStep(igId, `${flow}:name`);
    const currentUserInfoPrompt = createUserInfoPrompts({
      flow,
      i18n: this.i18nService,
      lang: user.localizationLang,
    });
    await currentUserInfoPrompt[currentStepCmd](this.httpRepository, igId);
    return;
  }

  private async nameStep(igId: string, name: string) {
    const pureNameLength = name.trim().length;

    if (pureNameLength === 0 || pureNameLength >= 30) {
      const lang = await this.defineUserLocalization(igId);
      await this.httpRepository.sendMessage(
        igId,
        this.i18nService.t('common.ERRORS.message_length', {
          lang,
          args: { length: 30 },
        }),
        'text',
      );
      return;
    }

    let user: UserEntity;
    try {
      user = await this.prisma.user.update({
        where: {
          id: igId,
        },
        data: {
          name,
          isRegistered: true,
          lastCmd: null,
        },
      });
    } catch (error) {
      console.log('ERROR: nameStep PRISMA', error?.message);
      await this.unpredictableError(
        igId,
        'nameStep PRISMA',
        JSON.stringify(error, null, ' '),
      );
      return;
    }

    const avatarUrl = await this.s3Service.getFileUrl(user.avatarUrl);
    const languageT = { lang: user.localizationLang };
    const nameT = this.i18nService.t('common.CARD_INFO.name', languageT);
    const ageT = this.i18nService.t('common.CARD_INFO.age', languageT);
    const locationT = this.i18nService.t(
      'common.CARD_INFO.location',
      languageT,
    );
    const aboutT = this.i18nService.t('common.CARD_INFO.about', languageT);
    const titleT = this.i18nService.t('common.CARD_INFO.title', languageT);

    await this.httpRepository.sendTemplate(igId, {
      title: titleT,
      subtitle: `${nameT}: ${user.name}\n${ageT}: ${user.age}\n${locationT}: ${user.city}\n${aboutT}: ${user.bio}`,
      image_url: avatarUrl,
      buttons: templateButtons({ i18n: this.i18nService, ...languageT }).hub,
    });
  }

  private async setLastStep(igId: string, lastStep: string) {
    try {
      await this.prisma.user.update({
        where: {
          id: igId,
        },
        data: {
          lastCmd: lastStep,
        },
      });
    } catch (error) {
      console.log('LAST STEP UPDATE - FAILED : ', error);
      await this.unpredictableError(
        igId,
        'setLastStep PRISMA',
        JSON.stringify(error, null, ' '),
      );
    }
  }

  async isTextAnswerStep(igId: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: {
        id: igId,
      },
    });

    if (!targetUser) {
      return false;
    }

    if (textAnswersSteps.includes(targetUser.lastCmd)) {
      return targetUser.lastCmd;
    }

    return false;
  }

  async isImageAnswerStep(igId: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: {
        id: igId,
      },
    });

    if (!targetUser) {
      return false;
    }

    if (imageAnswersSteps.includes(targetUser.lastCmd)) {
      return targetUser.lastCmd;
    }

    return false;
  }

  private async deactivateProfileFlow(flow: string, igId: string) {
    const deactivateProfileFlow = flow.split('-')[0];
    const deactivateProfileValue = flow.split('-')[1];

    // console.log('deactivateProfileFlow : ', deactivateProfileFlow);
    // console.log('deactivateProfileValue : ', deactivateProfileValue);

    switch (deactivateProfileFlow) {
      case 'deactivate:init':
        await this.deactivateProfileInit(igId);
        return;
      case 'deactivate:execute':
        await this.deactivateProfileExecute(igId);
        return;
      case 'deactivate:cancel':
        await this.deactivateProfileCancel(igId);
        return;
      default:
        await this.wrongReply(igId);
        return;
    }
  }

  private async deactivateProfileInit(igId: string) {
    const localization = await this.defineUserLocalization(igId);
    const currentStepCmd = 'deactivate:init';
    await this.setLastStep(igId, currentStepCmd);
    const currentdeactivatePrompt = createDeactivateProfilePrompts({
      i18n: this.i18nService,
      lang: localization,
    });
    await currentdeactivatePrompt[currentStepCmd](this.httpRepository, igId);
    return;
  }

  private async deactivateProfileExecute(igId: string) {
    let user: UserEntity;

    try {
      user = await this.prisma.user.update({
        where: {
          id: igId,
        },
        data: {
          isActive: false,
          lastCmd: null,
        },
      });
    } catch (error) {
      console.log('ERROR: deactivateProfileExecute PRISMA', error?.message);
      await this.unpredictableError(
        igId,
        'deactivateProfileExecute PRISMA',
        JSON.stringify(error, null, ' '),
      );
      return;
    }

    await this.httpRepository.sendMessage(
      igId,
      this.i18nService.t('common.DEACTIVATE.execute_success', {
        lang: user.localizationLang,
      }),
      'text',
    );
    await this.handleMenu(igId);

    return;
  }

  private async deactivateProfileCancel(igId: string) {
    try {
      await this.prisma.user.update({
        where: {
          id: igId,
        },
        data: {
          lastCmd: null,
        },
      });
    } catch (error) {
      console.log('ERROR: deactivateProfileCancel PRISMA', error?.message);
      await this.unpredictableError(
        igId,
        'deactivateProfileCancel PRISMA',
        JSON.stringify(error, null, ' '),
      );
      return;
    }
    await this.handleMenu(igId);

    return;
  }

  private async reportFlow(flow: string, igId: string) {
    const reportFlow = flow.split('-')[0];
    const reportValuePart = flow.split('-');
    const reportValue = reportValuePart
      .slice(1, reportValuePart.length)
      .join('-');

    // console.log('reportFlow : ', reportFlow);
    // console.log('reportValue : ', reportValue);

    // TODO: Probably need to add report:init here
    switch (reportFlow) {
      case 'report:send':
        await this.reportSend(igId, reportValue);
        return;
      default:
        await this.wrongReply(igId);
        return;
    }
  }

  private async reportSend(igId: string, reportText: string) {
    const pureReportLength = reportText.trim().length;

    if (pureReportLength === 0 || pureReportLength > 250) {
      const lang = await this.defineUserLocalization(igId);
      await this.httpRepository.sendMessage(
        igId,
        this.i18nService.t('common.ERRORS.message_length', {
          lang,
          args: { length: 250 },
        }),
        'text',
      );
      return;
    }

    const ourUser = await this.prisma.user.update({
      where: {
        id: igId,
      },
      data: {
        lastCmd: null,
      },
    });

    let report: ReportEntity;

    try {
      report = await this.prisma.$transaction(async (tx) => {
        const findReport = await tx.reports.findFirst({
          where: {
            userId: igId,
            description: null,
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        if (!findReport) throw new Error('REPORT TO UPD NOT FOUND');

        const updReport = await tx.reports.update({
          where: {
            id: findReport.id,
          },
          data: {
            description: reportText,
          },
        });

        await tx.user.update({
          where: {
            id: igId,
          },
          data: {
            rejectedUsers: {
              push: updReport.reportedUserId,
            },
          },
        });

        return updReport;
      });
    } catch (error) {
      console.log('ERROR: report send PRISMA', error?.message);
      await this.unpredictableError(
        igId,
        'report send PRISMA',
        JSON.stringify(error, null, ' '),
      );
      return;
    }

    //* Send reportText to tg
    const telegramRes = await this.telegramBot.sendMessage(
      process.env.TG_CHAT_ID,
      `REPORT FROM USER\n\nFROM:\nName: ${ourUser.name}\nId: ${ourUser.id}\n\nTO:\nId: ${report.reportedUserId}\n\nMessage :"${reportText}"`,
      {
        message_thread_id: 2,
      },
    );
    console.log('telegramRes : ', telegramRes);

    await this.httpRepository.sendMessage(
      igId,
      this.i18nService.t('common.REPORT.sent_success', {
        lang: ourUser.localizationLang,
      }),
      'text',
    );
    await this.handleMenu(igId);
    return;
  }

  private async matchFlow(flow: string, igId: string) {
    const matchFlow = flow.split('-')[0];
    const matchValue = flow.split('-')[1];

    // console.log('matchFlow : ', matchFlow);
    // console.log('matchValue : ', matchValue);

    switch (matchFlow) {
      case 'match:like':
        await this.matchLike(igId, matchValue);
        return;
      case 'match:dislike':
        await this.matchDislike(igId);
        return;
      case 'match:report':
        await this.matchReport(igId, matchValue);
        return;
      default:
        await this.wrongReply(igId);
        return;
    }
  }

  private async matchLike(igId: string, targetUserId: string) {
    const ourUser = await this.prisma.user.update({
      where: {
        id: igId,
      },
      data: {
        likedUsers: {
          push: targetUserId,
        },
      },
    });

    const targetUser = await this.prisma.user.update({
      where: {
        id: targetUserId,
      },
      data: {
        likedUsers: {
          push: igId,
        },
      },
    });

    const { username: ourUserNickname } =
      await this.httpRepository.getProfileInfo(ourUser.id);
    const { username: targetUserNickname } =
      await this.httpRepository.getProfileInfo(targetUser.id);
    const targetAvatarUrl = await this.s3Service.getFileUrl(
      targetUser.avatarUrl,
    );
    const ourAvatarUrl = await this.s3Service.getFileUrl(ourUser.avatarUrl);

    await this.httpRepository.sendTemplate(ourUser.id, {
      title: this.i18nService.t('common.MATCH.target_user_match', {
        lang: targetUser.localizationLang,
        args: { name: targetUser.name },
      }),
      subtitle: '',
      image_url: targetAvatarUrl,
      buttons: [
        {
          type: 'web_url',
          url: `${IG_BASE_URL}/${targetUserNickname}`,
          title: `${targetUser.name}'s profile`,
        },
        {
          type: 'postback',
          payload: 'scroll:start',
          title: 'Continue scrolling',
        },
      ],
    });
    await this.httpRepository.sendTemplate(targetUser.id, {
      title: this.i18nService.t('common.MATCH.other_user_match', {
        lang: ourUser.localizationLang,
        args: { name: ourUser.name },
      }),
      subtitle: '',
      image_url: ourAvatarUrl,
      buttons: [
        {
          type: 'web_url',
          url: `${IG_BASE_URL}/${ourUserNickname}`,
          title: `${ourUser.name}'s profile`,
        },
        {
          type: 'postback',
          payload: 'scroll:start',
          title: 'Continue scrolling',
        },
      ],
    });
    return;
  }

  private async matchDislike(igId: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: {
        id: igId,
      },
    });
    await this.scrollSendNextUser(targetUser);
    return;
  }

  private async matchReport(igId: string, reportedUserId: string) {
    let user: UserEntity;

    try {
      user = await this.prisma.user.update({
        where: {
          id: igId,
        },
        data: {
          lastCmd: 'report:send',
        },
      });

      await this.prisma.reports.create({
        data: {
          reportedUser: {
            connect: {
              id: reportedUserId,
            },
          },
          user: {
            connect: {
              id: igId,
            },
          },
        },
      });
    } catch (error) {
      console.log('ERROR: matchReport PRISMA', error?.message);
      await this.unpredictableError(
        igId,
        'matchReport PRISMA',
        JSON.stringify(error, null, ' '),
      );
      return;
    }

    await this.httpRepository.sendMessage(
      igId,
      this.i18nService.t('common.REPORT.describe', {
        lang: user.localizationLang,
      }),
      'text',
    );
    return;
  }

  private async scrollFlow(flow: string, igId: string) {
    const scrollFlow = flow.split('-')[0];
    const scrollValue = flow.split('-')[1];

    // console.log('scrollFlow : ', scrollFlow);
    // console.log('scrollValue : ', scrollValue);

    switch (scrollFlow) {
      case 'scroll:start':
        await this.scrollStart(igId);
        return;
      case 'scroll:like':
        await this.scrollLike(igId, scrollValue);
        return;
      case 'scroll:dislike':
        await this.scrollDislike(igId, scrollValue);
        return;
      case 'scroll:menu':
        await this.handleMenu(igId);
        return;
      // case 'scroll:report':
      //   await this.handleReport(igId);
      //   return;
      default:
        await this.wrongReply(igId);
        return;
    }
  }

  private async scrollStart(igId: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: {
        id: igId,
      },
    });

    await this.scrollSendNextUser(targetUser);
    return;
  }

  private async scrollLike(igId: string, targetIgId: string) {
    const ourUser = await this.prisma.user.update({
      where: {
        id: igId,
      },
      data: {
        likedUsers: {
          push: targetIgId,
        },
      },
    });
    const targetUser = await this.prisma.user.findUnique({
      where: {
        id: targetIgId,
      },
    });

    if (!targetUser.rejectedUsers.includes(ourUser.id)) {
      const avatarUrl = await this.s3Service.getFileUrl(ourUser.avatarUrl);
      const languageT = { lang: targetUser.localizationLang };
      const nameT = this.i18nService.t('common.CARD_INFO.name', languageT);
      const ageT = this.i18nService.t('common.CARD_INFO.age', languageT);
      const locationT = this.i18nService.t(
        'common.CARD_INFO.location',
        languageT,
      );
      const aboutT = this.i18nService.t('common.CARD_INFO.about', languageT);
      const titleT = this.i18nService.t('common.SCROLL.aside_like', languageT);

      await this.httpRepository.sendTemplate(targetIgId, {
        title: titleT,
        subtitle: `${nameT}: ${ourUser.name}\n${ageT}: ${ourUser.age}\n${locationT}: ${ourUser.city}\n${aboutT}: ${ourUser.bio}`,
        image_url: avatarUrl,
        buttons: templateButtons({
          i18n: this.i18nService,
          ...languageT,
        }).match.map((item) => ({
          ...item,
          payload: `${item.payload}-${ourUser.id}`,
        })),
      });
    }

    await this.scrollSendNextUser(ourUser);
  }

  private async scrollDislike(igId: string, targetIgId: string) {
    const targetUser = await this.prisma.user.update({
      where: {
        id: igId,
      },
      data: {
        rejectedUsers: {
          push: targetIgId,
        },
      },
    });

    await this.scrollSendNextUser(targetUser);
  }

  private async scrollSendNextUser(targetUser: UserEntity) {
    if (!targetUser.isActive) {
      try {
        await this.prisma.user.update({
          where: {
            id: targetUser.id,
          },
          data: {
            isActive: true,
          },
        });
      } catch (error) {
        console.log(
          'ERROR: scrollSendNextUser:set isActive:true PRISMA',
          error?.message,
        );
        await this.unpredictableError(
          targetUser.id,
          'scrollSendNextUser:set isActive:true PRISMA',
          JSON.stringify(error, null, ' '),
        );
        return;
      }
    }

    await this.httpRepository.sendMessage(targetUser.id, '✨🔎', 'text');

    const languageT = { lang: targetUser.localizationLang };
    const ageOptions: Record<UserSexType, any> = {
      male: {
        minAgeLimit: targetUser.age - 2,
        maxAgeLimit: targetUser.age + 1,
      },
      female: {
        minAgeLimit: targetUser.age - 1,
        maxAgeLimit: targetUser.age + 2,
      },
      none: {
        minAgeLimit: targetUser.age - 2,
        maxAgeLimit: targetUser.age + 2,
      },
    };
    const currentAgeOption = ageOptions[targetUser.sex];

    const findNextUser = async (
      city: string,
      alreadySearched = [],
      depth = 0,
    ) => {
      const maxDepth = 2000;
      // console.log('depth : ', depth);
      // console.log(
      //   'alreadySearched : ',
      //   alreadySearched[alreadySearched.length - 1],
      // );

      if (depth >= maxDepth) {
        return undefined;
      }

      const nextUser = await this.prisma.user.findFirst({
        where: {
          id: {
            notIn: [
              targetUser.id,
              ...targetUser.likedUsers,
              ...targetUser.rejectedUsers,
            ],
          },
          city,
          age: {
            lte: currentAgeOption.maxAgeLimit,
            gte: currentAgeOption.minAgeLimit,
          },
          ...(targetUser.sexInterest !== 'none' && {
            sex: targetUser.sexInterest,
          }),
          isBlocked: false,
          isActive: true,
          isRegistered: true,
        },
        orderBy: {
          age: 'desc',
        },
      });

      if (!nextUser) {
        const newAlreadySearched = [...alreadySearched, city];
        const closestCity = findClosestCity(city, newAlreadySearched);

        if (!closestCity) {
          return undefined;
        }

        return findNextUser(closestCity.name, newAlreadySearched, depth + 1);
      }

      return nextUser;
    };

    // const findNextUser = async (initialCity: string) => {
    //   let depth = 0;
    //   let currentCity = initialCity;
    //   const searchedCities: string[] = [];

    //   while (depth < 2000) {
    //     const nextUser = await this.prisma.user.findFirst({
    //       where: {
    //         id: {
    //           notIn: [
    //             targetUser.id,
    //             ...targetUser.likedUsers,
    //             ...targetUser.rejectedUsers,
    //           ],
    //         },
    //         city: currentCity,
    //         age: {
    //           lte: currentAgeOption.maxAgeLimit,
    //           gte: currentAgeOption.minAgeLimit,
    //         },
    //         ...(targetUser.sexInterest !== 'none' && {
    //           sex: targetUser.sexInterest,
    //         }),
    //         isBlocked: false,
    //         isActive: true,
    //         isRegistered: true,
    //       },
    //       orderBy: { age: 'desc' },
    //     });

    //     if (nextUser) return nextUser;

    //     searchedCities.push(currentCity);
    //     const closest = this.findClosestCity(currentCity, searchedCities);
    //     if (!closest) return null;

    //     currentCity = closest.name;
    //     depth++;
    //   }
    //   return null;
    // };

    const nextUser = await findNextUser(targetUser.city);

    if (!nextUser) {
      await this.httpRepository.sendMessage(
        targetUser.id,
        this.i18nService.t('common.SCROLL.no_users', {
          ...languageT,
          args: { city: targetUser.city },
        }),
        'text',
      );
      await this.handleMenu(targetUser.id);
      return;
    }

    // TODO: FIND ALL SIMILAR PLACES AND MAKE 1 REUSABLE FNC FOR IT
    const avatarUrl = await this.s3Service.getFileUrl(nextUser.avatarUrl);
    const nameT = this.i18nService.t('common.CARD_INFO.name', languageT);
    const ageT = this.i18nService.t('common.CARD_INFO.age', languageT);
    const locationT = this.i18nService.t(
      'common.CARD_INFO.location',
      languageT,
    );
    const aboutT = this.i18nService.t('common.CARD_INFO.about', languageT);

    await this.httpRepository.sendTemplate(targetUser.id, {
      title: `${nameT}: ${nextUser.name}`,
      subtitle: `${ageT}: ${nextUser.age}\n${locationT}: ${nextUser.city}\n${aboutT}: ${nextUser.bio}`,
      image_url: avatarUrl,
      buttons: templateButtons({
        i18n: this.i18nService,
        ...languageT,
      }).scroll.map((item) => ({
        ...item,
        payload: `${item.payload}-${nextUser.id}`,
      })),
    });
    return;
  }

  async wrongReply(igId: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: {
        id: igId,
      },
    });

    if (targetUser && targetUser.lastCmd) {
      const flowOrigin = targetUser.lastCmd.split(':')[0];
      // console.log('flowOrigin : ', flowOrigin);

      if (isUserInfoFlowType(flowOrigin)) {
        const currentUserInfoPrompt = createUserInfoPrompts({
          flow: flowOrigin,
          i18n: this.i18nService,
          lang: targetUser.localizationLang,
        });
        await currentUserInfoPrompt[targetUser.lastCmd](
          this.httpRepository,
          igId,
        );
        return;
      }

      if (flowOrigin === 'report') {
        const currentReportPrompt = createReportPrompts({
          i18n: this.i18nService,
          lang: targetUser.localizationLang,
        });
        await currentReportPrompt[targetUser.lastCmd](
          this.httpRepository,
          igId,
        );
        return;
      }

      if (flowOrigin === 'deactivate') {
        const currentDeactivatePrompt = createDeactivateProfilePrompts({
          i18n: this.i18nService,
          lang: targetUser.localizationLang,
        });
        await currentDeactivatePrompt[targetUser.lastCmd](
          this.httpRepository,
          igId,
        );
        return;
      }
    }

    const targetUserLocalization =
      targetUser?.localizationLang ??
      (await this.redisRepo.getUserLocalizationLang(igId));
    const lang = {
      lang: targetUserLocalization,
    };

    type ReplyOptionsDto = { options: QuickReplyItemDto[]; message: string };
    const replyOptions: ReplyOptionsDto = {
      options: [],
      message: `${wrongReplyBaseMessage}\n\n`,
    };

    if (targetUser?.isRegistered ?? false) {
      replyOptions.options.push(
        ...[
          {
            title: this.i18nService.t('common.CMD.hub_button', lang),
            payload: 'hub_cmd',
          },
        ],
      );
      replyOptions.message += this.i18nService.t('common.CMD.hub', lang);
    } else {
      replyOptions.options.push(
        ...[
          {
            title: this.i18nService.t('common.CMD.start_button', lang),
            payload: 'continue_cmd',
          },
          {
            title: this.i18nService.t('common.CMD.continue_button', lang),
            payload: 'start_cmd',
          },
        ],
      );
      replyOptions.message += `${this.i18nService.t(
        'common.CMD.start',
        lang,
      )}\n${this.i18nService.t('common.CMD.continue', lang)}`;
    }

    this.httpRepository.sendQuickReply(
      igId,
      replyOptions.message,
      replyOptions.options,
    );

    return;
  }

  async unpredictableError(igId: string, errorName: string, error?: string) {
    console.log('!WARNING! - !WARNING! - !WARNING!');
    console.log('UNPREDICTABLE ERROR WITH USER ', igId);
    await this.telegramBot.sendMessage(
      process.env.TG_CHAT_ID,
      `⚠️ !WARNING! - !WARNING! - !WARNING! ⚠️\nUNPREDICTABLE ERROR WITH USER ${igId}\nError name: ${errorName}\n\nError body: ${error}`,
      {
        message_thread_id: 2,
      },
    );
    await this.httpRepository.sendMessage(
      igId,
      'An unpredictable error occurred, contact support@trial2024.com',
      'text',
    );
    return;
  }

  verifySignature(payload: Record<any, any>, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', process.env.IG_APP_SECRET)
      .update(Buffer.from(JSON.stringify(payload)))
      .digest('hex');
    const pureSignature = signature.split('=')[1];

    // console.log('pureSignature : ', pureSignature);
    // console.log('expectedSignature : ', expectedSignature);

    return expectedSignature === pureSignature;
  }

  async defineUserLocalization(igId: string) {
    const cachedLang = await this.redisRepo.getUserLocalizationLang(igId);
    // console.log('cachedLang : ', cachedLang);

    if (cachedLang) {
      return cachedLang;
    }

    const langFromDb = await this.prisma.user.findUnique({
      where: {
        id: igId,
      },
      select: {
        localizationLang: true,
      },
    });

    if (!langFromDb) {
      return 'en';
    }

    await this.redisRepo.setUserLocalizationLang(
      igId,
      langFromDb.localizationLang,
    );
    return langFromDb.localizationLang;
  }

  async handleIncomingWebhook(payload: any) {
    if (payload.object !== 'instagram' || !payload.entry.length) {
      return;
    }

    const currentEntry = payload.entry[0];

    if (!currentEntry || !currentEntry.messaging.length) {
      return;
    }

    const currentEvent = currentEntry.messaging[0];
    const changeFields = Object.keys(currentEvent);

    // console.log('changeFields : ', changeFields);
    // console.log('currentEvent : ', currentEvent);
    // console.log(
    //   'currentEvent ATTACHMENT : ',
    //   currentEvent.message?.attachments,
    // );

    const {
      sender: { id: senderId },
      message,
      postback,
    } = currentEvent;

    //* We brake a cycle if its our message or it's not message hook from client
    if (!senderId || String(senderId) === process.env.trial_IG_ACCOUNT_ID) {
      return;
    }

    const eventType = !!message ? 'message' : !!postback ? 'postback' : null;
    if (!eventType) {
      return;
    }

    switch (eventType) {
      case 'message':
        await this.handleMessageEvent(senderId, message);
        break;
      case 'postback':
        await this.handlePostbackEvent(senderId, postback);
        break;
    }

    return;
  }

  private async handleMessageEvent(senderId: string, message: any) {
    const [isTextAnswerStep, isImageAnswerStep] = await Promise.all([
      this.isTextAnswerStep(senderId),
      this.isImageAnswerStep(senderId),
    ]);

    //* Handle quick replies
    if (message.quick_reply) {
      await this.handleReply({
        senderId,
        text: message.text || '',
        payload: message.quick_reply.payload,
      });
      return;
    }

    //* Handle text answers
    if (isTextAnswerStep && message.text?.trim()) {
      await this.handleReply({
        senderId,
        text: '',
        payload: `${isTextAnswerStep}-${message.text.trim()}`,
      });
      return;
    }

    //* Handle image attachments
    if (isImageAnswerStep && message.attachments?.length) {
      const [attachment] = message.attachments;
      if (attachment.type === 'image') {
        await this.handleReply({
          senderId,
          text: '',
          payload: `${isImageAnswerStep}-${attachment.payload.url}`,
        });
        return;
      }
    }

    //* Fallback for unhandled messages
    await this.wrongReply(senderId);
  }

  private async handlePostbackEvent(senderId: string, postback: any) {
    await this.handleReply({
      senderId,
      text: postback.title,
      payload: postback.payload,
    });
  }

  //#region CRON FNC
  async clearUsersActivity() {
    try {
      await this.prisma.user.updateMany({
        where: {},
        data: {
          rejectedUsers: {
            set: [],
          },
          likedUsers: {
            set: [],
          },
        },
      });
    } catch (error) {
      await this.telegramBot.sendMessage(
        process.env.TG_CHAT_ID,
        `⚠️⚠️⚠️\n${new Date().toISOString()}\nClear user activity function - !! FAILED !!`,
        {
          message_thread_id: 2,
        },
      );
    }
    return;
  }
  //#endregion

  //#region CITYs

  // private getCacheKey(country: string, cityName: string): string {
  //   return `${country.toLowerCase()}_${cityName.toLowerCase()}`;
  // }

  // public findClosestCity(
  //   city: string,
  //   alreadySearched: string[],
  // ): CityDistance | null {
  //   const candidates = this.cityNameMap.get(city.toLowerCase());
  //   if (!candidates?.length) return null;

  //   const currentCity = candidates[0];
  //   const cacheKey = this.getCacheKey(currentCity.country, currentCity.name);
  //   const closestCities = this.cityDistanceCache.get(cacheKey) || [];
  //   const searchedSet = new Set(alreadySearched.map((c) => c.toLowerCase()));

  //   for (const city of closestCities) {
  //     if (!searchedSet.has(city.name.toLowerCase())) {
  //       return city;
  //     }
  //   }
  //   return null;
  // }

  // private initializeCityCache() {
  //   const allCities = citiesData as CityObject[];

  //   // Build city name lookup map
  //   allCities.forEach((city) => {
  //     const key = city.name.toLowerCase();
  //     const cities = this.cityNameMap.get(key) || [];
  //     cities.push(city);
  //     this.cityNameMap.set(key, cities);
  //   });

  //   // Group cities by country
  //   const citiesByCountry = new Map<string, CityObject[]>();
  //   allCities.forEach((city) => {
  //     const countryCities = citiesByCountry.get(city.country) || [];
  //     countryCities.push(city);
  //     citiesByCountry.set(city.country, countryCities);
  //   });

  //   // Precompute distances for each city
  //   citiesByCountry.forEach((countryCities, country) => {
  //     countryCities.forEach((city) => {
  //       const distances = countryCities
  //         .filter((c) => c.name !== city.name)
  //         .map((otherCity) => ({
  //           name: otherCity.name,
  //           distance: calculateDistance(
  //             parseFloat(city.lat),
  //             parseFloat(city.lng),
  //             parseFloat(otherCity.lat),
  //             parseFloat(otherCity.lng),
  //           ),
  //         }))
  //         .sort((a, b) => a.distance - b.distance);

  //       const cacheKey = this.getCacheKey(country, city.name);
  //       this.cityDistanceCache.set(cacheKey, distances);
  //     });
  //   });
  // }

  //#endregion

  //#region IceBreakers

  async setIceBreakers() {
    return this.httpRepository.setIceBreakers(this.i18nService);
  }

  //#endregion

  //#region TEST

  // async test() {
  //   await this.prisma.user.delete({
  //     where: {
  //       id: '922129809859449',
  //     },
  //   });
  // }

  //#endregion
}
