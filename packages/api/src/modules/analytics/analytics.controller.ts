import { Controller, Get, Post, Param, Query, Body, UseGuards, Req } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthenticatedRequest, MaybeAuthenticatedRequest } from '../../common/types/request.types';
import { z } from 'zod';

const trackSchema = z
  .object({
    event: z.string().trim().min(1).max(100),
    sessionId: z.string().trim().max(200).optional(),
    listingId: z.string().trim().max(64).optional(),
    agentId: z.string().trim().max(64).optional(),
    metadata: z.record(z.unknown()).optional(),
  })
  .strict();
type TrackBody = z.infer<typeof trackSchema>;

@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Post('events')
  track(@Body(new ZodValidationPipe(trackSchema)) body: TrackBody, @Req() req: MaybeAuthenticatedRequest) {
    return this.analyticsService.track({
      event: body.event,
      userId: req.user?.sub,
      sessionId: body.sessionId,
      listingId: body.listingId,
      agentId: body.agentId,
      metadata: body.metadata,
    });
  }

  @Get('listing/:listingId')
  getListingPerformance(@Param('listingId') listingId: string, @Query('days') days?: string) {
    return this.analyticsService.getListingPerformance(listingId, days ? parseInt(days) : undefined);
  }

  @Get('agent/:agentId')
  @UseGuards(JwtGuard)
  getAgentPerformance(@Param('agentId') agentId: string, @Req() req: AuthenticatedRequest, @Query('days') days?: string) {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN' && req.user.sub !== agentId) {
      return { error: 'You can only view your own analytics' };
    }
    return this.analyticsService.getAgentPerformance(agentId, days ? parseInt(days) : undefined);
  }

  @Get('top-listings')
  @UseGuards(JwtGuard)
  getTopListings(@Query('days') days?: string, @Query('limit') limit?: string) {
    return this.analyticsService.getTopListings(
      days ? parseInt(days) : undefined,
      limit ? Math.min(parseInt(limit) || 10, 50) : 10,
    );
  }

  @Get('funnel')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  getFunnel(@Query('days') days?: string) {
    return this.analyticsService.getFunnel(days ? parseInt(days) : undefined);
  }

  @Get('admin-summary')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  getAdminSummary() {
    return this.analyticsService.getAdminSummary();
  }

  @Get('overview')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  getOverview(@Query('days') days?: string) {
    return this.analyticsService.getOverview(days ? parseInt(days) : undefined);
  }

  @Get('me')
  @UseGuards(JwtGuard)
  getMy(@Req() req: AuthenticatedRequest, @Query('days') days?: string) {
    return this.analyticsService.getMyPerformance(req.user.sub, req.user.role, days ? parseInt(days) : undefined);
  }
}
