"use client";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@repo/ui/components/sheet";
import { Spinner } from "@repo/ui/components/spinner";
import { Textarea } from "@repo/ui/components/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { useConfirmationAlert } from "@shared/components/ConfirmationAlertProvider";
import { orpc } from "@shared/lib/orpc-query-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2Icon } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useAgentName } from "../hooks/use-agent-name";

export function AgentSettingsSheet({ children }: { children: ReactNode }) {
	const [open, setOpen] = useState(false);
	const agentName = useAgentName();

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger asChild>{children}</SheetTrigger>
			<SheetContent className="gap-0 sm:max-w-lg flex w-full flex-col overflow-y-auto">
				<SheetHeader>
					<SheetTitle>Customize {agentName}</SheetTitle>
					<SheetDescription>
						Shape who your agent is and review what it remembers. Only you ever see
						this.
					</SheetDescription>
				</SheetHeader>
				{/* Mount the body only while open so its queries fire on demand. */}
				{open && <AgentSettingsBody />}
			</SheetContent>
		</Sheet>
	);
}

function AgentSettingsBody() {
	const queryClient = useQueryClient();
	const { confirm } = useConfirmationAlert();

	const profileQuery = useQuery(orpc.ai.profile.get.queryOptions());
	const memoriesQuery = useQuery(orpc.ai.memories.list.queryOptions());

	const [name, setName] = useState("");
	const [persona, setPersona] = useState("");
	const [coreProfile, setCoreProfile] = useState("");
	const [hydrated, setHydrated] = useState(false);

	useEffect(() => {
		if (profileQuery.data && !hydrated) {
			setName(profileQuery.data.name);
			setPersona(profileQuery.data.personaPrompt);
			setCoreProfile(profileQuery.data.coreProfile);
			setHydrated(true);
		}
	}, [profileQuery.data, hydrated]);

	// Copy below uses the saved name, not the draft, so it doesn't jitter while typing.
	const savedName = profileQuery.data?.name ?? "Tophe";

	const updateProfile = useMutation(
		orpc.ai.profile.update.mutationOptions({
			onSuccess: () => {
				toastSuccess("Saved");
				void queryClient.invalidateQueries({ queryKey: orpc.ai.profile.get.queryKey() });
			},
			onError: () => toastError("Couldn't save"),
		}),
	);

	const deleteMemory = useMutation(
		orpc.ai.memories.delete.mutationOptions({
			onSuccess: () =>
				queryClient.invalidateQueries({ queryKey: orpc.ai.memories.list.queryKey() }),
		}),
	);

	const clearMemories = useMutation(
		orpc.ai.memories.clear.mutationOptions({
			onSuccess: () =>
				queryClient.invalidateQueries({ queryKey: orpc.ai.memories.list.queryKey() }),
		}),
	);

	const memories = memoriesQuery.data ?? [];

	return (
		<div className="gap-6 px-1 py-4 flex flex-1 flex-col overflow-y-auto">
			<div className="gap-2 flex flex-col">
				<Label htmlFor="agent-name">Name</Label>
				<p className="text-xs text-muted-foreground">
					What your agent is called, everywhere in the app and in its own head.
				</p>
				<Input
					id="agent-name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					maxLength={50}
					disabled={profileQuery.isLoading}
				/>
			</div>

			<div className="gap-2 flex flex-col">
				<Label htmlFor="agent-persona">Persona - the "soul"</Label>
				<p className="text-xs text-muted-foreground">
					Who {savedName} is and how it talks. Written in the second person to the agent.
				</p>
				<Textarea
					id="agent-persona"
					value={persona}
					onChange={(e) => setPersona(e.target.value)}
					rows={9}
					maxLength={8000}
					disabled={profileQuery.isLoading}
				/>
			</div>

			<div className="gap-2 flex flex-col">
				<Label htmlFor="agent-profile">What {savedName} knows about you</Label>
				<p className="text-xs text-muted-foreground">
					Standing facts and preferences, always available to the agent.
				</p>
				<Textarea
					id="agent-profile"
					value={coreProfile}
					onChange={(e) => setCoreProfile(e.target.value)}
					rows={9}
					maxLength={8000}
					disabled={profileQuery.isLoading}
				/>
			</div>

			<div className="flex justify-end">
				<Button
					onClick={() =>
						updateProfile.mutate({ name: name.trim(), personaPrompt: persona, coreProfile })
					}
					loading={updateProfile.isPending}
					disabled={
						!name.trim() || !persona.trim() || !coreProfile.trim() || profileQuery.isLoading
					}
				>
					Save
				</Button>
			</div>

			<div className="gap-2 pt-4 flex flex-col border-t">
				<div className="flex items-center justify-between">
					<Label>Memory</Label>
					{memories.length > 0 && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() =>
								confirm({
									title: "Forget everything?",
									message: `${savedName} will lose all saved memories. This can't be undone.`,
									destructive: true,
									confirmLabel: "Forget all",
									onConfirm: async () => {
										await clearMemories.mutateAsync(undefined);
									},
								})
							}
						>
							Forget all
						</Button>
					)}
				</div>

				{memoriesQuery.isLoading ? (
					<Spinner className="size-5" />
				) : memories.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						{savedName} hasn't saved any memories yet.
					</p>
				) : (
					<ul className="gap-2 flex flex-col">
						{memories.map((m) => (
							<li
								key={m.id}
								className="group gap-2 p-2 text-sm flex items-start rounded-lg border"
							>
								<span className="min-w-0 flex-1">{m.content}</span>
								<Button
									variant="ghost"
									size="icon"
									className="size-7 shrink-0"
									aria-label="Forget this"
									onClick={() => deleteMemory.mutate({ id: m.id })}
								>
									<Trash2Icon className="size-3.5" />
								</Button>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}
