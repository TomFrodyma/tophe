import { Resend } from "resend";

import { config } from "../config";
import type { SendEmailHandler } from "../types";

// Lazy: constructing Resend without a key throws, which would crash any
// import of this module (including the build). No key = email quietly off;
// everything else works.
let resend: Resend | null = null;

export const send: SendEmailHandler = async ({
	to,
	from,
	subject,
	cc,
	bcc,
	replyTo,
	html,
	text,
}) => {
	if (!process.env.RESEND_API_KEY) {
		// No subject/recipient in the log line: it can contain user content.
		console.info("Email sending is not configured (RESEND_API_KEY unset); message skipped");
		return;
	}
	resend ??= new Resend(process.env.RESEND_API_KEY);

	await resend.emails.send({
		from: from ?? config.mailFrom,
		to: [to],
		cc,
		bcc,
		replyTo,
		subject,
		html,
		text,
	});
};
