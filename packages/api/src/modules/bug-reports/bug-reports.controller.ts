import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { BugReportsService } from './bug-reports.service';
import { JwtGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AuthenticatedRequest, toActor } from '../../common/types/request.types';
import {
  CreateBugReportDto,
  UpdateBugReportStatusDto,
  BatchBugReportDto,
  createBugReportSchema,
  updateBugReportStatusSchema,
  batchBugReportSchema,
} from './dto/create-bug-report.dto';

@Controller('bug-reports')
export class BugReportsController {
  constructor(private bugReportsService: BugReportsService) {}

  @Post()
  @UseGuards(JwtGuard)
  create(
    @Body(new ZodValidationPipe(createBugReportSchema)) dto: CreateBugReportDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.bugReportsService.create(dto, req.user.sub, toActor(req));
  }

  @Get()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  findAll(
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.bugReportsService.findAll({
      status,
      type,
      page: page ? Math.max(parseInt(page) || 1, 1) : undefined,
      limit: limit ? Math.min(parseInt(limit) || 25, 100) : undefined,
    });
  }

  @Get('mine')
  @UseGuards(JwtGuard)
  findMine(
    @Req() req: AuthenticatedRequest,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.bugReportsService.findMine(req.user.sub, {
      page: page ? Math.max(parseInt(page) || 1, 1) : undefined,
      limit: limit ? Math.min(parseInt(limit) || 25, 100) : undefined,
    });
  }

  @Get(':id')
  @UseGuards(JwtGuard)
  findById(@Param('id') id: string) {
    return this.bugReportsService.findById(id);
  }

  @Put(':id/status')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  updateStatus(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateBugReportStatusSchema)) dto: UpdateBugReportStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.bugReportsService.updateStatus(id, dto, toActor(req));
  }

  @Post('batch')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  batchUpdate(
    @Body(new ZodValidationPipe(batchBugReportSchema)) dto: BatchBugReportDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.bugReportsService.batchUpdate(dto, toActor(req));
  }

  @Delete(':id')
  @UseGuards(JwtGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.bugReportsService.delete(id, toActor(req));
  }
}
