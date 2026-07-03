"use client";

import {
	CALENDAR_COLORS,
	COLOR_CLASSES,
	isCalendarColor,
} from "@calendar/lib/colors";
import { CALENDAR_ICON_NAMES, CALENDAR_ICONS, isCalendarIcon } from "@calendar/lib/icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@repo/ui";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Textarea } from "@repo/ui/components/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GripVerticalIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { GOAL_CADENCES, GOAL_HORIZONS, GOAL_TYPES } from "../lib/constants";

const NONE_ICON = "__none__";

const milestoneSchema = z.object({
	id: z.string().optional(),
	title: z.string().min(1).max(200),
	done: z.boolean().optional(),
});

const formSchema = z
	.object({
		title: z.string().min(1).max(200),
		description: z.string().max(10_000).optional(),
		horizon: z.enum(GOAL_HORIZONS),
		type: z.enum(GOAL_TYPES),
		targetValue: z.string().optional(),
		unit: z.string().max(60).optional(),
		startDate: z.string().optional(),
		dueDate: z.string().optional(),
		color: z.string(),
		icon: z.string(),
		cadence: z.enum(GOAL_CADENCES),
		milestones: z.array(milestoneSchema).max(50).optional(),
	})
	.refine(
		(v) =>
			!v.startDate ||
			!v.dueDate ||
			new Date(v.dueDate).getTime() >= new Date(v.startDate).getTime(),
		{ message: "Due date must be after start date", path: ["dueDate"] },
	)
	.refine(
		(v) =>
			v.type !== "NUMERIC" ||
			!v.targetValue ||
			Number(v.targetValue) > 0,
		{ message: "Target must be greater than zero", path: ["targetValue"] },
	);

type FormValues = z.infer<typeof formSchema>;

interface GoalFormProps {
	mode: "create" | "edit";
	goal?: {
		id: string;
		title: string;
		description: string | null;
		type: string;
		horizon: string;
		targetValue: number | null;
		unit: string | null;
		startDate: Date | string | null;
		dueDate: Date | string | null;
		color: string;
		icon: string | null;
		cadence: string;
		milestones: { id: string; title: string; done: boolean }[];
	};
}

