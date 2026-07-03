/**
 * Prisma Zod Generator - Single File (inlined)
 * Auto-generated. Do not edit.
 */

import * as z from 'zod';
import { Prisma } from "../generated/client";
// File: TransactionIsolationLevel.schema.ts

export const TransactionIsolationLevelSchema = z.enum(['ReadUncommitted', 'ReadCommitted', 'RepeatableRead', 'Serializable'])

export type TransactionIsolationLevel = z.infer<typeof TransactionIsolationLevelSchema>;

// File: UserScalarFieldEnum.schema.ts

export const UserScalarFieldEnumSchema = z.enum(['id', 'name', 'email', 'emailVerified', 'image', 'createdAt', 'updatedAt', 'username', 'role', 'banned', 'banReason', 'banExpires', 'onboardingComplete', 'paymentsCustomerId', 'locale', 'displayUsername', 'twoFactorEnabled', 'timezone', 'pinnedModules', 'showBrandLogo'])

export type UserScalarFieldEnum = z.infer<typeof UserScalarFieldEnumSchema>;

// File: SessionScalarFieldEnum.schema.ts

export const SessionScalarFieldEnumSchema = z.enum(['id', 'expiresAt', 'ipAddress', 'userAgent', 'userId', 'impersonatedBy', 'token', 'createdAt', 'updatedAt'])

export type SessionScalarFieldEnum = z.infer<typeof SessionScalarFieldEnumSchema>;

// File: AccountScalarFieldEnum.schema.ts

export const AccountScalarFieldEnumSchema = z.enum(['id', 'accountId', 'providerId', 'userId', 'accessToken', 'refreshToken', 'idToken', 'expiresAt', 'password', 'accessTokenExpiresAt', 'refreshTokenExpiresAt', 'scope', 'createdAt', 'updatedAt'])

export type AccountScalarFieldEnum = z.infer<typeof AccountScalarFieldEnumSchema>;

// File: VerificationScalarFieldEnum.schema.ts

export const VerificationScalarFieldEnumSchema = z.enum(['id', 'identifier', 'value', 'expiresAt', 'createdAt', 'updatedAt'])

export type VerificationScalarFieldEnum = z.infer<typeof VerificationScalarFieldEnumSchema>;

// File: PasskeyScalarFieldEnum.schema.ts

export const PasskeyScalarFieldEnumSchema = z.enum(['id', 'name', 'publicKey', 'userId', 'credentialID', 'counter', 'deviceType', 'backedUp', 'transports', 'aaguid', 'createdAt'])

export type PasskeyScalarFieldEnum = z.infer<typeof PasskeyScalarFieldEnumSchema>;

// File: TwoFactorScalarFieldEnum.schema.ts

export const TwoFactorScalarFieldEnumSchema = z.enum(['id', 'secret', 'backupCodes', 'userId'])

export type TwoFactorScalarFieldEnum = z.infer<typeof TwoFactorScalarFieldEnumSchema>;

// File: PurchaseScalarFieldEnum.schema.ts

export const PurchaseScalarFieldEnumSchema = z.enum(['id', 'userId', 'type', 'customerId', 'subscriptionId', 'priceId', 'status', 'createdAt', 'updatedAt'])

export type PurchaseScalarFieldEnum = z.infer<typeof PurchaseScalarFieldEnumSchema>;

// File: NotificationScalarFieldEnum.schema.ts

export const NotificationScalarFieldEnumSchema = z.enum(['id', 'userId', 'type', 'data', 'link', 'read', 'createdAt', 'updatedAt'])

export type NotificationScalarFieldEnum = z.infer<typeof NotificationScalarFieldEnumSchema>;

// File: UserNotificationPreferenceScalarFieldEnum.schema.ts

export const UserNotificationPreferenceScalarFieldEnumSchema = z.enum(['id', 'userId', 'type', 'target', 'createdAt'])

export type UserNotificationPreferenceScalarFieldEnum = z.infer<typeof UserNotificationPreferenceScalarFieldEnumSchema>;

// File: WebPushVapidKeyScalarFieldEnum.schema.ts

export const WebPushVapidKeyScalarFieldEnumSchema = z.enum(['id', 'publicKey', 'privateKey', 'createdAt'])

export type WebPushVapidKeyScalarFieldEnum = z.infer<typeof WebPushVapidKeyScalarFieldEnumSchema>;

