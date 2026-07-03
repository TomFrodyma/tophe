import { getSession } from "@auth/lib/server";
import { BriefingPaper } from "@shared/components/BriefingPaper";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export async function generateMetadata() {
	const t = await getTranslations("briefing");
	return {
		title: t("title"),
	};
}

export default async function BriefingPage() {
	const session = await getSession();
	if (!session) {
		redirect("/login");
	}

	return (
		<div className="pb-12">
			<BriefingPaper />
		</div>
	);
}
