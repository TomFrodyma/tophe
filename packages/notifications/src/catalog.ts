/** Section id for i18n (`settings.notificationsPage.groups.${id}`) and ordering. */
export type NotificationGroupId =
	| "general"
	| "briefing"
	| "journal"
	| "calendar"
	| "goals"
	| "notes";

/** Mirrors Prisma `NotificationType` - keep in sync with schema. */
export type NotificationTypeId =
	| "WELCOME"
	| "APP_UPDATE"
	| "JOURNAL_DAILY_REMINDER"
	| "CALENDAR_EVENT_REMINDER"
	| "GOAL_CHECKIN_REMINDER"
	| "GOAL_DEADLINE_APPROACHING"
	| "MEMO_REMINDER"
	| "DAILY_BRIEFING";

export interface NotificationGroupConfig {
	id: NotificationGroupId;
	/** Notification types in this section, in display order. */
	types: readonly NotificationTypeId[];
}

/**
 * Ordered groups for the notification preferences UI.
 * Reorder this list or the `types` arrays to change settings layout without DB migrations.
 */
export const NOTIFICATION_GROUPS: readonly NotificationGroupConfig[] = [
	{
		id: "general",
		types: ["APP_UPDATE"],
	},
	{
		id: "briefing",
		types: ["DAILY_BRIEFING"],
	},
	{
		id: "journal",
		types: ["JOURNAL_DAILY_REMINDER"],
	},
	{
		id: "calendar",
		types: ["CALENDAR_EVENT_REMINDER"],
	},
	{
		id: "goals",
		types: ["GOAL_CHECKIN_REMINDER", "GOAL_DEADLINE_APPROACHING"],
	},
	{
		id: "notes",
		types: ["MEMO_REMINDER"],
	},
];
