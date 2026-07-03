"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@repo/ui";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@repo/ui/components/alert-dialog";
import { Button } from "@repo/ui/components/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@repo/ui/components/dialog";
import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { Spinner } from "@repo/ui/components/spinner";
import { Switch } from "@repo/ui/components/switch";
import { Textarea } from "@repo/ui/components/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LockIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
	CALENDAR_COLORS,
	COLOR_CLASSES,
	type CalendarColor,
	isCalendarColor,
} from "../lib/colors";
import { toLocalInputValue } from "../lib/date-utils";
import { CALENDAR_ICON_NAMES, CALENDAR_ICONS, isCalendarIcon } from "../lib/icons";
import {
	buildRrule,
	detectPreset,
	RECURRENCE_PRESETS,
	type RecurrencePreset,
} from "../lib/recurrence";

const NONE_ICON = "__none__";
const NONE_REMINDER = "NONE";
const CUSTOM_DURATION = "CUSTOM";

const REMINDER_OPTIONS = [
	{ value: NONE_REMINDER, minutes: null as number | null },
	{ value: "5", minutes: 5 },
	{ value: "15", minutes: 15 },
	{ value: "30", minutes: 30 },
	{ value: "60", minutes: 60 },
	{ value: "1440", minutes: 1440 },
] as const;

const DURATION_PRESETS = ["15", "30", "45", "60", "90", "120", "180", "240"] as const;

function detectDurationValue(start: Date, end: Date): string {
	if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return CUSTOM_DURATION;
	const mins = Math.round((end.getTime() - start.getTime()) / 60_000);
	const match = DURATION_PRESETS.find((p) => Number(p) === mins);
	return match ?? CUSTOM_DURATION;
}

const formSchema = z
	.object({
		title: z.string().min(1, "Title is required").max(200),
		description: z.string().max(10_000).optional(),
		location: z.string().max(500).optional(),
		allDay: z.boolean(),
		startAt: z.string().min(1),
		endAt: z.string().min(1),
		color: z.string(),
		icon: z.string(),
		recurrence: z.enum(RECURRENCE_PRESETS),
		customRule: z.string().optional(),
		reminder: z.string(),
		duration: z.string(),
	})
	.refine(
		(v) => {
			const s = new Date(v.startAt);
			const e = new Date(v.endAt);
			if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return false;
			return e.getTime() >= s.getTime();
		},
		{ message: "End must be after start", path: ["endAt"] },
	);

type FormValues = z.infer<typeof formSchema>;

export type EventDialogState =
	| {
			mode: "create";
			initial?: { startAt: Date; endAt: Date };
	  }
	| {
			mode: "edit";
			eventId: string;
			occurrenceStart: Date;
			isRecurring: boolean;
	  };

interface EventDialogProps {
	state: EventDialogState;
	onClose: () => void;
	rangeInput: { from: Date; to: Date };
}

