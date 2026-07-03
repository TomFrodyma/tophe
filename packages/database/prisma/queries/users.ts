import type { z } from "zod";

import { db } from "../client";
import type { UserSchema } from "../zod";

export async function getUsers({
	limit,
	offset,
	query,
}: {
	limit: number;
	offset: number;
	query?: string;
}) {
	return await db.user.findMany({
		where: query
			? {
					OR: [
						{
							name: {
								contains: query,
								mode: "insensitive",
							},
						},
						{
							email: {
								contains: query,
								mode: "insensitive",
							},
						},
					],
				}
			: undefined,
		take: limit,
		skip: offset,
	});
}

export async function countAllUsers({ query }: { query?: string }) {
	return await db.user.count({
		where: query
			? {
					OR: [
						{
							name: {
								contains: query,
								mode: "insensitive",
							},
						},
						{
							email: {
								contains: query,
								mode: "insensitive",
							},
						},
					],
				}
			: undefined,
	});
}

export async function getUserById(id: string) {
	return await db.user.findUnique({
		where: {
			id,
		},
	});
}

export async function countUsers() {
	return await db.user.count();
}

/**
 * Atomic first-run bootstrap: creates the first admin and its credential
 * account, but only if the instance still has zero users. Returns null if a
 * user already exists. The serializable transaction makes two concurrent
 * first-run requests conflict, so exactly one admin can ever be created here
 * (the loser's transaction aborts) - no double-admin race.
 */
export async function createFirstAdminUser(input: {
	email: string;
	name: string;
	hashedPassword: string;
}) {
	return await db.$transaction(
		async (tx) => {
			if ((await tx.user.count()) > 0) return null;
			const now = new Date();
			const user = await tx.user.create({
				data: {
					email: input.email,
					name: input.name,
					role: "admin",
					emailVerified: true,
					// Sent through the in-app onboarding after first login.
					onboardingComplete: false,
					createdAt: now,
					updatedAt: now,
				},
			});
			await tx.account.create({
				data: {
					userId: user.id,
					accountId: user.id,
					providerId: "credential",
					password: input.hashedPassword,
					createdAt: now,
					updatedAt: now,
				},
			});
			return user;
		},
		{ isolationLevel: "Serializable" },
	);
}

export async function getUserByEmail(email: string) {
	return await db.user.findUnique({
		where: {
			email,
		},
	});
}

export async function createUser({
	email,
	name,
	role,
	emailVerified,
	onboardingComplete,
}: {
	email: string;
	name: string;
	role: "admin" | "user";
	emailVerified: boolean;
	onboardingComplete: boolean;
}) {
	return await db.user.create({
		data: {
			email,
			name,
			role,
			emailVerified,
			onboardingComplete,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	});
}

export async function getAccountById(id: string) {
	return await db.account.findUnique({
		where: {
			id,
		},
	});
}

export async function createUserAccount({
	userId,
	providerId,
	accountId,
	hashedPassword,
}: {
	userId: string;
	providerId: string;
	accountId: string;
	hashedPassword?: string;
}) {
	return await db.account.create({
		data: {
			userId,
			accountId,
			providerId,
			password: hashedPassword,
			createdAt: new Date(),
			updatedAt: new Date(),
		},
	});
}

export async function updateUser(user: Partial<z.infer<typeof UserSchema>> & { id: string }) {
	return await db.user.update({
		where: {
			id: user.id,
		},
		data: user,
	});
}

/**
 * Whether the brand logo is shown on surfaces rendered before login
 * (favicon, sign-in page).
 */
// Single-user app — the first user's preference doubles as the
// instance-wide switch; per-user resolution if the app ever goes multi-user.
export async function getInstanceBrandLogo(): Promise<boolean> {
	const owner = await db.user.findFirst({
		orderBy: { createdAt: "asc" },
		select: { showBrandLogo: true },
	});
	return owner?.showBrandLogo ?? true;
}

export async function getUserPinnedModules(userId: string): Promise<string[]> {
	const user = await db.user.findUnique({
		where: { id: userId },
		select: { pinnedModules: true },
	});
	return user?.pinnedModules ?? [];
}

export async function setUserPinnedModules(userId: string, modules: string[]) {
	await db.user.update({
		where: { id: userId },
		data: { pinnedModules: modules },
	});
	return modules;
}
