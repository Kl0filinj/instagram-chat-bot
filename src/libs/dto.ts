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

export class QuickReplyItemDto {
  content_type?: string;
  title: string;
  payload: string;
}

export class RegistrationPayloadDto {
  value: string | number;
  igId: string;
}