// File: WebPushSubscriptionScalarFieldEnum.schema.ts

export const WebPushSubscriptionScalarFieldEnumSchema = z.enum(['id', 'userId', 'endpoint', 'p256dh', 'auth', 'userAgent', 'createdAt', 'updatedAt'])

export type WebPushSubscriptionScalarFieldEnum = z.infer<typeof WebPushSubscriptionScalarFieldEnumSchema>;

// File: JournalEntryScalarFieldEnum.schema.ts

export const JournalEntryScalarFieldEnumSchema = z.enum(['id', 'userId', 'title', 'content', 'mood', 'isDaily', 'createdAt', 'updatedAt'])

export type JournalEntryScalarFieldEnum = z.infer<typeof JournalEntryScalarFieldEnumSchema>;

// File: CalendarIntegrationScalarFieldEnum.schema.ts

export const CalendarIntegrationScalarFieldEnumSchema = z.enum(['id', 'userId', 'provider', 'encryptedUrl', 'nonce', 'authTag', 'lastSyncedAt', 'lastSyncStatus', 'lastSyncError', 'eventCount', 'createdAt', 'updatedAt'])

export type CalendarIntegrationScalarFieldEnum = z.infer<typeof CalendarIntegrationScalarFieldEnumSchema>;

// File: CalendarEventScalarFieldEnum.schema.ts

export const CalendarEventScalarFieldEnumSchema = z.enum(['id', 'userId', 'title', 'description', 'location', 'startAt', 'endAt', 'allDay', 'color', 'icon', 'rrule', 'excludedDates', 'reminderMinutes', 'source', 'externalId', 'integrationId', 'createdAt', 'updatedAt'])

export type CalendarEventScalarFieldEnum = z.infer<typeof CalendarEventScalarFieldEnumSchema>;

// File: GoalScalarFieldEnum.schema.ts

export const GoalScalarFieldEnumSchema = z.enum(['id', 'userId', 'title', 'description', 'type', 'status', 'horizon', 'targetValue', 'currentValue', 'unit', 'startDate', 'dueDate', 'color', 'icon', 'cadence', 'sortOrder', 'lastCheckInAt', 'lastReminderAt', 'deadlineNotifiedAt', 'completedAt', 'createdAt', 'updatedAt'])

export type GoalScalarFieldEnum = z.infer<typeof GoalScalarFieldEnumSchema>;

// File: GoalMilestoneScalarFieldEnum.schema.ts

export const GoalMilestoneScalarFieldEnumSchema = z.enum(['id', 'goalId', 'title', 'order', 'done', 'doneAt', 'createdAt', 'updatedAt'])

export type GoalMilestoneScalarFieldEnum = z.infer<typeof GoalMilestoneScalarFieldEnumSchema>;

// File: GoalCheckInScalarFieldEnum.schema.ts

export const GoalCheckInScalarFieldEnumSchema = z.enum(['id', 'goalId', 'userId', 'value', 'note', 'createdAt'])

export type GoalCheckInScalarFieldEnum = z.infer<typeof GoalCheckInScalarFieldEnumSchema>;

// File: TaskScalarFieldEnum.schema.ts

export const TaskScalarFieldEnumSchema = z.enum(['id', 'userId', 'title', 'notes', 'status', 'dueDate', 'completedAt', 'createdAt', 'updatedAt'])

export type TaskScalarFieldEnum = z.infer<typeof TaskScalarFieldEnumSchema>;

// File: NoteScalarFieldEnum.schema.ts

export const NoteScalarFieldEnumSchema = z.enum(['id', 'userId', 'title', 'content', 'pinOrder', 'remindAt', 'createdAt', 'updatedAt'])

export type NoteScalarFieldEnum = z.infer<typeof NoteScalarFieldEnumSchema>;

// File: WishlistItemScalarFieldEnum.schema.ts

export const WishlistItemScalarFieldEnumSchema = z.enum(['id', 'userId', 'title', 'notes', 'url', 'price', 'currency', 'priority', 'status', 'sortOrder', 'purchasedAt', 'createdAt', 'updatedAt'])

export type WishlistItemScalarFieldEnum = z.infer<typeof WishlistItemScalarFieldEnumSchema>;

// File: CareerRoleScalarFieldEnum.schema.ts

