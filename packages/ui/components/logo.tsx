import type { SVGProps } from "react";

import { cn } from "../lib";

const TOPHE_VIEWBOX = "0 0 611.82 515.24";

// Face + hat silhouette, filled white so the mark reads the same on any background.
const TOPHE_FACE =
	"M489.75,58.03c-12.22-13.02-33.29-11.8-43.71,2.7-.29.4-.64.84-.94,1.24-1.15,1.57-2.31,3.12-3.5,4.65-1.15,1.47-2.38,2.96-3.62,4.45-1.01,1.21-1.99,2.46-3.02,3.64-2.18,2.49-4.49,4.98-6.92,7.44-31.68,32.32-74.72,52.22-122.12,52.22-43.98,0-84.17-17.23-115.06-45.56l-.06.06c-10.22-9.15-18.56-19.15-25.02-28.14-10.42-14.5-31.49-15.72-43.71-2.7-5.72,6.09-10.2,11.25-12.05,13.41-21.2,25.7-37.84,55.59-48.56,88.36h84.29c-12.61,26.01-19.77,55.45-19.77,86.64,0,105.04,80.72,190.49,179.94,190.49s179.94-85.45,179.94-190.49c0-31.19-7.16-60.62-19.77-86.64h84.29c-10.57-32.32-26.89-61.86-47.68-87.32-.25-.29-5.54-6.57-12.94-14.45ZM278.23,298.66c-2.47,32.21-22.19,56.97-44.04,55.29-21.85-1.68-37.55-29.15-35.08-61.36,2.47-32.21,22.19-56.97,44.04-55.29,3.39.26,6.61,1.21,9.65,2.63-3.64,4.44-6.2,10.84-6.76,18.11-1.09,14.25,5.86,26.41,15.52,27.15,5.94.46,11.51-3.51,15.18-9.93,1.54,7.26,2.11,15.17,1.48,23.4ZM377.63,353.95c-21.85,1.68-41.56-23.08-44.04-55.29-.63-8.23-.06-16.14,1.48-23.4,3.68,6.42,9.25,10.38,15.18,9.93,9.67-.74,16.62-12.9,15.52-27.15-.56-7.27-3.11-13.68-6.75-18.11,3.05-1.42,6.27-2.37,9.65-2.63,21.85-1.68,41.57,23.08,44.04,55.29,2.47,32.21-13.23,59.69-35.08,61.36Z";

// Eyes, face ring, and hat brim — the purple parts of the color mark.
const TOPHE_DETAILS = [
	"M261.57,285.19c-9.67-.74-16.62-12.9-15.52-27.15.56-7.27,3.11-13.68,6.76-18.11-3.05-1.42-6.27-2.37-9.65-2.63-21.85-1.68-41.56,23.08-44.04,55.29-2.47,32.21,13.23,59.69,35.08,61.36,21.85,1.68,41.57-23.08,44.04-55.29.63-8.23.06-16.14-1.48-23.4-3.68,6.42-9.25,10.38-15.18,9.93Z",
	"M368.68,237.3c-3.39.26-6.61,1.21-9.65,2.63,3.64,4.44,6.2,10.84,6.75,18.11,1.09,14.25-5.85,26.41-15.52,27.15-5.94.46-11.51-3.51-15.18-9.93-1.54,7.26-2.11,15.17-1.48,23.4,2.47,32.21,22.19,56.97,44.04,55.29,21.85-1.68,37.56-29.15,35.08-61.36-2.47-32.21-22.19-56.97-44.04-55.29Z",
	"M466.08,159.81c12.61,26.01,19.77,55.45,19.77,86.64,0,105.04-80.72,190.49-179.94,190.49s-179.94-85.45-179.94-190.49c0-31.19,7.16-60.62,19.77-86.64H61.46c-8.89,27.19-13.79,56.31-13.79,86.64,0,148.45,115.62,268.8,258.24,268.8s258.24-120.34,258.24-268.8c0-30.33-4.9-59.44-13.79-86.64h-84.29Z",
	"M609.98,101.8l-26.33-90.21c-1.92-6.58-7.67-10.88-13.98-11.45l.6-.14H43.78l.05.06c-6.96-.13-13.57,4.37-15.66,11.53L1.84,101.8c-8.46,29,13.28,58,43.49,58h16.12c10.72-32.77,27.36-62.66,48.56-88.36,1.85-2.16,6.33-7.32,12.05-13.41,12.22-13.02,33.29-11.8,43.71,2.7,6.46,8.99,14.8,18.99,25.02,28.14l.06-.06c30.88,28.33,71.07,45.56,115.06,45.56,47.4,0,90.44-19.89,122.12-52.22,2.43-2.47,4.75-4.96,6.92-7.44,1.04-1.19,2.01-2.43,3.02-3.64,1.24-1.49,2.47-2.98,3.62-4.45,1.19-1.53,2.35-3.08,3.5-4.65.3-.41.64-.84.94-1.24,10.42-14.5,31.49-15.72,43.71-2.7,7.4,7.88,12.69,14.16,12.94,14.45,20.79,25.46,37.11,55,47.68,87.32h16.12c30.21,0,51.96-29.01,43.49-58.01Z",
];

/** The Tophe mascot mark in brand colors: white face, purple details. */
export function TopheMark({ className, ...props }: SVGProps<SVGSVGElement>) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox={TOPHE_VIEWBOX}
			className={cn("shrink-0", className)}
			aria-hidden={props["aria-label"] ? undefined : true}
			{...props}
		>
			<path fill="#fff" d={TOPHE_FACE} />
			{TOPHE_DETAILS.map((d) => (
				<path key={d.slice(0, 16)} fill="#6f2fff" d={d} />
			))}
		</svg>
	);
}

/** Single-color variant of the mark (no face fill), for icon rows that use currentColor. */
export function TopheMarkMono({ className, ...props }: SVGProps<SVGSVGElement>) {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox={TOPHE_VIEWBOX}
			className={cn("shrink-0", className)}
			aria-hidden={props["aria-label"] ? undefined : true}
			{...props}
		>
			{TOPHE_DETAILS.map((d) => (
				<path key={d.slice(0, 16)} fill="currentColor" d={d} />
			))}
		</svg>
	);
}

export function Logo({
	withLabel = true,
	brand = true,
	className,
}: {
	className?: string;
	withLabel?: boolean;
	brand?: boolean;
}) {
	if (brand) {
		return (
			<span
				className={cn(
					"group flex items-center gap-2.5 leading-none text-brand-ink",
					className,
				)}
			>
				<TopheMark className="size-6 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5" />
				{withLabel && <span className="brand-wordmark">tophe</span>}
			</span>
		);
	}

	// Neutral fallback for installs that turned the brand logo off in settings.
	return (
		<span
			className={cn(
				"group flex items-center gap-3 font-extrabold leading-none tracking-tight text-brand-ink",
				className,
			)}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2.75"
				strokeLinecap="round"
				strokeLinejoin="round"
				className="size-5 shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5"
				aria-hidden="true"
			>
				<path d="m7 15 5-5 5 5" />
				<path d="m7 9 5-5 5 5" />
			</svg>
			{withLabel && <span className="tracking-wide text-base">TOPHE</span>}
		</span>
	);
}
