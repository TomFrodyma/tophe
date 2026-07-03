import { getSession } from "@auth/lib/server";
import { RoleForm } from "@career/components/RoleForm";
import { getCareerRoleForUser } from "@repo/database";
import { Button } from "@repo/ui/components/button";
import { PageHeader } from "@shared/components/PageHeader";
import { ArrowLeftIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

interface PageProps {
	params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
	const session = await getSession();
	if (!session) {
		return {};
	}
	const { id } = await params;
	const role = await getCareerRoleForUser(id, session.user.id);
	return { title: role ? `${role.title} - ${role.company}` : undefined };
}

export default async function EditRolePage({ params }: PageProps) {
	const session = await getSession();
	if (!session) {
		redirect("/login");
	}
	const { id } = await params;
	const role = await getCareerRoleForUser(id, session.user.id);
	if (!role) {
		notFound();
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
			<PageHeader title={t("form.editTitle")} className="mb-6" />
			<RoleForm
				mode="edit"
				role={{
					id: role.id,
					company: role.company,
					title: role.title,
					kind: role.kind,
					location: role.location,
					startDate: role.startDate.toISOString(),
					endDate: role.endDate ? role.endDate.toISOString() : null,
					summary: role.summary,
					highlights: role.highlights.map((h) => ({
						text: h.text,
						metric: h.metric,
					})),
					salaries: role.salaries.map((s) => ({
						effectiveDate: s.effectiveDate.toISOString(),
						amount: s.amount.toString(),
						label: s.label,
					})),
				}}
			/>
		</>
	);
}
