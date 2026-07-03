"use client";

import { orpc } from "@shared/lib/orpc-query-utils";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export const MODEL_STORAGE_KEY = "tophe.agent.model";

export interface ChatModelOption {
	id: string;
	label: string;
	provider: "anthropic" | "openai" | "local";
	hint: string;
}

/**
 * The models this deployment has configured (env-driven server-side: Anthropic
 * key, a hosted OpenAI-compatible provider, a self-hosted model server, or any
 * mix) plus the current selection.
 * Selection persists in localStorage and falls back to the server default when
 * the stored id is no longer configured.
 */
export function useChatModels() {
	const { data, isLoading } = useQuery(orpc.ai.models.queryOptions());
	const models: ChatModelOption[] = data?.models ?? [];
	const [selected, setSelected] = useState<string | null>(null);

	useEffect(() => {
		if (!data) {
			return;
		}
		const stored = window.localStorage.getItem(MODEL_STORAGE_KEY);
		const isConfigured = (id: string | null) => !!id && data.models.some((m) => m.id === id);
		setSelected((prev) => {
			if (isConfigured(prev)) return prev;
			if (isConfigured(stored)) return stored;
			if (isConfigured(data.defaultId)) return data.defaultId;
			return data.models[0]?.id ?? null;
		});
	}, [data]);

	const selectModel = (id: string) => {
		setSelected(id);
		window.localStorage.setItem(MODEL_STORAGE_KEY, id);
	};

	return { models, selected, selectModel, isLoading };
}
