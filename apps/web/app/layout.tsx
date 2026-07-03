import { config } from "@config";
import { getInstanceBrandLogo } from "@repo/database";
import { cn, Toaster } from "@repo/ui";
import { ApiClientProvider } from "@shared/components/ApiClientProvider";
import { ClientProviders } from "@shared/components/ClientProviders";
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { ThemeProvider } from "next-themes";
import {
	Geist,
	JetBrains_Mono,
	Montserrat,
	Newsreader,
	Source_Serif_4,
} from "next/font/google";

import "./globals.css";
import "cropperjs/dist/cropper.css";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { PropsWithChildren } from "react";

const sansFont = Geist({
	weight: ["400", "500", "600", "700", "800"],
	subsets: ["latin"],
	variable: "--font-sans-family",
});

const serifFont = Source_Serif_4({
	weight: ["400", "500", "600"],
	subsets: ["latin"],
	style: ["normal", "italic"],
	variable: "--font-serif-family",
});

const newsFont = Newsreader({
	weight: ["400", "500"],
	subsets: ["latin"],
	style: ["italic"],
	variable: "--font-news-family",
});

const monoFont = JetBrains_Mono({
	weight: ["400", "500"],
	subsets: ["latin"],
	variable: "--font-mono-family",
});

// The brand wordmark face (the logo's "tophe" lettering).
const brandFont = Montserrat({
	weight: ["700", "800"],
	subsets: ["latin"],
	variable: "--font-brand-family",
});

export async function generateMetadata(): Promise<Metadata> {
	// Falls back to brand icons if the DB is unreachable (e.g. at build time).
	const showBrandLogo = await getInstanceBrandLogo().catch(() => true);

	return {
		title: {
			absolute: config.appName,
			default: config.appName,
			template: `%s | ${config.appName}`,
		},
		applicationName: config.appName,
		appleWebApp: {
			capable: true,
			title: config.appName,
			statusBarStyle: "default",
		},
		formatDetection: {
			telephone: false,
		},
		icons: showBrandLogo
			? {
					icon: "/images/tophe-icon.svg",
					apple: "/images/tophe-apple-icon.png",
				}
			: {
					icon: "/images/generic-icon.svg",
					apple: "/images/generic-apple-icon.png",
				},
	};
}

export const viewport: Viewport = {
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#FAFAFA" },
		{ media: "(prefers-color-scheme: dark)", color: "#0F0F10" },
	],
	width: "device-width",
	initialScale: 1,
};

export default async function RootLayout({ children }: PropsWithChildren) {
	const locale = await getLocale();
	const messages = await getMessages();

	return (
		<html
			lang={locale}
			suppressHydrationWarning
			className={cn(
				sansFont.variable,
				serifFont.variable,
				newsFont.variable,
				monoFont.variable,
				brandFont.variable,
			)}
		>
			<body className={cn("min-h-screen bg-background text-foreground antialiased")}>
				<NuqsAdapter>
					<NextIntlClientProvider messages={messages}>
						<ThemeProvider
							attribute="class"
							disableTransitionOnChange
							enableSystem
							defaultTheme={config.defaultTheme}
							themes={Array.from(config.enabledThemes)}
						>
							<ApiClientProvider>
								<ClientProviders>
									{children}

									<Toaster position="top-right" />
								</ClientProviders>
							</ApiClientProvider>
						</ThemeProvider>
					</NextIntlClientProvider>
				</NuqsAdapter>
			</body>
		</html>
	);
}
