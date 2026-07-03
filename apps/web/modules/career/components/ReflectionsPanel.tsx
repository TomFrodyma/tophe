"use client";

import { Button } from "@repo/ui/components/button";
import { Card } from "@repo/ui/components/card";
import { Textarea } from "@repo/ui/components/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export function ReflectionsPanel() {
	const t = useTranslations("career");
	const queryClient = useQueryClient();
	const { data: profile } = useQuery(orpc.career.profile.get.queryOptions());
	const [value, setValue] = useState("");
	const [dirty, setDirty] = useState(false);

	useEffect(() => {
		if (profile && !dirty) {
			setValue(profile.reflections);
		}
	}, [profile, dirty]);

	const saveMutation = useMutation(orpc.career.profile.saveReflections.mutationOptions());

	const onSave = async () => {
		try {
			await saveMutation.mutateAsync({ reflections: value });
			setDirty(false);
			await queryClient.invalidateQueries({
				queryKey: orpc.career.profile.get.queryKey(),
			});
			toastSuccess(t("reflections.saved"));
		} catch {
			toastError(t("form.saveError"));
		}
	};

	return (
		<Card className="gap-3 p-5 flex flex-col">
			<div className="gap-1 flex flex-col">
				<h2 className="text-lg font-bold tracking-[-0.01em]">{t("reflections.title")}</h2>
				<p className="text-sm text-muted-foreground">{t("reflections.subtitle")}</p>
			</div>
			<Textarea
				rows={6}
				value={value}
				onChange={(e) => {
					setValue(e.target.value);
					setDirty(true);
				}}
				placeholder={t("reflections.placeholder")}
			/>
			<div className="flex justify-end">
				<Button
					onClick={onSave}
					loading={saveMutation.isPending}
					disabled={!dirty || saveMutation.isPending}
				>
					{t("reflections.save")}
				</Button>
			</div>
		</Card>
	);
}