function toDateInput(value: Date | string | null): string {
	if (!value) return "";
	const d = typeof value === "string" ? new Date(value) : value;
	if (Number.isNaN(d.getTime())) return "";
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

export function GoalForm({ mode, goal }: GoalFormProps) {
	const t = useTranslations("goals");
	const router = useRouter();
	const queryClient = useQueryClient();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: goal?.title ?? "",
			description: goal?.description ?? "",
			horizon:
				(goal?.horizon as (typeof GOAL_HORIZONS)[number]) ?? "LONG_TERM",
			type: (goal?.type as (typeof GOAL_TYPES)[number]) ?? "NUMERIC",
			targetValue:
				goal?.targetValue != null ? String(goal.targetValue) : "",
			unit: goal?.unit ?? "",
			startDate: toDateInput(goal?.startDate ?? null),
			dueDate: toDateInput(goal?.dueDate ?? null),
			color: goal?.color && isCalendarColor(goal.color) ? goal.color : "sky",
			icon: goal?.icon && isCalendarIcon(goal.icon) ? goal.icon : NONE_ICON,
			cadence: (goal?.cadence as (typeof GOAL_CADENCES)[number]) ?? "NONE",
			milestones:
				goal?.milestones.map((m) => ({
					id: m.id,
					title: m.title,
					done: m.done,
				})) ?? [],
		},
	});

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "milestones",
	});

	const goalType = form.watch("type");
	const horizonValue = form.watch("horizon");
	const colorValue = form.watch("color");
	const iconValue = form.watch("icon");

	function handleHorizonChange(next: (typeof GOAL_HORIZONS)[number]) {
		form.setValue("horizon", next, { shouldDirty: true });
		if (mode !== "create") return;
		if (next === "HABIT" && form.getValues("cadence") === "NONE") {
			form.setValue("cadence", "DAILY", { shouldDirty: true });
		}
		if (next === "PROJECT" && form.getValues("type") === "NUMERIC") {
			const target = form.getValues("targetValue");
			if (!target) {
				form.setValue("type", "MILESTONE", { shouldDirty: true });
			}
		}
	}

	const createMutation = useMutation(orpc.goals.create.mutationOptions());
	const updateMutation = useMutation(orpc.goals.update.mutationOptions());

	const onSubmit = form.handleSubmit(async (values) => {
		const parsedTarget =
			values.type === "NUMERIC" && values.targetValue
				? Number(values.targetValue)
				: null;
		const milestones =
			values.type === "MILESTONE" && values.milestones
				? values.milestones
						.filter((m) => m.title.trim().length > 0)
						.map((m, idx) => ({
							id: m.id,
							title: m.title,
							order: idx,
							done: m.done ?? false,
						}))
				: undefined;

		const payload = {
			title: values.title,
			description: values.description || null,
			type: values.type,
			horizon: values.horizon,
			targetValue: parsedTarget,
			unit: values.unit || null,
			startDate: values.startDate ? new Date(values.startDate) : null,
			dueDate: values.dueDate ? new Date(values.dueDate) : null,
			color: values.color as (typeof CALENDAR_COLORS)[number],
			icon: values.icon === NONE_ICON ? null : values.icon,
			cadence: values.cadence,
			milestones,
		};

		try {
			if (mode === "create") {
				const created = await createMutation.mutateAsync(payload);
				toastSuccess(t("notifications.created"));
				await queryClient.invalidateQueries({
					queryKey: orpc.goals.list.queryKey({ input: {} }),
				});
				router.push(`/goals/${created.id}`);
			} else if (goal) {
				await updateMutation.mutateAsync({
					id: goal.id,
					...payload,
				});
				toastSuccess(t("notifications.updated"));
				await queryClient.invalidateQueries({
					queryKey: orpc.goals.list.queryKey({ input: {} }),
				});
				await queryClient.invalidateQueries({
					queryKey: orpc.goals.get.queryKey({ input: { id: goal.id } }),
				});
				router.push(`/goals/${goal.id}`);
			}
		} catch (_error) {
			toastError(t("notifications.saveError"));
		}
	});

	const isSubmitting = createMutation.isPending || updateMutation.isPending;

	return (
		<form onSubmit={onSubmit} className="gap-6 flex flex-col">
			<div className="gap-2 flex flex-col">
				<label className="font-medium text-sm">{t("form.horizon")}</label>
				<div className="gap-2 grid grid-cols-1 sm:grid-cols-3">
					{GOAL_HORIZONS.map((h) => (
						<button
							key={h}
							type="button"
							onClick={() => handleHorizonChange(h)}
							className={cn(
								"rounded-lg border p-3 text-left transition-colors",
								horizonValue === h
									? "bg-accent border-foreground"
									: "border-border hover:bg-muted",
							)}
						>
							<div className="font-medium text-sm">
								{t(`horizons.${h}.label`)}
							</div>
							<p className="mt-0.5 text-xs text-muted-foreground">
								{t(`horizons.${h}.description`)}
							</p>
						</button>
					))}
				</div>
			</div>

			<div className="gap-2 flex flex-col">
				<label htmlFor="goal-title" className="font-medium text-sm">
					{t("form.title")}
				</label>
				<Input
					id="goal-title"
					placeholder={t("form.titlePlaceholder")}
					{...form.register("title")}
				/>
			</div>

			<div className="gap-2 flex flex-col">
				<label htmlFor="goal-description" className="font-medium text-sm">
					{t("form.description")}
				</label>
				<Textarea
					id="goal-description"
					rows={3}
					placeholder={t("form.descriptionPlaceholder")}
					{...form.register("description")}
				/>
			</div>

			<div className="gap-2 flex flex-col">
				<label className="font-medium text-sm">{t("form.type")}</label>
				<Select
					value={goalType}
					onValueChange={(v) =>
						form.setValue("type", v as (typeof GOAL_TYPES)[number], {
							shouldDirty: true,
						})
					}
					disabled={mode === "edit"}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{GOAL_TYPES.map((type) => (
							<SelectItem key={type} value={type}>
								{t(`types.${type}.label`)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<p className="text-muted-foreground text-xs">
					{t(`types.${goalType}.description` as const)}
				</p>
			</div>

			{goalType === "NUMERIC" && (
				<div className="gap-4 grid grid-cols-1 sm:grid-cols-2">
					<div className="gap-2 flex flex-col">
						<label htmlFor="goal-target" className="font-medium text-sm">
							{t("form.target")}
						</label>
						<Input
							id="goal-target"
							type="number"
							step="any"
							placeholder="30"
							{...form.register("targetValue")}
						/>
						{form.formState.errors.targetValue && (
							<p className="text-destructive text-sm">
								{form.formState.errors.targetValue.message}
							</p>
						)}
					</div>
					<div className="gap-2 flex flex-col">
						<label htmlFor="goal-unit" className="font-medium text-sm">
							{t("form.unit")}
						</label>
						<Input
							id="goal-unit"
							placeholder={t("form.unitPlaceholder")}
							{...form.register("unit")}
						/>
					</div>
				</div>
			)}

			{goalType === "MILESTONE" && (
				<div className="gap-2 flex flex-col">
					<label className="font-medium text-sm">{t("form.milestones")}</label>
					<div className="gap-2 flex flex-col">
						{fields.map((field, index) => (
							<div key={field.id} className="gap-2 flex items-center">
								<GripVerticalIcon className="size-4 text-muted-foreground" />
								<Input
									placeholder={t("form.milestonePlaceholder")}
									{...form.register(`milestones.${index}.title`)}
								/>
								<Button
									type="button"
									variant="ghost"
									size="icon"
									onClick={() => remove(index)}
								>
									<Trash2Icon className="size-4" />
								</Button>
							</div>
						))}
					</div>
					<Button
						type="button"
						variant="secondary"
						size="sm"
						onClick={() => append({ title: "", done: false })}
					>
						<PlusIcon className="size-4" />
						{t("form.addMilestone")}
					</Button>
				</div>
			)}

			<div className="gap-4 grid grid-cols-1 sm:grid-cols-2">
				<div className="gap-2 flex flex-col">
					<label htmlFor="goal-start" className="font-medium text-sm">
						{t("form.startDate")}
					</label>
					<Input id="goal-start" type="date" {...form.register("startDate")} />
				</div>
				<div className="gap-2 flex flex-col">
					<label htmlFor="goal-due" className="font-medium text-sm">
						{t("form.dueDate")}
					</label>
					<Input id="goal-due" type="date" {...form.register("dueDate")} />
					{form.formState.errors.dueDate && (
						<p className="text-destructive text-sm">
							{form.formState.errors.dueDate.message}
						</p>
					)}
				</div>
			</div>

			<div className="gap-2 flex flex-col">
				<label className="font-medium text-sm">{t("form.cadence")}</label>
				<Select
					value={form.watch("cadence")}
					onValueChange={(v) =>
						form.setValue("cadence", v as (typeof GOAL_CADENCES)[number], {
							shouldDirty: true,
						})
					}
				>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{GOAL_CADENCES.map((c) => (
							<SelectItem key={c} value={c}>
								{t(`cadences.${c}`)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<p className="text-muted-foreground text-xs">{t("form.cadenceHint")}</p>
			</div>

			<div className="gap-2 flex flex-col">
				<label className="font-medium text-sm">{t("form.color")}</label>
				<div className="gap-2 flex flex-wrap">
					{CALENDAR_COLORS.map((c) => (
						<button
							key={c}
							type="button"
							onClick={() =>
								form.setValue("color", c, { shouldDirty: true })
							}
							className={cn(
								"size-8 rounded-full border-2 transition-transform",
								COLOR_CLASSES[c].bg,
								colorValue === c
									? "border-foreground scale-110"
									: "border-transparent",
							)}
							aria-label={c}
						/>
					))}
				</div>
			</div>

			<div className="gap-2 flex flex-col">
				<label className="font-medium text-sm">{t("form.icon")}</label>
				<div className="gap-2 grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-12">
					<button
						type="button"
						onClick={() =>
							form.setValue("icon", NONE_ICON, { shouldDirty: true })
						}
						className={cn(
							"size-9 rounded-md border flex items-center justify-center text-xs transition-colors",
							iconValue === NONE_ICON
								? "bg-accent border-foreground"
								: "border-border hover:bg-muted",
						)}
					>
						{t("form.iconNone")}
					</button>
					{CALENDAR_ICON_NAMES.map((name) => {
						const IconComp = CALENDAR_ICONS[name];
						return (
							<button
								key={name}
								type="button"
								onClick={() =>
									form.setValue("icon", name, { shouldDirty: true })
								}
								className={cn(
									"size-9 rounded-md border flex items-center justify-center transition-colors",
									iconValue === name
										? "bg-accent border-foreground"
										: "border-border hover:bg-muted",
								)}
								aria-label={name}
							>
								<IconComp className="size-4" />
							</button>
						);
					})}
				</div>
			</div>

			<div className="gap-2 flex justify-end">
				<Button type="button" variant="ghost" onClick={() => router.back()}>
					{t("form.cancel")}
				</Button>
				<Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
					{mode === "create" ? t("form.create") : t("form.save")}
				</Button>
			</div>
		</form>
	);
}
