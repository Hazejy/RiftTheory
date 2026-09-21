import { createSignal } from "solid-js";
import type { StrategyLiveSnapshot } from "../utils/strategyLiveDraft";

// Deliberately session-only. A snapshot is refreshed only by Analyze game.
export const [strategyLiveSnapshot, setStrategyLiveSnapshot] =
    createSignal<StrategyLiveSnapshot>();
export const [strategySource, setStrategySource] = createSignal<
    "draft" | "live"
>("draft");
