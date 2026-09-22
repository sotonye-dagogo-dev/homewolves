import { Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, count } from 'drizzle-orm';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../email/email.service';
import { bugReports, users } from '../../drizzle/schema';
import { CreateBugReportDto, UpdateBugReportStatusDto, BatchBugReportDto } from './dto/create-bug-report.dto';

@Injectable()
export class BugReportsService {
  constructor(
    private db: DrizzleService,
    private audit: AuditService,
    private emailService: EmailService,
  ) {}

  async create(dto: CreateBugReportDto, userId: string, actor: ActorRef) {
    const [report] = await this.db
      .insert(bugReports)
      .values({
        userId,
        type: dto.type,
        description: dto.description,
        screenshots: dto.screenshots ?? [],
        errorMessage: dto.errorMessage ?? null,
        stackTrace: dto.stackTrace ?? null,
        componentName: dto.componentName ?? null,
        url: dto.url ?? null,
      })
      .returning();
    if (!report) throw new Error('Failed to create bug report');

    await this.audit.log({
      entityType: 'BugReport',
      entityId: report.id,
      action: 'BUG_REPORT_CREATED',
      actor,
      metadata: { type: dto.type },
    });

    const [user] = await this.db.select({ email: users.email, firstName: users.firstName }).from(users).where(eq(users.id, userId));
    if (user?.email) {
      void this.emailService.send(user.email, 'bug_report_submitted', {
        firstName: user.firstName ?? 'there',
        bugType: dto.type,
        bugId: report.id,
      });
    }

    return report;
  }

  async findAll(params: {
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }) {
    const conditions = [];
    if (params.status) conditions.push(eq(bugReports.status, params.status as typeof bugReports.$inferSelect.status));
    if (params.type) conditions.push(eq(bugReports.type, params.type as typeof bugReports.$inferSelect.type));

    const page = params.page ?? 1;
    const limit = params.limit ?? 25;
    const skip = (page - 1) * limit;
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [reports, total] = await Promise.all([
      this.db.query.bugReports.findMany({
        where,
        offset: skip,
        limit,
        orderBy: desc(bugReports.createdAt),
        with: { user: { columns: { id: true, firstName: true, lastName: true, email: true } } },
      }),
      this.db.select({ value: count() }).from(bugReports).where(where),
    ]);

    return { reports, total: total[0]?.value ?? 0, page, limit };
  }

  async findMine(userId: string, params: { page?: number; limit?: number }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 25;
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      this.db.query.bugReports.findMany({
        where: eq(bugReports.userId, userId),
        offset: skip,
        limit,
        orderBy: desc(bugReports.createdAt),
      }),
      this.db.select({ value: count() }).from(bugReports).where(eq(bugReports.userId, userId)),
    ]);

    return { reports, total: total[0]?.value ?? 0, page, limit };
  }

  async findById(id: string) {
    const report = await this.db.query.bugReports.findFirst({
      where: eq(bugReports.id, id),
      with: { user: { columns: { id: true, firstName: true, lastName: true, email: true } } },
    });
    if (!report) throw new NotFoundException('Bug report not found');
    return report;
  }

  async updateStatus(id: string, dto: UpdateBugReportStatusDto, actor: ActorRef) {
    const [existing] = await this.db.select().from(bugReports).where(eq(bugReports.id, id));
    if (!existing) throw new NotFoundException('Bug report not found');

    const [updated] = await this.db
      .update(bugReports)
      .set({ status: dto.status, adminNote: dto.adminNote ?? existing.adminNote })
      .where(eq(bugReports.id, id))
      .returning();

    await this.audit.log({
      entityType: 'BugReport',
      entityId: id,
      action: 'BUG_REPORT_STATUS_CHANGED',
      actor,
      metadata: { from: existing.status, to: dto.status, adminNote: dto.adminNote },
    });

    const [user] = await this.db
      .select({ email: users.email, firstName: users.firstName })
      .from(users)
      .where(eq(users.id, existing.userId));

    if (user?.email) {
      void this.emailService.send(user.email, 'bug_report_status_changed', {
        firstName: user.firstName ?? 'there',
        bugId: id,
        newStatus: dto.status,
        adminNote: dto.adminNote ?? '',
      });
    }

    return updated;
  }

  async batchUpdate(dto: BatchBugReportDto, actor: ActorRef) {
    const results = [];
    for (const id of dto.ids) {
      try {
        const updated = await this.updateStatus(id, { status: dto.status, adminNote: dto.adminNote }, actor);
        results.push({ id, success: true, report: updated });
      } catch (err) {
        results.push({ id, success: false, error: (err as Error).message });
      }
    }
    return results;
  }

  async delete(id: string, actor: ActorRef) {
    const [existing] = await this.db.select().from(bugReports).where(eq(bugReports.id, id));
    if (!existing) throw new NotFoundException('Bug report not found');

    await this.db.delete(bugReports).where(eq(bugReports.id, id));

    await this.audit.log({
      entityType: 'BugReport',
      entityId: id,
      action: 'BUG_REPORT_DELETED',
      actor,
      metadata: { type: existing.type, userId: existing.userId },
    });
  }
}
