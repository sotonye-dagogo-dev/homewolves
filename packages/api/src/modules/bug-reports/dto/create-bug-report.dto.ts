import { z } from 'zod';

const bugReportTypeEnum = z.enum(['BUG', 'FEATURE_REQUEST', 'UI_ISSUE', 'PERFORMANCE', 'OTHER']);
const bugReportStatusEnum = z.enum(['OPEN', 'UNDER_REVIEW', 'CLOSED']);

export const createBugReportSchema = z
  .object({
    type: bugReportTypeEnum,
    description: z.string().trim().min(10).max(5000),
    screenshots: z.array(z.string().trim().max(2000)).max(3).optional(),
  })
  .strict();
export type CreateBugReportDto = z.infer<typeof createBugReportSchema>;

export const updateBugReportStatusSchema = z
  .object({
    status: bugReportStatusEnum,
    adminNote: z.string().trim().max(2000).optional(),
  })
  .strict();
export type UpdateBugReportStatusDto = z.infer<typeof updateBugReportStatusSchema>;

export const batchBugReportSchema = z
  .object({
    ids: z.array(z.string().trim().min(1)).min(1).max(100),
    status: bugReportStatusEnum,
    adminNote: z.string().trim().max(2000).optional(),
  })
  .strict();
export type BatchBugReportDto = z.infer<typeof batchBugReportSchema>;
