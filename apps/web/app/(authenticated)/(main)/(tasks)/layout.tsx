import { AppWrapper } from "@shared/components/AppWrapper";
import type { PropsWithChildren } from "react";

export default function TasksLayout({ children }: PropsWithChildren) {
	return <AppWrapper>{children}</AppWrapper>;
}
