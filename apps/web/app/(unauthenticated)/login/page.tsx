import { BootstrapAccountForm } from "@auth/components/BootstrapAccountForm";
import { LoginForm } from "@auth/components/LoginForm";
import { countUsers, getInstanceBrandLogo } from "@repo/database";
import { Logo } from "@repo/ui";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata() {
	const t = await getTranslations("auth.login");

	return {
		title: t("title"),
	};
}

export default async function LoginPage() {
	// Fresh install with no users yet: offer first-run account creation
	// instead of a login nobody can pass. One user later, this is gone.
	const isFreshInstall = (await countUsers()) === 0;
	const showBrandLogo = isFreshInstall || (await getInstanceBrandLogo());

	return (
		<>
			{showBrandLogo && <Logo className="mb-6" />}
			{isFreshInstall ? <BootstrapAccountForm /> : <LoginForm />}
		</>
	);
}
