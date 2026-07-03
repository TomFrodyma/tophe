import { getSession } from "@auth/lib/server";
import { RoleForm } from "@career/components/RoleForm";
import { Button } from "@repo/ui/components/button";
import { PageHeader } from "@shared/components/PageHeader";
import { ArrowLeftIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export async function generateMetadata() {
	const t = await getTranslations("career");
	return { title: t("form.createTitle") };
}

export default async function NewRolePage() {
	const session = await getSession();
	if (!session) {
		redirect("/login");
	}
	const t = await getTranslations("career");
	return (
		<>
			<div className="mb-2">
				<Button asChild variant="ghost" size="sm">
					<Link href="/career">
						<ArrowLeftIcon className="size-4" />
						{t("title")}
					</Link>
				</Button>
			</div>
			<PageHeader title={t("form.createTitle")} className="mb-6" />
			<RoleForm mode="create" />
		</>
	);
}
