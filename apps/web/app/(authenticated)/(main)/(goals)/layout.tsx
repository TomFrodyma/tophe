import { AppWrapper } from "@shared/components/AppWrapper";
import type { PropsWithChildren } from "react";

export default function GoalsLayout({ children }: PropsWithChildren) {
	return <AppWrapper>{children}</AppWrapper>;
}
