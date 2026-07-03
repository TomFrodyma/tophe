import { getSignedUrl } from "@repo/storage";
import { config as storageConfig } from "@repo/storage/config";
import { NextResponse } from "next/server";

type BucketKey = keyof typeof storageConfig.bucketNames;

export const GET = async (_req: Request, { params }: { params: Promise<{ path: string[] }> }) => {
	const { path } = await params;

	const [bucketName, ...rest] = path;
	const filePath = rest.join("/");

	if (!(bucketName && filePath)) {
		return new Response("Invalid path", { status: 400 });
	}

	// The URL contains the configured bucket *name* (e.g. "tophe-avatars").
	// Resolve it back to its config key (e.g. "avatars") before signing.
	const bucketKey = (
		Object.entries(storageConfig.bucketNames) as Array<[BucketKey, string]>
	).find(([, name]) => name === bucketName)?.[0];

	if (!bucketKey) {
		return new Response("Not found", { status: 404 });
	}

	const signedUrl = await getSignedUrl(filePath, {
		bucket: bucketKey,
		expiresIn: 60 * 60,
	});

	return NextResponse.redirect(signedUrl, {
		headers: { "Cache-Control": "max-age=3600" },
	});
};
