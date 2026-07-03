"use client";

import { cn } from "@repo/ui";
import type { PropsWithChildren } from "react";

import { useSidebar } from "../lib/sidebar-context";
import { NavBar } from "./NavBar";

function AppContent({ children }: PropsWithChildren) {
	const { isCollapsed } = useSidebar();

	return (
		<div className="min-h-screen md:h-screen md:overflow-hidden bg-paper text-foreground">
			<NavBar />
			<div
				className={cn("flex md:h-screen", {
					"md:ml-[260px]": !isCollapsed,
					"md:ml-[76px]": isCollapsed,
				})}
			>
				<main className="md:overflow-y-auto md:h-full py-6 w-full flex-1">
					<div className="container max-w-[1180px] md:h-full">{children}</div>
				</main>
			</div>
		</div>
	);
}

// The SidebarProvider lives in the authenticated layout (it needs the cookie
// read server-side); this wrapper only consumes it.
export function AppWrapper({ children }: PropsWithChildren) {
	return <AppContent>{children}</AppContent>;
}