export const CareerRoleScalarFieldEnumSchema = z.enum(['id', 'userId', 'company', 'title', 'kind', 'location', 'startDate', 'endDate', 'summary', 'color', 'icon', 'sortIndex', 'createdAt', 'updatedAt'])

export type CareerRoleScalarFieldEnum = z.infer<typeof CareerRoleScalarFieldEnumSchema>;

// File: CareerHighlightScalarFieldEnum.schema.ts

export const CareerHighlightScalarFieldEnumSchema = z.enum(['id', 'userId', 'roleId', 'text', 'metric', 'sortIndex', 'createdAt', 'updatedAt'])

export type CareerHighlightScalarFieldEnum = z.infer<typeof CareerHighlightScalarFieldEnumSchema>;

// File: CareerSalaryScalarFieldEnum.schema.ts

export const CareerSalaryScalarFieldEnumSchema = z.enum(['id', 'userId', 'roleId', 'effectiveDate', 'amount', 'currency', 'basis', 'period', 'label', 'createdAt', 'updatedAt'])

export type CareerSalaryScalarFieldEnum = z.infer<typeof CareerSalaryScalarFieldEnumSchema>;

// File: CareerSkillScalarFieldEnum.schema.ts

export const CareerSkillScalarFieldEnumSchema = z.enum(['id', 'userId', 'name', 'category', 'level', 'sortIndex', 'createdAt', 'updatedAt'])

export type CareerSkillScalarFieldEnum = z.infer<typeof CareerSkillScalarFieldEnumSchema>;

// File: CareerNextStepScalarFieldEnum.schema.ts

export const CareerNextStepScalarFieldEnumSchema = z.enum(['id', 'userId', 'text', 'detail', 'timeframe', 'source', 'done', 'doneAt', 'sortIndex', 'createdAt', 'updatedAt'])

export type CareerNextStepScalarFieldEnum = z.infer<typeof CareerNextStepScalarFieldEnumSchema>;

// File: CareerProfileScalarFieldEnum.schema.ts

export const CareerProfileScalarFieldEnumSchema = z.enum(['id', 'userId', 'reflections', 'insightsJson', 'insightsGeneratedAt', 'createdAt', 'updatedAt'])

export type CareerProfileScalarFieldEnum = z.infer<typeof CareerProfileScalarFieldEnumSchema>;

// File: AgentProfileScalarFieldEnum.schema.ts

export const AgentProfileScalarFieldEnumSchema = z.enum(['id', 'userId', 'name', 'personaPrompt', 'coreProfile', 'interests', 'newsFeeds', 'createdAt', 'updatedAt'])

export type AgentProfileScalarFieldEnum = z.infer<typeof AgentProfileScalarFieldEnumSchema>;

// File: AgentMemoryScalarFieldEnum.schema.ts

export const AgentMemoryScalarFieldEnumSchema = z.enum(['id', 'userId', 'content', 'source', 'createdAt'])

export type AgentMemoryScalarFieldEnum = z.infer<typeof AgentMemoryScalarFieldEnumSchema>;

// File: AgentConversationScalarFieldEnum.schema.ts

export const AgentConversationScalarFieldEnumSchema = z.enum(['id', 'userId', 'title', 'createdAt', 'updatedAt'])

export type AgentConversationScalarFieldEnum = z.infer<typeof AgentConversationScalarFieldEnumSchema>;

// File: AgentMessageScalarFieldEnum.schema.ts

export const AgentMessageScalarFieldEnumSchema = z.enum(['id', 'conversationId', 'role', 'parts', 'createdAt', 'order'])

export type AgentMessageScalarFieldEnum = z.infer<typeof AgentMessageScalarFieldEnumSchema>;

// File: StartGreetingScalarFieldEnum.schema.ts

export const StartGreetingScalarFieldEnumSchema = z.enum(['id', 'userId', 'slotKey', 'headline', 'note', 'updatedAt'])

export type StartGreetingScalarFieldEnum = z.infer<typeof StartGreetingScalarFieldEnumSchema>;

// File: DailyBriefingScalarFieldEnum.schema.ts

export const DailyBriefingScalarFieldEnumSchema = z.enum(['id', 'userId', 'dayKey', 'payload', 'createdAt', 'updatedAt'])

