"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@repo/ui/components/alert-dialog";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Switch } from "@repo/ui/components/switch";
import { Textarea } from "@repo/ui/components/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

const ROLE_KINDS = ["EMPLOYMENT", "FREELANCE", "EDUCATION", "OTHER"] as const;

const formSchema = z.object({
	company: z.string().min(1).max(160),
	title: z.string().min(1).max(160),
	kind: z.enum(ROLE_KINDS),
	location: z.string().max(160),
	startDate: z.string().min(1),
	endDate: z.string(),
	isCurrent: z.boolean(),
	summary: z.string().max(4_000),
	highlights: z.array(z.object({ text: z.string(), metric: z.string() })),
	salaries: z.array(
		z.object({
			effectiveDate: z.string(),
			amount: z.string(),
			label: z.string(),
		}),
	),
});

type FormValues = z.infer<typeof formSchema>;

export interface RoleFormData {
	id: string;
	company: string;
	title: string;
	kind: (typeof ROLE_KINDS)[number];
	location: string | null;
	startDate: string;
	endDate: string | null;
	summary: string | null;
	highlights: { text: string; metric: string | null }[];
	salaries: { effectiveDate: string; amount: string; label: string | null }[];
}

function toMonth(iso: string) {
	return iso.slice(0, 7);
}

