"use client";

import Cookies from "js-cookie";
import { createContext, type ReactNode, useContext, useState } from "react";

export const SIDEBAR_COLLAPSED_COOKIE = "sidebar-collapsed";

interface SidebarContextValue {
	isCollapsed: boolean;
	setIsCollapsed: (collapsed: boolean) => void;
	toggleCollapsed: () => void;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

export function SidebarProvider({
	children,
	initialCollapsed = false,
}: {
	children: ReactNode;
	// Passed from the server layout (cookie read server-side) so the first paint
	// already has the right width. Reading the cookie in a mount effect caused a
	// visible expanded-then-collapsed flash on every load.
	initialCollapsed?: boolean;
}) {
	const [isCollapsed, setIsCollapsed] = useState(initialCollapsed);

	const handleSetIsCollapsed = (collapsed: boolean) => {
		setIsCollapsed(collapsed);
		Cookies.set(SIDEBAR_COLLAPSED_COOKIE, collapsed ? "true" : "false", {
			expires: 365, // Persist for 1 year
		});
	};

	const handleToggleCollapsed = () => {
		const newValue = !isCollapsed;
		setIsCollapsed(newValue);
		Cookies.set(SIDEBAR_COLLAPSED_COOKIE, newValue ? "true" : "false", {
			expires: 365, // Persist for 1 year
		});
	};

	return (
		<SidebarContext.Provider
			value={{
				isCollapsed,
				setIsCollapsed: handleSetIsCollapsed,
				toggleCollapsed: handleToggleCollapsed,
			}}
		>
			{children}
		</SidebarContext.Provider>
	);
}

export function useSidebar() {
	const context = useContext(SidebarContext);
	if (context === undefined) {
		throw new Error("useSidebar must be used within a SidebarProvider");
	}
	return context;
}
