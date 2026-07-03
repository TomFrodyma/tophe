import { config } from "@config";
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: config.appName,
		short_name: config.appName,
		description: "Tophe - personal OS",
		start_url: "/",
		display: "standalone",
		background_color: "#0b0b0f",
		theme_color: "#6366f1",
		orientation: "portrait",
		icons: [
			{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
			{ src: "/apple-icon", sizes: "180x180", type: "image/png", purpose: "maskable" },
		],
	};
}
