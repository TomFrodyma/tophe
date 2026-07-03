/**
 * Plays a short two-tone chime via Web Audio. No audio asset required.
 *
 * Browsers block `AudioContext` from starting without a user gesture. For a
 * notification sound triggered by polling, that means the very first poll of
 * a fresh tab may be silent - subsequent plays work after any click/keypress.
 * This matches the behavior of most "soft" browser notification sounds and
 * avoids the console-warning churn of trying to auto-resume.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
	if (typeof window === "undefined") return null;
	if (audioCtx) return audioCtx;
	const Ctor =
		window.AudioContext ??
		(window as unknown as { webkitAudioContext?: typeof AudioContext })
			.webkitAudioContext;
	if (!Ctor) return null;
	try {
		audioCtx = new Ctor();
	} catch {
		return null;
	}
	return audioCtx;
}

function playTone(ctx: AudioContext, freq: number, startAt: number, duration: number): void {
	const osc = ctx.createOscillator();
	const gain = ctx.createGain();
	osc.type = "sine";
	osc.frequency.value = freq;

	// Bell-like envelope: fast attack, exponential decay.
	gain.gain.setValueAtTime(0, startAt);
	gain.gain.linearRampToValueAtTime(0.18, startAt + 0.01);
	gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

	osc.connect(gain).connect(ctx.destination);
	osc.start(startAt);
	osc.stop(startAt + duration + 0.02);
}

export function playNotificationSound(): void {
	const ctx = getAudioContext();
	if (!ctx) return;

	// Resume if the tab's context was suspended by autoplay policy.
	if (ctx.state === "suspended") {
		void ctx.resume().catch(() => {});
	}

	const now = ctx.currentTime;
	// Two-note chime (C6 then E6) - short, soft, distinctive.
	playTone(ctx, 1046.5, now, 0.14);
	playTone(ctx, 1318.51, now + 0.1, 0.2);
}
