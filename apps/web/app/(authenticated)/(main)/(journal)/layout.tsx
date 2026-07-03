import { AppWrapper } from "@shared/components/AppWrapper";
import type { PropsWithChildren } from "react";

export default function JournalLayout({ children }: PropsWithChildren) {
	return <AppWrapper>{children}</AppWrapper>;
}
