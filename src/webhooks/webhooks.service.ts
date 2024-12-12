import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
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
  registrationPrompts,
  userInfoTextSteps,
  startAge,
  startCmd,
  templateButtons,
  UserEntity,
  UserInfoFlowType,
  UserSexType,
  wrongReplyBaseMessage,
} from '@libs';
import { PrismaService } from 'src/prisma/prisma.service';

// TODO: RESUBMIT PROFILE FLOW - ✅ FIX ISSUE WItH WRONG CMD WHILE RESUBMITTING
// TODO: LIKE NOTIFICATION SYSTEM
// TODO: REPORT SYSTEM
// TODO: CHECK SUBSCRIPTION FUNCTIONALITY
// TODO: Improve algorithm with location (SIMPLE Version - done) - ✅
// TODO: IMPROVE CODE & ARCH

@Injectable()
export class WebhooksService {
  constructor(
    private prisma: PrismaService,
    private readonly httpRepository: HttpRepository,
  ) {}

  async handleCommand(igId: string, cmd: string) {
    switch (cmd) {
      case '/start':
        await this.handleStartMessage(igId);
        return;

      case '/continue':
        await this.handleContinueRegistration(igId);
        return;

      case '/menu':
        await this.handleMenu(igId);
        return;

      default:
        const targetUser = await this.prisma.user.findUnique({
          where: { id: igId },
        });
        const isUserRegistered = !targetUser ? false : targetUser.isRegistered;
        await this.wrongReply(igId, isUserRegistered);
        return;
    }
  }