export type DailyBriefingScalarFieldEnum = z.infer<typeof DailyBriefingScalarFieldEnumSchema>;

// File: SortOrder.schema.ts

export const SortOrderSchema = z.enum(['asc', 'desc'])

export type SortOrder = z.infer<typeof SortOrderSchema>;

// File: JsonNullValueInput.schema.ts

export const JsonNullValueInputSchema = z.enum(['JsonNull'])

export type JsonNullValueInput = z.infer<typeof JsonNullValueInputSchema>;

// File: QueryMode.schema.ts

export const QueryModeSchema = z.enum(['default', 'insensitive'])

export type QueryMode = z.infer<typeof QueryModeSchema>;

// File: NullsOrder.schema.ts

export const NullsOrderSchema = z.enum(['first', 'last'])

export type NullsOrder = z.infer<typeof NullsOrderSchema>;

// File: JsonNullValueFilter.schema.ts

export const JsonNullValueFilterSchema = z.enum(['DbNull', 'JsonNull', 'AnyNull'])

export type JsonNullValueFilter = z.infer<typeof JsonNullValueFilterSchema>;

// File: PurchaseType.schema.ts

export const PurchaseTypeSchema = z.enum(['SUBSCRIPTION', 'ONE_TIME'])

export type PurchaseType = z.infer<typeof PurchaseTypeSchema>;

// File: NotificationType.schema.ts

export const NotificationTypeSchema = z.enum(['WELCOME', 'APP_UPDATE', 'JOURNAL_DAILY_REMINDER', 'CALENDAR_EVENT_REMINDER', 'GOAL_CHECKIN_REMINDER', 'GOAL_DEADLINE_APPROACHING', 'MEMO_REMINDER', 'DAILY_BRIEFING'])

export type NotificationType = z.infer<typeof NotificationTypeSchema>;

// File: NotificationTarget.schema.ts

export const NotificationTargetSchema = z.enum(['IN_APP', 'EMAIL', 'WEB_PUSH'])

export type NotificationTarget = z.infer<typeof NotificationTargetSchema>;

// File: JournalMood.schema.ts

export const JournalMoodSchema = z.enum(['GREAT', 'GOOD', 'OKAY', 'LOW', 'BAD'])

export type JournalMood = z.infer<typeof JournalMoodSchema>;

// File: CalendarSource.schema.ts

export const CalendarSourceSchema = z.enum(['MANUAL', 'OUTLOOK_ICS'])

export type CalendarSource = z.infer<typeof CalendarSourceSchema>;

// File: GoalType.schema.ts

export const GoalTypeSchema = z.enum(['NUMERIC', 'BOOLEAN', 'MILESTONE'])

export type GoalType = z.infer<typeof GoalTypeSchema>;

// File: GoalStatus.schema.ts

export const GoalStatusSchema = z.enum(['ACTIVE', 'COMPLETED', 'PAUSED', 'ARCHIVED'])

export type GoalStatus = z.infer<typeof GoalStatusSchema>;

// File: GoalHorizon.schema.ts

export const GoalHorizonSchema = z.enum(['LONG_TERM', 'PROJECT', 'HABIT'])

export type GoalHorizon = z.infer<typeof GoalHorizonSchema>;

// File: GoalCadence.schema.ts

export const GoalCadenceSchema = z.enum(['NONE', 'DAILY', 'WEEKLY', 'MONTHLY'])

export type GoalCadence = z.infer<typeof GoalCadenceSchema>;

// File: TaskStatus.schema.ts

export const TaskStatusSchema = z.enum(['OPEN', 'DONE'])

export type TaskStatus = z.infer<typeof TaskStatusSchema>;

// File: WishlistPriority.schema.ts

export const WishlistPrioritySchema = z.enum(['NEED', 'WANT', 'SOMEDAY'])

export type WishlistPriority = z.infer<typeof WishlistPrioritySchema>;

// File: WishlistStatus.schema.ts

export const WishlistStatusSchema = z.enum(['WANTED', 'PURCHASED'])

export type WishlistStatus = z.infer<typeof WishlistStatusSchema>;

// File: CareerRoleKind.schema.ts

export const CareerRoleKindSchema = z.enum(['EMPLOYMENT', 'FREELANCE', 'EDUCATION', 'OTHER'])

export type CareerRoleKind = z.infer<typeof CareerRoleKindSchema>;

