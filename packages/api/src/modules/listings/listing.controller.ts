import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ListingService } from './listing.service';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedRequest, toActor } from '../../common/types/request.types';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { z } from 'zod';
import {
  CreateListingDto,
  createListingSchema,
} from './dto/create-listing.dto';
import {
  UpdateListingDto,
  UpdateListingStatusDto,
  updateListingSchema,
  updateListingStatusSchema,
  moderateListingSchema,
  attachMediaSchema,
} from './dto/update-listing.dto';

const uploadUrlSchema = z
  .object({
    filename: z.string().trim().min(1).max(255),
    contentType: z.string().trim().min(1).max(100),
  })
  .strict();

@Controller('listings')
export class ListingController {
  constructor(private listingService: ListingService) {}

  @Post()
  @UseGuards(JwtGuard)
  create(@Body(new ZodValidationPipe(createListingSchema)) dto: CreateListingDto, @Req() req: AuthenticatedRequest) {
    return this.listingService.create(dto, req.user.sub, toActor(req));
  }

  @Get()
  findAll(
    @Query('skip') skip?: string,
    @Query('take') take?: string,
    @Query('category') category?: string,
    @Query('propertyType') propertyType?: string,
    @Query('status') status?: string,
    @Query('minPrice') minPrice?: string,
    @Query('maxPrice') maxPrice?: string,
    @Query('search') search?: string,
    @Query('ownerId') ownerId?: string,
    @Query('featured') featured?: string,
    @Query('verified') verified?: string,
  ) {
    const parsedTake = take ? Math.min(parseInt(take) || 12, 50) : undefined;
    const parsedSkip = skip ? Math.max(parseInt(skip) || 0, 0) : undefined;
    return this.listingService.findAll({
      skip: parsedSkip,
      take: parsedTake,
      category,
      propertyType,
      status,
      minPrice: minPrice != null ? parseFloat(minPrice) : undefined,
      maxPrice: maxPrice != null ? parseFloat(maxPrice) : undefined,
      search,
      ownerId,
      featured: featured != null ? featured === 'true' : undefined,
      verified: verified != null ? verified === 'true' : undefined,
    });
  }

  @Get('featured')
  getFeatured() {
    return this.listingService.getFeatured();
  }

  @Get('admin/pending')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  getPendingModeration() {
    return this.listingService.getPendingModeration();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.listingService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtGuard)
  update(@Param('id') id: string, @Body(new ZodValidationPipe(updateListingSchema)) dto: UpdateListingDto, @Req() req: AuthenticatedRequest) {
    return this.listingService.update(id, dto, req.user.sub, toActor(req));
  }

  @Put(':id/status')
  @UseGuards(JwtGuard)
  updateStatus(@Param('id') id: string, @Body(new ZodValidationPipe(updateListingStatusSchema)) dto: UpdateListingStatusDto, @Req() req: AuthenticatedRequest) {
    return this.listingService.updateStatus(id, dto, req.user.sub, toActor(req));
  }

  @Delete(':id')
  @UseGuards(JwtGuard)
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.listingService.delete(id, req.user.sub, toActor(req));
  }

  @Post('media/upload-url')
  @UseGuards(JwtGuard)
  getUploadUrl(@Body(new ZodValidationPipe(uploadUrlSchema)) body: { filename: string; contentType: string }) {
    return this.listingService.uploadMediaUrl(body.filename, body.contentType);
  }

  @Post(':id/media')
  @UseGuards(JwtGuard)
  attachMedia(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(attachMediaSchema)) body: { media: { url: string; type: string; isPrimary?: boolean; altText?: string }[] },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.listingService.attachMedia(id, body.media, req.user.sub);
  }

  @Post(':id/view')
  incrementView(@Param('id') id: string) {
    return this.listingService.incrementView(id);
  }

  @Put(':id/moderate')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  moderate(@Param('id') id: string, @Body(new ZodValidationPipe(moderateListingSchema)) body: { action: 'approve' | 'reject' }, @Req() req: AuthenticatedRequest) {
    return this.listingService.moderateListing(id, body.action, toActor(req));
  }
}