export function RoleForm({ mode, role }: { mode: "create" | "edit"; role?: RoleFormData }) {
	const t = useTranslations("career");
	const router = useRouter();
	const queryClient = useQueryClient();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			company: role?.company ?? "",
			title: role?.title ?? "",
			kind: role?.kind ?? "EMPLOYMENT",
			location: role?.location ?? "",
			startDate: role ? toMonth(role.startDate) : "",
			endDate: role?.endDate ? toMonth(role.endDate) : "",
			isCurrent: role ? role.endDate === null : false,
			summary: role?.summary ?? "",
			highlights:
				role?.highlights.map((h) => ({
					text: h.text,
					metric: h.metric ?? "",
				})) ?? [],
			salaries:
				role?.salaries.map((s) => ({
					effectiveDate: toMonth(s.effectiveDate),
					amount: s.amount,
					label: s.label ?? "",
				})) ?? [],
		},
	});

	const highlights = useFieldArray({ control: form.control, name: "highlights" });
	const salaries = useFieldArray({ control: form.control, name: "salaries" });

	const createMutation = useMutation(orpc.career.roles.create.mutationOptions());
	const updateMutation = useMutation(orpc.career.roles.update.mutationOptions());
	const deleteMutation = useMutation(orpc.career.roles.delete.mutationOptions());

	const isCurrent = form.watch("isCurrent");

	const invalidate = () =>
		queryClient.invalidateQueries({
			queryKey: orpc.career.roles.list.queryKey(),
		});

	const onSubmit = form.handleSubmit(async (values) => {
		const payload = {
			company: values.company,
			title: values.title,
			kind: values.kind,
			location: values.location || null,
			startDate: values.startDate,
			endDate: values.isCurrent ? null : values.endDate || null,
			summary: values.summary || null,
			highlights: values.highlights
				.filter((h) => h.text.trim().length > 0)
				.map((h, i) => ({
					text: h.text,
					metric: h.metric || null,
					sortIndex: i,
				})),
			salaries: values.salaries
				.filter((s) => s.effectiveDate && s.amount)
				.map((s) => ({
					effectiveDate: s.effectiveDate,
					amount: s.amount,
					label: s.label || null,
				})),
		};

		try {
			if (mode === "create") {
				await createMutation.mutateAsync(payload);
				toastSuccess(t("form.created"));
			} else if (role) {
				await updateMutation.mutateAsync({ id: role.id, ...payload });
				toastSuccess(t("form.saved"));
			}
			await invalidate();
			router.push("/career");
		} catch {
			toastError(t("form.saveError"));
		}
	});

	const onDelete = async () => {
		if (!role) {
			return;
		}
		try {
			await deleteMutation.mutateAsync({ id: role.id });
			await invalidate();
			toastSuccess(t("form.deleted"));
			router.push("/career");
		} catch {
			toastError(t("form.saveError"));
		}
	};

	const isSubmitting = createMutation.isPending || updateMutation.isPending;

	return (
		<form onSubmit={onSubmit} className="gap-6 max-w-2xl flex flex-col">
			<div className="gap-4 sm:grid-cols-2 grid">
				<div className="gap-2 flex flex-col">
					<label htmlFor="role-title" className="font-medium text-sm">
						{t("form.title")}
					</label>
					<Input
						id="role-title"
						placeholder={t("form.titlePlaceholder")}
						{...form.register("title")}
					/>
				</div>
				<div className="gap-2 flex flex-col">
					<label htmlFor="role-company" className="font-medium text-sm">
						{t("form.company")}
					</label>
					<Input
						id="role-company"
						placeholder={t("form.companyPlaceholder")}
						{...form.register("company")}
					/>
				</div>
			</div>

			<div className="gap-4 sm:grid-cols-2 grid">
				<div className="gap-2 flex flex-col">
					<label className="font-medium text-sm">{t("form.kind")}</label>
					<Select
						value={form.watch("kind")}
						onValueChange={(v) =>
							form.setValue("kind", v as (typeof ROLE_KINDS)[number], {
								shouldDirty: true,
							})
						}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{ROLE_KINDS.map((k) => (
								<SelectItem key={k} value={k}>
									{t(`kinds.${k}`)}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<div className="gap-2 flex flex-col">
					<label htmlFor="role-location" className="font-medium text-sm">
						{t("form.location")}
					</label>
					<Input
						id="role-location"
						placeholder={t("form.locationPlaceholder")}
						{...form.register("location")}
					/>
				</div>
			</div>

			<div className="gap-4 sm:grid-cols-2 grid">
				<div className="gap-2 flex flex-col">
					<label htmlFor="role-start" className="font-medium text-sm">
						{t("form.startDate")}
					</label>
					<Input id="role-start" type="month" {...form.register("startDate")} />
				</div>
				<div className="gap-2 flex flex-col">
					<label htmlFor="role-end" className="font-medium text-sm">
						{t("form.endDate")}
					</label>
					<Input
						id="role-end"
						type="month"
						disabled={isCurrent}
						{...form.register("endDate")}
					/>
					<label className="gap-2 text-sm flex items-center text-muted-foreground">
						<Switch
							checked={isCurrent}
							onCheckedChange={(v) =>
								form.setValue("isCurrent", v, { shouldDirty: true })
							}
						/>
						{t("form.current")}
					</label>
				</div>
			</div>

			<div className="gap-2 flex flex-col">
				<label htmlFor="role-summary" className="font-medium text-sm">
					{t("form.summary")}
				</label>
				<Textarea
					id="role-summary"
					rows={4}
					placeholder={t("form.summaryPlaceholder")}
					{...form.register("summary")}
				/>
			</div>

			<div className="gap-3 flex flex-col">
				<div className="gap-1 flex flex-col">
					<h3 className="font-medium text-sm">{t("form.highlights")}</h3>
					<p className="text-xs text-muted-foreground">{t("form.highlightsHint")}</p>
				</div>
				<ul className="gap-2 flex flex-col">
					{highlights.fields.map((field, index) => (
						<li
							key={field.id}
							className="gap-3 p-3 sm:flex-row sm:items-start flex flex-col rounded-lg border border-border/60"
						>
							<div className="gap-1.5 flex flex-1 flex-col">
								<label className="text-xs text-muted-foreground">
									{t("form.highlightText")}
								</label>
								<Textarea
									rows={2}
									{...form.register(`highlights.${index}.text` as const)}
								/>
							</div>
							<div className="gap-1.5 sm:w-40 flex flex-col">
								<label className="text-xs text-muted-foreground">
									{t("form.highlightMetric")}
								</label>
								<Input
									placeholder="e.g. +20% / €1M"
									{...form.register(`highlights.${index}.metric` as const)}
								/>
							</div>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								className="sm:mt-6"
								onClick={() => highlights.remove(index)}
								aria-label={t("form.removeHighlight")}
							>
								<Trash2Icon className="size-4" />
							</Button>
						</li>
					))}
				</ul>
				<div>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => highlights.append({ text: "", metric: "" })}
					>
						<PlusIcon className="size-4" />
						{t("form.addHighlight")}
					</Button>
				</div>
			</div>

			<div className="gap-3 flex flex-col">
				<div className="gap-1 flex flex-col">
					<h3 className="font-medium text-sm">{t("form.salaries")}</h3>
					<p className="text-xs text-muted-foreground">{t("form.salariesHint")}</p>
				</div>
				<ul className="gap-2 flex flex-col">
					{salaries.fields.map((field, index) => (
						<li
							key={field.id}
							className="gap-3 p-3 sm:flex-row sm:items-end flex flex-col rounded-lg border border-border/60"
						>
							<div className="gap-1.5 sm:w-40 flex flex-col">
								<label className="text-xs text-muted-foreground">
									{t("form.salaryDate")}
								</label>
								<Input
									type="month"
									{...form.register(`salaries.${index}.effectiveDate` as const)}
								/>
							</div>
							<div className="gap-1.5 sm:w-32 flex flex-col">
								<label className="text-xs text-muted-foreground">
									{t("form.salaryAmount")}
								</label>
								<Input
									type="number"
									step="1"
									inputMode="decimal"
									{...form.register(`salaries.${index}.amount` as const)}
								/>
							</div>
							<div className="gap-1.5 flex flex-1 flex-col">
								<label className="text-xs text-muted-foreground">
									{t("form.salaryLabel")}
								</label>
								<Input
									placeholder={t("form.salaryLabelPlaceholder")}
									{...form.register(`salaries.${index}.label` as const)}
								/>
							</div>
							<Button
								type="button"
								variant="ghost"
								size="icon"
								onClick={() => salaries.remove(index)}
								aria-label={t("form.removeSalary")}
							>
								<Trash2Icon className="size-4" />
							</Button>
						</li>
					))}
				</ul>
				<div>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() =>
							salaries.append({ effectiveDate: "", amount: "", label: "" })
						}
					>
						<PlusIcon className="size-4" />
						{t("form.addSalary")}
					</Button>
				</div>
				<p className="text-xs text-muted-foreground">{t("form.salaryDefaultsHint")}</p>
			</div>

			<div className="gap-2 flex items-center justify-between">
				{mode === "edit" ? (
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button type="button" variant="ghost" className="text-destructive">
								<Trash2Icon className="size-4" />
								{t("form.delete")}
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>{t("form.deleteConfirmTitle")}</AlertDialogTitle>
								<AlertDialogDescription>
									{t("form.deleteConfirmDescription")}
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>{t("form.cancel")}</AlertDialogCancel>
								<AlertDialogAction onClick={onDelete}>
									{t("form.delete")}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				) : (
					<span />
				)}
				<div className="gap-2 flex">
					<Button type="button" variant="ghost" onClick={() => router.back()}>
						{t("form.cancel")}
					</Button>
					<Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
						{mode === "create" ? t("form.submit") : t("form.save")}
					</Button>
				</div>
			</div>
		</form>
	);
}
