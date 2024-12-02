import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  HandleReplyDto,
  HandleStartMessageDto,
  HttpRepository,
  QuickReplyItemDto,
  RegistrationPayloadDto,
  UserSexType,
  wrongReplyMessage,
} from '@libs';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WebhooksService {
  constructor(
    private prisma: PrismaService,
    private readonly httpRepository: HttpRepository,
  ) {}

  async handleStartMessage(payload: HandleStartMessageDto) {
    //* Check if user is already registered - do smth (check schema)
    //* If user is new and already started registration - do smth (check schema)
    //* If user is new  - do smth (check schema)
    const { senderId } = payload;

    const targetUser = await this.prisma.user.findUnique({
      where: {
        id: senderId,
      },
    });

    if (!targetUser) {
      await this.startFlow(senderId);
      return;
    }

    if (targetUser.isRegistered) {
      await this.wrongReply(senderId);
      return;
    }

    // TODO: ADD CASE BELOW
    //* add "&& targetUser.lastRegistrationStep" to if statement
    // if (!targetUser.isRegistered) {
    //* last registration step logic here ⬇️
    // await this.wrongReply(senderId);
    // return;
    // }

    await this.wrongReply(senderId);
    return;
    // switch (determineFlow) {
    // case 'start':
    //   await this.startFlow(senderId);
    //   return;

    // case 'continue':
    //   await this.continueFlow(senderId);
    //   return;

    // default:
    //   await this.wrongReply(senderId);
    //   return;
    // }
  }

  // private async determineStartFlow(igId: string) {
  //   const client = await this.prisma.user.findUnique({
  //     where: {
  //       id: igId,
  //     },
  //   });

  //   return !client ? 'start' : 'continue';
  // }

  private async startFlow(igId: string) {
    //* Check is user subscribed to main acc
    //* IF Yes - Send message about start of registration and quick replie with first question
    //* IF No - Send message to subscribe and quick reply to check

    const isSubscribed = false; // await this.checkSubscription();
    console.log('isSubscribed : ', isSubscribed);

    if (isSubscribed) {
      const startAge = 16;
      const replyOptions: QuickReplyItemDto[] = Array.from(
        { length: 13 },
        (_, index) => {
          const currentNumber = index + startAge + 1;

          return {
            title: currentNumber.toString(),
            payload: `registration:age-${currentNumber}`,
          };
        },
      );
      await this.httpRepository.sendQuickReply(
        igId,
        'Lets create your personal card.\nHow old are you ?',
        replyOptions,
      );
      return;
    } else {
      // TODO: Maybe change from message to template
      await this.httpRepository.sendMessage(
        igId,
        'Dear customer, you need to subscribed to our instagram page to registrate and use bot',
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
    const flow = payload.split(':')[0];
    const registrationFlow = payload.split('-')[0];
    console.log('flow : ', flow);

    switch (flow) {
      case 'registration':
        await this.registrationFlow(registrationFlow, senderId);
        return;
      case 'scroll':
        await this.scrollFlow(payload);
        return;
      default:
        await this.wrongReply(payload);
        return;
    }
  }

  private async registrationFlow(flow: string, igId: string) {
    const registrationFlow = flow.split('-')[0];
    const registrationValue = flow.split('-')[1];
    console.log('registrationFlow : ', registrationFlow);
    console.log('registrationValue : ', registrationValue);
    const registrationStepData: RegistrationPayloadDto = {
      value: registrationValue,
      igId,
    };

    switch (registrationFlow) {
      case 'registration:age':
        await this.setAge(registrationStepData);
        await this.httpRepository.sendQuickReply(igId, 'What is your sex ?', [
          { title: 'Male', payload: 'registration:sex-male' },
          { title: 'Female', payload: 'registration:sex-female' },
          { title: 'None', payload: 'registration:sex-none' },
        ]);
        // TODO: Send message and quique reply options here
        return;
      // case 'registration:sex':
      //   await this.setSex(payload);
      //   // TODO: Send message and quique reply options here
      //   return;
      // case 'registration:sexInterest':
      //   await this.setSexInterest(payload);
      //   // TODO: Send message and quique reply options here
      //   return;
      // case 'registration:bio':
      //   await this.setBio(payload);
      //   // TODO: Send message and quique reply options here
      //   return;
      // case 'registration:location':
      //   await this.setLocation(payload);
      //   // TODO: Send message and quique reply options here
      //   return;
      // case 'registration:name':
      //   await this.setName(payload);
      //   // TODO: Send message and quique reply options here
      //   return;
    }
  }

  private async setAge(dto: RegistrationPayloadDto) {
    const { igId, value } = dto;
    const mode = 'create';

    try {
      if (mode === 'create') {
        await this.prisma.user.create({
          data: {
            id: igId,
            age: +value,
          },
        });
      } else {
        await this.prisma.user.update({
          where: {
            id: igId,
          },
          data: {
            age: +value,
          },
        });
      }
    } catch (error) {
      // TODO: Add function to send error reply
    }
  }

  private async setSex(sex: UserSexType, igId: string) {
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
      // TODO: Add function to send error reply
    }
  }

  private scrollFlow(payload: any) {
    return;
  }

  async wrongReply(igId: string) {
    await this.httpRepository.sendMessage(igId, wrongReplyMessage);
    return;
  }

  //* Here we need to send message and quique reply options (for now just text message)
  // async sendQuickReply(recipientId: string, reply: string) {
  // const url = `${IG_GRAPH_BASE_URL}${process.env.trial_IG_ACCOUNT_ID}/messages`;

  // const data = {
  //   recipient: { id: recipientId },
  //   message: 'TextTextText',
  // };
  // const headers = {
  //   Authorization: `Bearer ${process.env.trial_ACCESS_TOKEN}`,
  //   'Content-Type': 'application/json',
  // };

  // console.log('url : ', url);
  // console.log('body : ', data);
  // try {
  //   const response = await firstValueFrom(
  //     this.httpService.post(url, data, { headers }),
  //   );
  //   console.log('Quick reply sent successfully:', response.data);
  // } catch (error) {
  //   console.error(
  //     'Error sending quick reply:',
  //     error.response?.data || error.message,
  //   );
  // }
  // }

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
}
