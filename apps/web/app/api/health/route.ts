/** Liveness probe for the Docker healthcheck and the installer's wait loop. */
export function GET() {
	return Response.json({ ok: true });
}