// File: SalaryBasis.schema.ts

export const SalaryBasisSchema = z.enum(['NET', 'GROSS'])

export type SalaryBasis = z.infer<typeof SalaryBasisSchema>;

// File: SalaryPeriod.schema.ts

export const SalaryPeriodSchema = z.enum(['MONTHLY', 'YEARLY'])

export type SalaryPeriod = z.infer<typeof SalaryPeriodSchema>;

// File: SkillLevel.schema.ts

export const SkillLevelSchema = z.enum(['LEARNING', 'WORKING', 'STRONG', 'EXPERT'])

export type SkillLevel = z.infer<typeof SkillLevelSchema>;

// File: User.schema.ts

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  image: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
  username: z.string().nullish(),
  role: z.string().nullish(),
  banned: z.boolean().nullish(),
  banReason: z.string().nullish(),
  banExpires: z.date().nullish(),
  onboardingComplete: z.boolean(),
  paymentsCustomerId: z.string().nullish(),
  locale: z.string().nullish(),
  displayUsername: z.string().nullish(),
  twoFactorEnabled: z.boolean().nullish(),
  timezone: z.string().default("UTC"),
  pinnedModules: z.array(z.string()),
  showBrandLogo: z.boolean().default(true),
});

export type UserType = z.infer<typeof UserSchema>;


// File: Session.schema.ts