export function EventDialog({ state, onClose, rangeInput }: EventDialogProps) {
	const t = useTranslations("calendar");
	const queryClient = useQueryClient();
	const [deleteOpen, setDeleteOpen] = useState(false);

	const isEdit = state.mode === "edit";
	const eventIdForFetch = state.mode === "edit" ? state.eventId : "";

	const { data: existing, isLoading: loadingExisting } = useQuery({
		...orpc.calendar.get.queryOptions({ input: { id: eventIdForFetch } }),
		enabled: isEdit,
	});

	const defaultStart = state.mode === "create"
		? (state.initial?.startAt ?? new Date())
		: new Date();
	const defaultEnd = state.mode === "create"
		? (state.initial?.endAt ?? new Date(defaultStart.getTime() + 60 * 60 * 1000))
		: new Date();

	const form = useForm<FormValues>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			title: "",
			description: "",
			location: "",
			allDay: false,
			startAt: toLocalInputValue(defaultStart),
			endAt: toLocalInputValue(defaultEnd),
			color: "sky",
			icon: NONE_ICON,
			recurrence: "NONE",
			customRule: "",
			reminder: NONE_REMINDER,
			duration: detectDurationValue(defaultStart, defaultEnd),
		},
	});

	useEffect(() => {
		if (!isEdit || !existing) return;
		const start = new Date(existing.startAt);
		const end = new Date(existing.endAt);
		const preset = detectPreset(existing.rrule);
		form.reset({
			title: existing.title,
			description: existing.description ?? "",
			location: existing.location ?? "",
			allDay: existing.allDay,
			startAt: toLocalInputValue(start, existing.allDay),
			endAt: toLocalInputValue(end, existing.allDay),
			color: isCalendarColor(existing.color) ? existing.color : "sky",
			icon: isCalendarIcon(existing.icon ?? "") ? (existing.icon as string) : NONE_ICON,
			recurrence: preset,
			customRule: preset === "CUSTOM" ? (existing.rrule ?? "") : "",
			reminder:
				existing.reminderMinutes != null ? String(existing.reminderMinutes) : NONE_REMINDER,
			duration: detectDurationValue(start, end),
		});
	}, [existing, form, isEdit]);

	const allDay = form.watch("allDay");
	const recurrence = form.watch("recurrence");
	const color = form.watch("color") as CalendarColor;
	const iconValue = form.watch("icon");
	const reminderValue = form.watch("reminder");
	const durationValue = form.watch("duration");
	const isManaged = isEdit && existing?.source === "OUTLOOK_ICS";

	function handleDurationChange(next: string) {
		form.setValue("duration", next, { shouldDirty: true });
		if (next === CUSTOM_DURATION) return;
		const startStr = form.getValues("startAt");
		const start = new Date(startStr);
		if (Number.isNaN(start.getTime())) return;
		const end = new Date(start.getTime() + Number(next) * 60_000);
		form.setValue("endAt", toLocalInputValue(end), {
			shouldDirty: true,
			shouldValidate: true,
		});
	}

	const createMutation = useMutation(orpc.calendar.create.mutationOptions());
	const updateMutation = useMutation(orpc.calendar.update.mutationOptions());
	const deleteMutation = useMutation(orpc.calendar.delete.mutationOptions());

	async function invalidateLists() {
		void rangeInput;
		await queryClient.invalidateQueries({
			queryKey: orpc.calendar.list.key(),
		});
	}

	const onSubmit = form.handleSubmit(async (values) => {
		const startAt = new Date(values.startAt);
		const endAt = new Date(values.endAt);
		const rrule = buildRrule(values.recurrence, values.customRule);
		const icon = values.icon === NONE_ICON ? null : values.icon;
		const colorValue = isCalendarColor(values.color) ? values.color : "sky";
		const reminderMinutes =
			values.reminder === NONE_REMINDER ? null : Number(values.reminder);

		try {
			if (state.mode === "create") {
				await createMutation.mutateAsync({
					title: values.title,
					description: values.description || null,
					location: values.location || null,
					startAt,
					endAt,
					allDay: values.allDay,
					color: colorValue,
					icon,
					rrule,
					reminderMinutes,
				});
				toastSuccess(t("notifications.created"));
			} else {
				await updateMutation.mutateAsync({
					id: state.eventId,
					title: values.title,
					description: values.description || null,
					location: values.location || null,
					startAt,
					endAt,
					allDay: values.allDay,
					color: colorValue,
					icon,
					rrule,
					reminderMinutes,
				});
				toastSuccess(t("notifications.updated"));
			}
			await invalidateLists();
			onClose();
		} catch {
			toastError(t("notifications.saveError"));
		}
	});

	async function handleDelete(occurrenceOnly: boolean) {
		if (!isEdit) return;
		try {
			await deleteMutation.mutateAsync({
				id: state.eventId,
				occurrenceStart: occurrenceOnly ? state.occurrenceStart : null,
			});
			toastSuccess(
				occurrenceOnly ? t("notifications.occurrenceDeleted") : t("notifications.deleted"),
			);
			await invalidateLists();
			setDeleteOpen(false);
			onClose();
		} catch {
			toastError(t("notifications.deleteError"));
		}
	}

	const isSubmitting = createMutation.isPending || updateMutation.isPending;

	return (
		<>
			<Dialog open onOpenChange={(open) => !open && onClose()}>
				<DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							{state.mode === "create" ? t("dialog.createTitle") : t("dialog.editTitle")}
						</DialogTitle>
					</DialogHeader>

					{isEdit && loadingExisting ? (
						<div className="py-10 flex items-center justify-center">
							<Spinner className="size-5" />
						</div>
					) : (
						<form onSubmit={onSubmit} className="gap-4 flex flex-col">
							{isManaged && (
								<div className="gap-2 rounded-md border border-slate-500/30 bg-slate-500/10 p-3 flex items-start text-sm">
									<LockIcon className="mt-0.5 size-4 shrink-0 text-slate-500" />
									<div>
										<p className="font-medium">{t("managed.bannerTitle")}</p>
										<p className="text-xs text-muted-foreground">
											{t("managed.bannerHint")}
										</p>
									</div>
								</div>
							)}
							<div className="gap-1.5 flex flex-col">
								<label htmlFor="cal-title" className="text-sm font-medium">
									{t("form.title")}
								</label>
								<Input
									id="cal-title"
									placeholder={t("form.titlePlaceholder")}
									readOnly={isManaged}
									{...form.register("title")}
								/>
								{form.formState.errors.title && (
									<p className="text-destructive text-sm">
										{t("form.titleRequired")}
									</p>
								)}
							</div>

							<div className="gap-3 flex items-center justify-between rounded-lg border p-3">
								<div>
									<p className="text-sm font-medium">{t("form.allDay")}</p>
									<p className="text-xs text-muted-foreground">
										{t("form.allDayHint")}
									</p>
								</div>
								<Switch
									checked={allDay}
									disabled={isManaged}
									onCheckedChange={(v) => form.setValue("allDay", v, { shouldDirty: true })}
								/>
							</div>

							<div className="gap-3 sm:grid-cols-2 grid grid-cols-1">
								<div className="gap-1.5 flex flex-col">
									<label htmlFor="cal-start" className="text-sm font-medium">
										{t("form.start")}
									</label>
									<Input
										id="cal-start"
										type={allDay ? "date" : "datetime-local"}
										readOnly={isManaged}
										{...form.register("startAt")}
									/>
								</div>
								<div className="gap-1.5 flex flex-col">
									<label htmlFor="cal-end" className="text-sm font-medium">
										{t("form.end")}
									</label>
									<Input
										id="cal-end"
										type={allDay ? "date" : "datetime-local"}
										readOnly={isManaged}
										{...form.register("endAt")}
									/>
									{form.formState.errors.endAt && (
										<p className="text-destructive text-sm">
											{t("form.endInvalid")}
										</p>
									)}
								</div>
							</div>

							{!allDay && (
								<div className="gap-1.5 flex flex-col">
									<label htmlFor="cal-duration" className="text-sm font-medium">
										{t("form.duration")}
									</label>
									<Select
										value={durationValue}
										disabled={isManaged}
										onValueChange={handleDurationChange}
									>
										<SelectTrigger id="cal-duration">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{DURATION_PRESETS.map((p) => (
												<SelectItem key={p} value={p}>
													{t(`durationOptions.${p}`)}
												</SelectItem>
											))}
											<SelectItem value={CUSTOM_DURATION}>
												{t(`durationOptions.${CUSTOM_DURATION}`)}
											</SelectItem>
										</SelectContent>
									</Select>
								</div>
							)}

							<div className="gap-1.5 flex flex-col">
								<label htmlFor="cal-location" className="text-sm font-medium">
									{t("form.location")}
								</label>
								<Input
									id="cal-location"
									placeholder={t("form.locationPlaceholder")}
									readOnly={isManaged}
									{...form.register("location")}
								/>
							</div>

							<div className="gap-1.5 flex flex-col">
								<label htmlFor="cal-description" className="text-sm font-medium">
									{t("form.description")}
								</label>
								<Textarea
									id="cal-description"
									rows={3}
									placeholder={t("form.descriptionPlaceholder")}
									readOnly={isManaged}
									{...form.register("description")}
								/>
							</div>

							<div className="gap-1.5 flex flex-col">
								<label className="text-sm font-medium">{t("form.color")}</label>
								<div className="gap-2 flex flex-wrap">
									{CALENDAR_COLORS.map((c) => (
										<button
											key={c}
											type="button"
											disabled={isManaged}
											onClick={() => form.setValue("color", c, { shouldDirty: true })}
											aria-label={c}
											aria-pressed={color === c}
											className={cn(
												"size-7 rounded-full border-2 transition-all",
												COLOR_CLASSES[c].bg,
												color === c
													? "border-foreground ring-2 ring-foreground/30 scale-110"
													: "border-transparent hover:scale-105",
											)}
										/>
									))}
								</div>
							</div>

							<div className="gap-1.5 flex flex-col">
								<label htmlFor="cal-icon" className="text-sm font-medium">
									{t("form.icon")}
								</label>
								<Select
									value={iconValue}
									disabled={isManaged}
									onValueChange={(v) => form.setValue("icon", v, { shouldDirty: true })}
								>
									<SelectTrigger id="cal-icon">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={NONE_ICON}>{t("form.iconNone")}</SelectItem>
										{CALENDAR_ICON_NAMES.map((name) => {
											const Icon = CALENDAR_ICONS[name];
											return (
												<SelectItem key={name} value={name}>
													<span className="gap-2 flex items-center">
														<Icon className="size-4" />
														{t(`icons.${name}`)}
													</span>
												</SelectItem>
											);
										})}
									</SelectContent>
								</Select>
							</div>

							<div className="gap-1.5 flex flex-col">
								<label htmlFor="cal-recurrence" className="text-sm font-medium">
									{t("form.recurrence")}
								</label>
								<Select
									value={recurrence}
									disabled={isManaged}
									onValueChange={(v) =>
										form.setValue("recurrence", v as RecurrencePreset, {
											shouldDirty: true,
										})
									}
								>
									<SelectTrigger id="cal-recurrence">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{RECURRENCE_PRESETS.map((preset) => (
											<SelectItem key={preset} value={preset}>
												{t(`recurrence.${preset}`)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								{recurrence === "CUSTOM" && (
									<Input
										placeholder={t("form.customRulePlaceholder")}
										className="mt-1"
										readOnly={isManaged}
										{...form.register("customRule")}
									/>
								)}
							</div>

							<div className="gap-1.5 flex flex-col">
								<label htmlFor="cal-reminder" className="text-sm font-medium">
									{t("form.reminder")}
								</label>
								<Select
									value={reminderValue}
									disabled={isManaged}
									onValueChange={(v) =>
										form.setValue("reminder", v, { shouldDirty: true })
									}
								>
									<SelectTrigger id="cal-reminder">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{REMINDER_OPTIONS.map((option) => (
											<SelectItem key={option.value} value={option.value}>
												{t(`reminderOptions.${option.value}`)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<DialogFooter className="gap-2 sm:justify-between flex flex-row-reverse sm:flex-row pt-2">
								<div className="gap-2 flex">
									<Button type="button" variant="ghost" onClick={onClose}>
										{isManaged ? t("form.close") : t("form.cancel")}
									</Button>
									{!isManaged && (
										<Button
											type="submit"
											loading={isSubmitting}
											disabled={isSubmitting}
										>
											{state.mode === "create" ? t("form.create") : t("form.save")}
										</Button>
									)}
								</div>
								{isEdit && !isManaged && (
									<Button
										type="button"
										variant="ghost"
										className="text-destructive hover:text-destructive"
										onClick={() => setDeleteOpen(true)}
									>
										<Trash2Icon className="size-4" />
										{t("form.delete")}
									</Button>
								)}
							</DialogFooter>
						</form>
					)}
				</DialogContent>
			</Dialog>

			{isEdit && (
				<AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>{t("delete.title")}</AlertDialogTitle>
							<AlertDialogDescription>
								{state.isRecurring ? t("delete.recurringMessage") : t("delete.message")}
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter className="gap-2">
							<AlertDialogCancel>{t("delete.cancel")}</AlertDialogCancel>
							{state.isRecurring && (
								<AlertDialogAction
									onClick={(e) => {
										e.preventDefault();
										void handleDelete(true);
									}}
									className="bg-destructive/20 text-destructive hover:bg-destructive/30"
								>
									{t("delete.thisOccurrence")}
								</AlertDialogAction>
							)}
							<AlertDialogAction
								onClick={(e) => {
									e.preventDefault();
									void handleDelete(false);
								}}
								className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
							>
								{state.isRecurring ? t("delete.wholeSeries") : t("delete.confirm")}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			)}
		</>
	);
}
