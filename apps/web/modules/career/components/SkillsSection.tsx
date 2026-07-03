"use client";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@repo/ui/components/select";
import { toastError } from "@repo/ui/components/toast";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlusIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

const DEFAULT_CATEGORIES = [
	"AI & Product",
	"Build & Deploy",
	"Automation & Low-Code",
	"Applications",
	"Languages",
];

export function SkillsSection() {
	const t = useTranslations("career");
	const queryClient = useQueryClient();
	const { data: skills } = useQuery(orpc.career.skills.list.queryOptions());

	const [adding, setAdding] = useState(false);
	const [name, setName] = useState("");
	const [category, setCategory] = useState(DEFAULT_CATEGORIES[0]!);

	const createMutation = useMutation(orpc.career.skills.create.mutationOptions());
	const deleteMutation = useMutation(orpc.career.skills.delete.mutationOptions());

	const invalidate = () =>
		queryClient.invalidateQueries({
			queryKey: orpc.career.skills.list.queryKey(),
		});

	const grouped = new Map<string, NonNullable<typeof skills>>();
	for (const s of skills ?? []) {
		const list = grouped.get(s.category) ?? [];
		list.push(s);
		grouped.set(s.category, list);
	}
	// Offer existing categories first, then the defaults, de-duplicated.
	const categoryOptions = [...new Set([...grouped.keys(), ...DEFAULT_CATEGORIES])];

	const onAdd = async () => {
		const trimmed = name.trim();
		if (!trimmed) {
			return;
		}
		try {
			await createMutation.mutateAsync({ name: trimmed, category });
			setName("");
			await invalidate();
		} catch {
			toastError(t("form.saveError"));
		}
	};

	const onRemove = async (id: string) => {
		try {
			await deleteMutation.mutateAsync({ id });
			await invalidate();
		} catch {
			toastError(t("form.saveError"));
		}
	};

	return (
		<section className="gap-4 flex flex-col">
			<div className="gap-3 flex items-center justify-between">
				<h2 className="text-lg font-bold tracking-[-0.01em]">{t("skills.title")}</h2>
				<Button variant="ghost" size="sm" onClick={() => setAdding((v) => !v)}>
					<PlusIcon className="size-4" />
					{t("skills.add")}
				</Button>
			</div>

			{adding && (
				<div className="gap-2 p-3 sm:flex-row sm:items-end flex flex-col rounded-lg border border-border/60">
					<div className="gap-1.5 flex flex-1 flex-col">
						<label className="text-xs text-muted-foreground">{t("skills.name")}</label>
						<Input
							value={name}
							onChange={(e) => setName(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									void onAdd();
								}
							}}
							placeholder={t("skills.namePlaceholder")}
						/>
					</div>
					<div className="gap-1.5 sm:w-56 flex flex-col">
						<label className="text-xs text-muted-foreground">
							{t("skills.category")}
						</label>
						<Select value={category} onValueChange={setCategory}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{categoryOptions.map((c) => (
									<SelectItem key={c} value={c}>
										{c}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<Button onClick={onAdd} loading={createMutation.isPending}>
						{t("skills.save")}
					</Button>
				</div>
			)}

			{grouped.size === 0 ? (
				<p className="text-sm text-muted-foreground">{t("skills.empty")}</p>
			) : (
				<div className="gap-4 flex flex-col">
					{[...grouped.entries()].map(([cat, list]) => (
						<div key={cat} className="gap-2 flex flex-col">
							<h3 className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
								{cat}
							</h3>
							<ul className="gap-2 flex flex-wrap">
								{list.map((skill) => (
									<li key={skill.id}>
										<span className="gap-1.5 py-1 pr-1 pl-2.5 text-sm inline-flex items-center rounded-pill bg-brand-ink/8 text-brand-ink">
											{skill.name}
											<button
												type="button"
												onClick={() => onRemove(skill.id)}
												aria-label={t("skills.remove", {
													name: skill.name,
												})}
												className="p-0.5 rounded-full hover:bg-foreground/10"
											>
												<XIcon className="size-3" />
											</button>
										</span>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>
			)}
		</section>
	);
}
