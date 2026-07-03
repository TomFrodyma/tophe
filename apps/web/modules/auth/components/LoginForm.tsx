"use client";

import { useAuthErrorMessages } from "@auth/hooks/errors-messages";
import { sessionQueryKey } from "@auth/lib/api";
import { config } from "@config";
import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@repo/auth/client";
import { Alert, AlertTitle } from "@repo/ui/components/alert";
import { Button } from "@repo/ui/components/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@repo/ui/components/form";
import { Input } from "@repo/ui/components/input";
import { useRouter } from "@shared/hooks/router";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangleIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { withQuery } from "ufo";
import { z } from "zod";

import { useSession } from "../hooks/use-session";

const formSchema = z.object({
	email: z.email(),
	password: z.string().min(1),
});

export function LoginForm() {
	const t = useTranslations();
	const { getAuthErrorMessage } = useAuthErrorMessages();
	const router = useRouter();
	const queryClient = useQueryClient();
	const searchParams = useSearchParams();
	const { user, loaded: sessionLoaded } = useSession();

	const [showPassword, setShowPassword] = useState(false);
	const email = searchParams.get("email");
	const redirectTo = searchParams.get("redirectTo");

	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: email ?? "",
			password: "",
		},
	});

	const redirectPath = redirectTo ?? config.redirectAfterSignIn;

	useEffect(() => {
		if (sessionLoaded && user) {
			router.replace(redirectPath);
		}
	}, [user, sessionLoaded]); // oxlint-disable-line eslint-plugin-react-hooks/exhaustive-deps

	const onSubmit = form.handleSubmit(async (values) => {
		try {
			const { data, error } = await authClient.signIn.email({
				email: values.email,
				password: values.password,
			});

			if (error) {
				throw error;
			}

			if ((data as any).twoFactorRedirect) {
				router.replace(withQuery("/verify", Object.fromEntries(searchParams.entries())));
				return;
			}

			await queryClient.invalidateQueries({
				queryKey: sessionQueryKey,
			});

			router.replace(redirectPath);
		} catch (e) {
			form.setError("root", {
				message: getAuthErrorMessage(
					e && typeof e === "object" && "code" in e ? (e.code as string) : undefined,
				),
			});
		}
	});

	return (
		<div>
			<h1 className="font-bold text-xl md:text-2xl">{t("auth.login.title")}</h1>
			<p className="mt-1 mb-6 text-foreground/60">{t("auth.login.subtitle")}</p>

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
								<div className="gap-4 flex justify-between">
									<FormLabel>{t("auth.signup.password")}</FormLabel>

									<Link
										href="/forgot-password"
										className="text-xs text-foreground/60"
									>
										{t("auth.login.forgotPassword")}
									</Link>
								</div>
								<FormControl>
									<div className="relative">
										<Input
											type={showPassword ? "text" : "password"}
											className="pr-10"
											{...field}
											autoComplete="current-password"
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="inset-y-0 right-0 pr-4 text-xl absolute flex items-center text-primary"
										>
											{showPassword ? (
												<EyeOffIcon className="size-4" />
											) : (
												<EyeIcon className="size-4" />
											)}
										</button>
									</div>
								</FormControl>
							</FormItem>
						)}
					/>

					<Button
						className="w-full"
						type="submit"
						variant="primary"
						loading={form.formState.isSubmitting}
					>
						{t("auth.login.submit")}
					</Button>
				</form>
			</Form>
		</div>
	);
}