  async handleMenu(igId: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: {
        id: igId,
      },
    });

    await this.httpRepository.sendTempalte(targetUser.id, {
      title: `Name: ${targetUser.name}`,
      subtitle: `Age: ${targetUser.age}\nLocation: ${targetUser.city}\nAbout: ${targetUser.bio}`,
      image_url: targetUser.avatarUrl,
      buttons: templateButtons.hub,
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

    if (targetUser && targetUser.isRegistered) {
      await this.wrongReply(igId, targetUser.isRegistered);
      return;
    }

    if (targetUser && !targetUser.isRegistered && targetUser.lastCmd) {
      //* Sending last cmd to user
      await registrationPrompts[targetUser.lastCmd](this.httpRepository, igId);
      return;
    }

    await this.wrongReply(igId, targetUser.isRegistered);
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
      await this.wrongReply(igId, targetUser.isRegistered);
      return;
    }

    if (targetUser && !targetUser.isRegistered) {
      await this.handleContinueRegistration(igId);
      return;
    }

    await this.wrongReply(igId, targetUser.isRegistered);
    return;
  }

  private async startFlow(igId: string) {
    //* Check is user subscribed to main acc
    //* IF Yes - Send message about start of registration and quick replie with first question
    //* IF No - Send message to subscribe and quick reply to check

    const isSubscribed = true; // await this.checkSubscription();
    console.log('isSubscribed : ', isSubscribed);

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
    console.log('followersResponse : ', followersResponse);
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
      default:
        const targetUser = await this.prisma.user.findUnique({
          where: { id: senderId },
        });
        const isUserRegistered = !targetUser ? false : targetUser.isRegistered;
        await this.wrongReply(payload, isUserRegistered);
        return;
    }
  }

  async userInfoFlow(flow: string, igId: string) {
    const userInfoFlow = flow.split('-')[0];
    const userInfoValue = flow.split('-')[1];
    const flowOrigin = flow.split(':')[0];

    console.log('userInfoFlow : ', userInfoFlow);
    console.log('userInfoValue : ', userInfoValue);
    console.log('flowOrigin : ', flowOrigin);

    if (!isUserInfoFlowType(flowOrigin)) {
      await this.unpredictableError(igId);
      return;
    }

    type FlowOptions = {
      isRegistered: boolean;
    };
    const flowOptions: Record<UserInfoFlowType, FlowOptions> = {
      registration: {
        isRegistered: false,
      },
      resubmit: {
        isRegistered: true,
      },
    };
    const currentFlowOption: FlowOptions = flowOptions[flowOrigin];

    switch (userInfoFlow) {
      case 'resubmit:init':
      case 'registration:init':
        await this.userInfoInitStep(igId, flowOrigin);
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
      case 'resubmit:location':
      case 'registration:location':
        await this.locationStep(igId, userInfoValue, flowOrigin);
        return;
      case 'resubmit:name':
      case 'registration:name':
        await this.nameStep(igId, userInfoValue);
        return;
      default:
        await this.wrongReply(igId, currentFlowOption.isRegistered);
        return;
    }
  }

  private async userInfoInitStep(igId: string, flow: UserInfoFlowType) {
    console.log('userInfoInitStep');
    const replyOptions: QuickReplyItemDto[] = Array.from(
      { length: 13 },
      (_, index) => {
        const currentNumber = index + startAge + 1;

        return {
          title: currentNumber.toString(),
          payload: `${flow}:age-${currentNumber}`,
        };
      },
    );

    await this.setLastStep(igId, `${flow}:age`);
    await this.httpRepository.sendQuickReply(
      igId,
      'Lets create your personal card.\nHow old are you ?',
      replyOptions,
    );
    return;
  }

  private async ageStep(igId: string, age: number, flow: UserInfoFlowType) {
    try {
      if (flow === 'registration') {
        await this.prisma.user.create({
          data: {
            id: igId,
            age,
          },
        });
      } else if (flow === 'resubmit') {
        await this.prisma.user.update({
          where: {
            id: igId,
          },
          data: {
            age,
          },
        });
      }
    } catch (error) {
      console.log('ERROR: ageStep PRISMA', error?.message);
      await this.unpredictableError(igId);
      return;
    }

    const sexStepOptions: { title: UserSexType; payload: string }[] = [
      { title: 'male', payload: `${flow}:sex-male` },
      { title: 'female', payload: `${flow}:sex-female` },
      // { title: 'none', payload: 'registration:sex-none' },
    ];
    await this.setLastStep(igId, `${flow}:sex`);
    await this.httpRepository.sendQuickReply(
      igId,
      'What gender are you ?',
      sexStepOptions,
    );
  }

  private async sexStep(
    igId: string,
    sex: UserSexType,
    flow: UserInfoFlowType,
  ) {
    try {
      await this.prisma.user.update({
        where: {
          id: igId,
        },
        data: {
          sex,
        },
      });
    } catch (error) {
      console.log('ERROR: sexStep PRISMA', error?.message);
      await this.unpredictableError(igId);
      return;
    }

    const sexInterestStepOptions: { title: UserSexType; payload: string }[] = [
      { title: 'none', payload: `${flow}:sexInterest-none` },
      { title: 'male', payload: `${flow}:sexInterest-male` },
      { title: 'female', payload: `${flow}:sexInterest-female` },
    ];
    await this.setLastStep(igId, `${flow}:sexInterest`);
    await this.httpRepository.sendQuickReply(
      igId,
      'Who are you interested in ?',
      sexInterestStepOptions,
    );
  }

  private async sexInterestStep(
    igId: string,
    sexInterest: UserSexType,
    flow: UserInfoFlowType,
  ) {
    try {
      await this.prisma.user.update({
        where: {
          id: igId,
        },
        data: {
          sexInterest,
        },
      });
    } catch (error) {
      console.log('ERROR: ageStep PRISMA', error?.message);
      await this.unpredictableError(igId);
      return;
    }

    await this.setLastStep(igId, `${flow}:bio`);
    await this.httpRepository.sendMessage(
      igId,
      'Tell us about yourself. 1-3 short sentences',
      'text',
    );
  }

  private async bioStep(igId: string, bio: string, flow: UserInfoFlowType) {
    try {
      await this.prisma.user.update({
        where: {
          id: igId,
        },
        data: {
          bio,
        },
      });
    } catch (error) {
      console.log('ERROR: bioStep PRISMA', error?.message);
      await this.unpredictableError(igId);
      return;
    }

    await this.setLastStep(igId, `${flow}:location`);
    await this.httpRepository.sendMessage(
      igId,
      'Now specify your location',
      'text',
    );
  }

  private async locationStep(
    igId: string,
    location: string,
    flow: UserInfoFlowType,
  ) {
    const findCityResp = findCity(location);
    console.log('findCityResp : ', findCityResp);

    if (findCityResp !== location && Array.isArray(findCityResp)) {
      await this.httpRepository.sendMessage(
        igId,
        `Available cities: ${findCityResp.join(', ')}`,
        'text',
      );
      return;
    }

    try {
      await this.prisma.user.update({
        where: {
          id: igId,
        },
        data: {
          city: location,
        },
      });
    } catch (error) {
      console.log('ERROR: locationStep PRISMA', error?.message);
      await this.unpredictableError(igId);
      return;
    }

    await this.setLastStep(igId, `${flow}:name`);
    await this.httpRepository.sendMessage(
      igId,
      'Finally, what is your name ?',
      'text',
    );
  }

  private async nameStep(igId: string, name: string) {
    let user: UserEntity;
    const profilePicture = await this.httpRepository.getProfilePicture(igId);
    console.log('profilePicture : ', profilePicture);

    try {
      user = await this.prisma.user.update({
        where: {
          id: igId,
        },
        data: {
          name,
          avatarUrl: profilePicture,
          isRegistered: true,
          lastCmd: null,
        },
      });
    } catch (error) {
      console.log('ERROR: nameStep PRISMA', error?.message);
      await this.unpredictableError(igId);
      return;
    }

    await this.httpRepository.sendTempalte(igId, {
      title: 'Your info card',
      subtitle: `Name: ${user.name}\nAge: ${user.age}\nLocation: ${user.city}\nAbout: ${user.bio}`,
      image_url: user.avatarUrl,
      buttons: templateButtons.hub,
    });
  }

  // async test() {
  //   return this.httpRepository.getProfilePicture('922129809859449');
  // }

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
    }
  }

  async isUserInfoTextStep(igId: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: {
        id: igId,
      },
    });

    if (!targetUser) {
      return false;
    }

    if (userInfoTextSteps.includes(targetUser.lastCmd)) {
      return targetUser.lastCmd;
    }

    return false;
  }

  private async scrollFlow(flow: string, igId: string) {
    const scrollFlow = flow.split('-')[0];
    const scrollValue = flow.split('-')[1];

    console.log('scrollFlow : ', scrollFlow);
    console.log('scrollValue : ', scrollValue);

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
      default:
        await this.wrongReply(igId, true);
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
  }

  private async scrollLike(igId: string, targetIgId: string) {
    const targetUser = await this.prisma.user.update({
      where: {
        id: igId,
      },
      data: {
        likedUsers: {
          push: targetIgId,
        },
      },
    });

    //* USER THAT WAS Liked gets an message about it
    // TODO: Add it here
    await this.scrollSendNextUser(targetUser);
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
    const minAgeLimit =
      targetUser.sex === 'male' ? targetUser.age - 2 : targetUser.age - 1;
    const maxAgeLimit =
      targetUser.sex === 'male' ? targetUser.age + 1 : targetUser.age + 2;

    console.log('minAgeLimit : ', minAgeLimit);
    console.log('maxAgeLimit : ', maxAgeLimit);

    const nextUser = await this.prisma.user.findFirst({
      where: {
        id: {
          notIn: [
            targetUser.id,
            ...targetUser.likedUsers,
            ...targetUser.rejectedUsers,
          ],
        },
        city: targetUser.city,
        age: {
          lte: maxAgeLimit,
          gte: minAgeLimit,
        },
        ...(targetUser.sexInterest !== 'none' && {
          sex: targetUser.sexInterest,
        }),
      },
      orderBy: {
        age: 'desc',
      },
    });

    if (!nextUser) {
      await this.httpRepository.sendMessage(
        targetUser.id,
        `Sorry, ${targetUser.name}, but we've run out of active users in the ${targetUser.city}`,
        'text',
      );
      await this.handleMenu(targetUser.id);
      return;
    }

    await this.httpRepository.sendTempalte(targetUser.id, {
      title: `Name: ${nextUser.name}`,
      subtitle: `Age: ${nextUser.age}\nLocation: ${nextUser.city}\nAbout: ${nextUser.bio}`,
      image_url: nextUser.avatarUrl,
      buttons: templateButtons.scroll.map((item) => ({
        ...item,
        payload: `${item.payload}-${nextUser.id}`,
      })),
    });
  }

  async wrongReply(igId: string, isRegistered: boolean) {
    const unregisteredUserCmdsPreset = `${startCmd}
    ${continueCmd}`;
    const registeredUserCmdsPreset = menuCmd;

    const currentCmdsPreset = isRegistered
      ? registeredUserCmdsPreset
      : unregisteredUserCmdsPreset;
    const wrongReplyMessage = `${wrongReplyBaseMessage}
    ${currentCmdsPreset}`;
    await this.httpRepository.sendMessage(igId, wrongReplyMessage, 'text');
    return;
  }

  async unpredictableError(igId: string) {
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

    console.log('pureSignature : ', pureSignature);
    console.log('expectedSignature : ', expectedSignature);

    return expectedSignature === pureSignature;
  }

  async handleIncomingWebhook(payload: any) {
    if (payload.object === 'instagram') {
      if (payload.entry.length !== 0) {
        const currentEntry = payload.entry[0];
        if (currentEntry && currentEntry.messaging) {
          const currentChange = currentEntry.messaging[0];
          const changeFields = Object.keys(currentChange);
          const senderId = currentChange.sender.id;

          console.log('changeFields : ', changeFields);
          console.log('currentChange : ', currentChange);

          //* We brake a cycle if its our message or it's not message hook from client
          const availableHooks = ['message', 'postback'];
          if (
            String(senderId) === process.env.trial_IG_ACCOUNT_ID ||
            !changeFields.some((item) => availableHooks.includes(item))
          ) {
            return;
          }

          const messageFields = Object.keys(currentChange?.message ?? {});
          const currentChangeFields = Object.keys(currentChange ?? {});
          const isStart = currentChange?.message?.text === '/start';
          const isContinueRegistration =
            currentChange?.message?.text === '/continue';
          const isMenu = currentChange?.message?.text === '/menu';
          const isReply = !!messageFields.find(
            (item) => item === 'quick_reply',
          );
          console.log('currentChangeFields : ', currentChangeFields);
          const isPostback = !!currentChangeFields.find(
            (item) => item === 'postback',
          );

          console.log('isStart : ', isStart);
          console.log('isReply : ', isReply);
          console.log('isPostback : ', isPostback);
          console.log('senderId : ', senderId);
          console.log('isContinueRegistration : ', isContinueRegistration);
          console.log('isMenu : ', isMenu);

          if (isStart || isContinueRegistration || isMenu) {
            await this.handleCommand(senderId, currentChange.message.text);
            return;
          }

          //* Here we check if user send an answer to registration text question
          const isRegistrationTextAnswer = await this.isUserInfoTextStep(
            senderId,
          );
          console.log('isRegistrationTextAnswer : ', isRegistrationTextAnswer);

          if (isRegistrationTextAnswer && !isReply && !isStart) {
            await this.userInfoFlow(
              `${isRegistrationTextAnswer}-${currentChange?.message?.text}`,
              senderId,
            );
            return;
          }

          if (isReply) {
            const message = currentChange.message;
            await this.handleReply({
              text: message.text,
              payload: message.quick_reply.payload,
              senderId,
            });
            return;
          }

          //* Same as if (isReply)
          if (isPostback) {
            const postback = currentChange.postback;
            await this.handleReply({
              text: postback.title,
              payload: postback.payload,
              senderId,
            });
            return;
          }

          const targetUser = await this.prisma.user.findUnique({
            where: { id: senderId },
          });
          const isUserRegistered = !targetUser
            ? false
            : targetUser.isRegistered;
          console.log('isUserRegistered : ', isUserRegistered);
          await this.wrongReply(senderId, isUserRegistered);
          return;
        }
      }
    }
  }
}
