import { Controller, Get, Post, Param, Body, UseGuards, Req } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { JwtGuard } from '../auth/jwt.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthenticatedRequest } from '../../common/types/request.types';
import { z } from 'zod';

const createConversationSchema = z
  .object({
    participantIds: z.array(z.string().min(1).max(64)).min(1).max(50),
    propertyId: z.string().min(1).max(64).optional(),
  })
  .strict();

const sendMessageSchema = z
  .object({
    content: z.string().trim().min(1).max(4000),
    type: z.enum(['text', 'image', 'file']).optional(),
    mediaUrl: z.string().url().max(2048).optional(),
  })
  .strict();

@Controller('messaging')
@UseGuards(JwtGuard)
export class MessagingController {
  constructor(private messagingService: MessagingService) {}

  @Get('conversations')
  getConversations(@Req() req: AuthenticatedRequest) {
    return this.messagingService.getConversations(req.user.sub);
  }

  @Get('conversations/:id')
  getConversation(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.messagingService.getConversationById(id, req.user.sub);
  }

  @Post('conversations')
  createConversation(
    @Body(new ZodValidationPipe(createConversationSchema)) body: { participantIds: string[]; propertyId?: string },
    @Req() req: AuthenticatedRequest,
  ) {
    const participantIds = Array.from(new Set([...body.participantIds, req.user.sub]));
    return this.messagingService.createConversation(participantIds, body.propertyId, req.user.sub);
  }

  @Get('conversations/:id/messages')
  getMessages(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.messagingService.getMessages(id, req.user.sub);
  }

  @Post('conversations/:id/messages')
  sendMessage(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(sendMessageSchema))
    body: { content: string; type?: 'text' | 'image' | 'file'; mediaUrl?: string },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.messagingService.sendMessage(
      id,
      req.user.sub,
      body.content,
      body.type ?? 'text',
      body.mediaUrl,
    );
  }

  @Post('conversations/:id/read')
  markAsRead(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.messagingService.markAsRead(id, req.user.sub);
  }

  @Get('unread')
  getUnreadCount(@Req() req: AuthenticatedRequest) {
    return this.messagingService.getUnreadCount(req.user.sub);
  }
}