export const SessionSchema = z.object({
  id: z.string(),
  expiresAt: z.date(),
  ipAddress: z.string().nullish(),
  userAgent: z.string().nullish(),
  userId: z.string(),
  impersonatedBy: z.string().nullish(),
  token: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SessionType = z.infer<typeof SessionSchema>;


// File: Account.schema.ts

export const AccountSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  providerId: z.string(),
  userId: z.string(),
  accessToken: z.string().nullish(),
  refreshToken: z.string().nullish(),
  idToken: z.string().nullish(),
  expiresAt: z.date().nullish(),
  password: z.string().nullish(),
  accessTokenExpiresAt: z.date().nullish(),
  refreshTokenExpiresAt: z.date().nullish(),
  scope: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AccountType = z.infer<typeof AccountSchema>;


// File: Verification.schema.ts

export const VerificationSchema = z.object({
  id: z.string(),
  identifier: z.string(),
  value: z.string(),
  expiresAt: z.date(),
  createdAt: z.date().nullish(),
  updatedAt: z.date().nullish(),
});

export type VerificationType = z.infer<typeof VerificationSchema>;


// File: Passkey.schema.ts

export const PasskeySchema = z.object({
  id: z.string(),
  name: z.string().nullish(),
  publicKey: z.string(),
  userId: z.string(),
  credentialID: z.string(),
  counter: z.number().int(),
  deviceType: z.string(),
  backedUp: z.boolean(),
  transports: z.string().nullish(),
  aaguid: z.string().nullish(),
  createdAt: z.date().nullish(),
});

export type PasskeyType = z.infer<typeof PasskeySchema>;


// File: TwoFactor.schema.ts

export const TwoFactorSchema = z.object({
  id: z.string(),
  secret: z.string(),
  backupCodes: z.string(),
  userId: z.string(),
});

export type TwoFactorType = z.infer<typeof TwoFactorSchema>;


// File: Purchase.schema.ts

export const PurchaseSchema = z.object({
  id: z.string(),
  userId: z.string().nullish(),
  type: PurchaseTypeSchema,
  customerId: z.string(),
  subscriptionId: z.string().nullish(),
  priceId: z.string(),
  status: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type PurchaseModel = z.infer<typeof PurchaseSchema>;

// File: Notification.schema.ts

export const NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: NotificationTypeSchema,
  data: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").default("{}"),
  link: z.string().nullish(),
  read: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type NotificationModel = z.infer<typeof NotificationSchema>;

// File: UserNotificationPreference.schema.ts

export const UserNotificationPreferenceSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: NotificationTypeSchema,
  target: NotificationTargetSchema,
  createdAt: z.date(),
});

export type UserNotificationPreferenceType = z.infer<typeof UserNotificationPreferenceSchema>;


// File: WebPushVapidKey.schema.ts

export const WebPushVapidKeySchema = z.object({
  id: z.string(),
  publicKey: z.string(),
  privateKey: z.string(),
  createdAt: z.date(),
});

export type WebPushVapidKeyType = z.infer<typeof WebPushVapidKeySchema>;


// File: WebPushSubscription.schema.ts

export const WebPushSubscriptionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  endpoint: z.string(),
  p256dh: z.string(),
  auth: z.string(),
  userAgent: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type WebPushSubscriptionType = z.infer<typeof WebPushSubscriptionSchema>;


// File: JournalEntry.schema.ts

export const JournalEntrySchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  content: z.string(),
  mood: JournalMoodSchema.nullish(),
  isDaily: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type JournalEntryType = z.infer<typeof JournalEntrySchema>;


// File: CalendarIntegration.schema.ts

export const CalendarIntegrationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  provider: CalendarSourceSchema,
  encryptedUrl: z.string(),
  nonce: z.string(),
  authTag: z.string(),
  lastSyncedAt: z.date().nullish(),
  lastSyncStatus: z.string().nullish(),
  lastSyncError: z.string().nullish(),
  eventCount: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CalendarIntegrationType = z.infer<typeof CalendarIntegrationSchema>;


// File: CalendarEvent.schema.ts

export const CalendarEventSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  description: z.string().nullish(),
  location: z.string().nullish(),
  startAt: z.date(),
  endAt: z.date(),
  allDay: z.boolean(),
  color: z.string().default("sky"),
  icon: z.string().nullish(),
  rrule: z.string().nullish(),
  excludedDates: z.array(z.date()),
  reminderMinutes: z.number().int().nullish(),
  source: CalendarSourceSchema.default("MANUAL"),
  externalId: z.string().nullish(),
  integrationId: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CalendarEventType = z.infer<typeof CalendarEventSchema>;


// File: Goal.schema.ts

export const GoalSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  description: z.string().nullish(),
  type: GoalTypeSchema.default("NUMERIC"),
  status: GoalStatusSchema.default("ACTIVE"),
  horizon: GoalHorizonSchema.default("LONG_TERM"),
  targetValue: z.number().nullish(),
  currentValue: z.number(),
  unit: z.string().nullish(),
  startDate: z.date().nullish(),
  dueDate: z.date().nullish(),
  color: z.string().default("sky"),
  icon: z.string().nullish(),
  cadence: GoalCadenceSchema.default("NONE"),
  sortOrder: z.number().int(),
  lastCheckInAt: z.date().nullish(),
  lastReminderAt: z.date().nullish(),
  deadlineNotifiedAt: z.date().nullish(),
  completedAt: z.date().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type GoalModel = z.infer<typeof GoalSchema>;

// File: GoalMilestone.schema.ts

export const GoalMilestoneSchema = z.object({
  id: z.string(),
  goalId: z.string(),
  title: z.string(),
  order: z.number().int(),
  done: z.boolean(),
  doneAt: z.date().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type GoalMilestoneType = z.infer<typeof GoalMilestoneSchema>;


// File: GoalCheckIn.schema.ts

export const GoalCheckInSchema = z.object({
  id: z.string(),
  goalId: z.string(),
  userId: z.string(),
  value: z.number().default(1.0),
  note: z.string().nullish(),
  createdAt: z.date(),
});

export type GoalCheckInType = z.infer<typeof GoalCheckInSchema>;


// File: Task.schema.ts

export const TaskSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  notes: z.string().nullish(),
  status: TaskStatusSchema.default("OPEN"),
  dueDate: z.date().nullish(),
  completedAt: z.date().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type TaskType = z.infer<typeof TaskSchema>;


// File: Note.schema.ts

export const NoteSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  content: z.string(),
  pinOrder: z.number().int().nullish(),
  remindAt: z.date().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type NoteType = z.infer<typeof NoteSchema>;


// File: WishlistItem.schema.ts

export const WishlistItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  notes: z.string().nullish(),
  url: z.string().nullish(),
  price: z.number().nullish(),
  currency: z.string().nullish(),
  priority: WishlistPrioritySchema.default("WANT"),
  status: WishlistStatusSchema.default("WANTED"),
  sortOrder: z.number().int(),
  purchasedAt: z.date().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type WishlistItemType = z.infer<typeof WishlistItemSchema>;


// File: CareerRole.schema.ts

export const CareerRoleSchema = z.object({
  id: z.string(),
  userId: z.string(),
  company: z.string(),
  title: z.string(),
  kind: CareerRoleKindSchema.default("EMPLOYMENT"),
  location: z.string().nullish(),
  startDate: z.date(),
  endDate: z.date().nullish(),
  summary: z.string().nullish(),
  color: z.string().default("sky"),
  icon: z.string().nullish(),
  sortIndex: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CareerRoleType = z.infer<typeof CareerRoleSchema>;


// File: CareerHighlight.schema.ts

export const CareerHighlightSchema = z.object({
  id: z.string(),
  userId: z.string(),
  roleId: z.string(),
  text: z.string(),
  metric: z.string().nullish(),
  sortIndex: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CareerHighlightType = z.infer<typeof CareerHighlightSchema>;


// File: CareerSalary.schema.ts

export const CareerSalarySchema = z.object({
  id: z.string(),
  userId: z.string(),
  roleId: z.string().nullish(),
  effectiveDate: z.date(),
  amount: z.instanceof(Prisma.Decimal, {
  message: "Field 'amount' must be a Decimal. Location: ['Models', 'CareerSalary']",
}),
  currency: z.string().default("EUR"),
  basis: SalaryBasisSchema.default("NET"),
  period: SalaryPeriodSchema.default("MONTHLY"),
  label: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CareerSalaryType = z.infer<typeof CareerSalarySchema>;


// File: CareerSkill.schema.ts

export const CareerSkillSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  category: z.string(),
  level: SkillLevelSchema.nullish(),
  sortIndex: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CareerSkillType = z.infer<typeof CareerSkillSchema>;


// File: CareerNextStep.schema.ts

export const CareerNextStepSchema = z.object({
  id: z.string(),
  userId: z.string(),
  text: z.string(),
  detail: z.string().nullish(),
  timeframe: z.string().nullish(),
  source: z.string().default("MANUAL"),
  done: z.boolean(),
  doneAt: z.date().nullish(),
  sortIndex: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CareerNextStepType = z.infer<typeof CareerNextStepSchema>;


// File: CareerProfile.schema.ts

export const CareerProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  reflections: z.string().nullish(),
  insightsJson: z.string().nullish(),
  insightsGeneratedAt: z.date().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type CareerProfileType = z.infer<typeof CareerProfileSchema>;


// File: AgentProfile.schema.ts

export const AgentProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string().default("Tophe"),
  personaPrompt: z.string(),
  coreProfile: z.string(),
  interests: z.string(),
  newsFeeds: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10").default("[]"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AgentProfileType = z.infer<typeof AgentProfileSchema>;


// File: AgentMemory.schema.ts

export const AgentMemorySchema = z.object({
  id: z.string(),
  userId: z.string(),
  content: z.string(),
  source: z.string().default("AGENT"),
  createdAt: z.date(),
});

export type AgentMemoryType = z.infer<typeof AgentMemorySchema>;


// File: AgentConversation.schema.ts

export const AgentConversationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string().nullish(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type AgentConversationType = z.infer<typeof AgentConversationSchema>;


// File: AgentMessage.schema.ts

export const AgentMessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  role: z.string(),
  parts: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10"),
  createdAt: z.date(),
  order: z.number().int(),
});

export type AgentMessageType = z.infer<typeof AgentMessageSchema>;


// File: StartGreeting.schema.ts

export const StartGreetingSchema = z.object({
  id: z.string(),
  userId: z.string(),
  slotKey: z.string(),
  headline: z.string(),
  note: z.string(),
  updatedAt: z.date(),
});

export type StartGreetingType = z.infer<typeof StartGreetingSchema>;


// File: DailyBriefing.schema.ts

export const DailyBriefingSchema = z.object({
  id: z.string(),
  userId: z.string(),
  dayKey: z.string(),
  payload: z.unknown().refine((val) => { const getDepth = (obj: unknown, depth: number = 0): number => { if (depth > 10) return depth; if (obj === null || typeof obj !== 'object') return depth; const values = Object.values(obj as Record<string, unknown>); if (values.length === 0) return depth; return Math.max(...values.map(v => getDepth(v, depth + 1))); }; return getDepth(val) <= 10; }, "JSON nesting depth exceeds maximum of 10"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type DailyBriefingType = z.infer<typeof DailyBriefingSchema>;

