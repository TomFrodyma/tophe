"use client";

import { sessionQueryKey } from "@auth/lib/api";
import { config } from "@config";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@repo/auth/client";
import { Alert, AlertTitle } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { useRouter } from "@shared/hooks/router";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangleIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";

const formSchema = z.object({
	name: z.string().min(1),
	email: z.email(),
	password: z.string().min(8),
});

/** First-run only: shown instead of the login form while the instance has no
 *  users. Creates the account, signs straight in, and hands over to onboarding. */
export function BootstrapAccountForm() {
	const t = useTranslations();
	const router = useRouter();
	const queryClient = useQueryClient();

	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: { name: "", email: "", password: "" },
	});

	const bootstrap = useMutation(orpc.users.bootstrap.mutationOptions());

	const onSubmit = form.handleSubmit(async (values) => {
		try {
			await bootstrap.mutateAsync(values);

			const { error } = await authClient.signIn.email({
				email: values.email,
				password: values.password,
			});
			if (error) {
				throw error;
			}

			await queryClient.invalidateQueries({ queryKey: sessionQueryKey });
			router.replace(config.redirectAfterSignIn);
		} catch {
			form.setError("root", { message: t("auth.bootstrap.error") });
		}
	});

	return (
		<div>
			<h1 className="font-bold text-xl md:text-2xl">{t("auth.bootstrap.title")}</h1>
			<p className="mt-1 mb-6 text-foreground/60">{t("auth.bootstrap.subtitle")}</p>

			<Form {...form}>
				<form className="space-y-4" onSubmit={onSubmit}>
					{form.formState.isSubmitted && form.formState.errors.root?.message && (
						<Alert variant="error">
							<AlertTriangleIcon />
							<AlertTitle>{form.formState.errors.root.message}</AlertTitle>
						</Alert>
					)}

					<FormField
						control={form.control}
						name="name"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("auth.bootstrap.name")}</FormLabel>
								<FormControl>
									<Input {...field} autoComplete="name" />
								</FormControl>
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("auth.signup.email")}</FormLabel>
								<FormControl>
									<Input {...field} autoComplete="email" />
								</FormControl>
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="password"
						render={({ field }) => (
							<FormItem>
								<FormLabel>{t("auth.signup.password")}</FormLabel>
								<FormControl>
									<Input type="password" autoComplete="new-password" {...field} />
								</FormControl>
								<p className="text-xs text-foreground/50">
									{t("auth.bootstrap.passwordHint")}
								</p>
							</FormItem>
						)}
					/>

					<Button
						className="w-full"
						type="submit"
						variant="primary"
						loading={form.formState.isSubmitting}
					>
						{t("auth.bootstrap.submit")}
					</Button>
				</form>
			</Form>
		</div>
	);
}
