export class MessageDto {
  mid: string;
  text: string;
}

export class QuickReplyPayloadDto {
  payload: string;
}

export class ReplyDto {
  mid: string;
  title: string;
  quick_reply: QuickReplyPayloadDto;
}

export class HandleStartMessageDto {
  senderId: string;
}

export class HandleReplyDto {
  text: string;
  payload: string;
  senderId: string;
}

export class QuickReplyDto {
  title: string;
  payload: string;
}

export class QuickReplyItemDto extends QuickReplyDto {
  content_type?: string;
}

export class QuickReplyTemplateItemDto {
  title: string;
  type: 'postback' | 'web_url';
  url?: string;
  payload?: string;
}

export class RegistrationPayloadDto<T> {
  value: T;
  igId: string;
}

export class RegistrationPromptOption {
  options?: QuickReplyItemDto[];
  message: string;
}

export class SendTemplateDto {
  title: string;
  image_url: string;
  subtitle: string;
  buttons: QuickReplyTemplateItemDto[];
}

export class IgUserProfileIfoDto {
  avatarUrl: string;
  username: string;
}
