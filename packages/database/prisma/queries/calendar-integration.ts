import type { CalendarSource } from "../generated/client";
import { db } from "../client";

export interface IncomingSyncedEvent {
	externalId: string;
	title: string;
	location: string | null;
	startAt: Date;
	endAt: Date;
	allDay: boolean;
	rrule: string | null;
	excludedDates: Date[];
}

export async function getCalendarIntegration(userId: string, provider: CalendarSource) {
	return await db.calendarIntegration.findFirst({
		where: { userId, provider },
	});
}

export async function listCalendarIntegrationsForUser(userId: string) {
	return await db.calendarIntegration.findMany({
		where: { userId },
		orderBy: { createdAt: "asc" },
	});
}

export async function upsertCalendarIntegration({
	userId,
	provider,
	encryptedUrl,
	nonce,
	authTag,
}: {
	userId: string;
	provider: CalendarSource;
	encryptedUrl: string;
	nonce: string;
	authTag: string;
}) {
	return await db.calendarIntegration.upsert({
		where: { userId_provider: { userId, provider } },
		create: {
			userId,
			provider,
			encryptedUrl,
			nonce,
			authTag,
		},
		update: {
			encryptedUrl,
			nonce,
			authTag,
			lastSyncedAt: null,
			lastSyncStatus: null,
			lastSyncError: null,
			eventCount: 0,
		},
	});
}

export async function deleteCalendarIntegration(userId: string, provider: CalendarSource) {
	const result = await db.calendarIntegration.deleteMany({
		where: { userId, provider },
	});
	return result.count;
}

export async function updateIntegrationSyncStatus({
	integrationId,
	status,
	error,
	eventCount,
}: {
	integrationId: string;
	status: "ok" | "error";
	error?: string | null;
	eventCount?: number;
}) {
	return await db.calendarIntegration.update({
		where: { id: integrationId },
		data: {
			lastSyncedAt: new Date(),
			lastSyncStatus: status,
			lastSyncError: error ?? null,
			...(eventCount !== undefined ? { eventCount } : {}),
		},
	});
}

/**
 * Replace synced events for an integration with the given feed in one transaction:
 * - upsert incoming (idempotent on externalId)
 * - delete rows no longer present in the feed
 * Returns the number of events after sync.
 */
export async function replaceSyncedEvents({
	integrationId,
	userId,
	events,
}: {
	integrationId: string;
	userId: string;
	events: IncomingSyncedEvent[];
}) {
	await db.$transaction(
		async (tx) => {
			await tx.calendarEvent.deleteMany({ where: { integrationId } });
			if (events.length > 0) {
				await tx.calendarEvent.createMany({
					data: events.map((e) => ({
						userId,
						integrationId,
						source: "OUTLOOK_ICS" as const,
						externalId: e.externalId,
						title: e.title,
						location: e.location,
						startAt: e.startAt,
						endAt: e.endAt,
						allDay: e.allDay,
						rrule: e.rrule,
						excludedDates: e.excludedDates,
						color: "slate",
					})),
				});
			}
		},
		{ timeout: 30_000 },
	);

	return events.length;
}
