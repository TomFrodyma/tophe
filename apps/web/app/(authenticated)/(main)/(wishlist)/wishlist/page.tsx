import { getSession } from "@auth/lib/server";
import { PageHeader } from "@shared/components/PageHeader";
import { WishlistView } from "@wishlist/components/WishlistView";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export async function generateMetadata() {
	const t = await getTranslations("wishlist");
	return {
		title: t("title"),
	};
}

export default async function WishlistPage() {
	const session = await getSession();
	if (!session) {
		redirect("/login");
	}

	const t = await getTranslations("wishlist");

	return (
		<>
			<PageHeader title={t("title")} subtitle={t("subtitle")} />
			<WishlistView />
		</>
	);
}
