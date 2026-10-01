import { createContext, createSignal, useContext, type JSXElement } from "solid-js";
import type { StrategyLiveSnapshot } from "../utils/strategyLiveDraft";

function createStrategySession() {
    // The live handoff belongs to this app session and changes only when the
    // user chooses Analyze game or edits the captured Strategy roles.
    const [strategyLiveSnapshot, setStrategyLiveSnapshot] = createSignal<StrategyLiveSnapshot>();
    const [strategySource, setStrategySource] = createSignal<"draft" | "live">("draft");
    return { strategyLiveSnapshot, setStrategyLiveSnapshot, strategySource, setStrategySource };
}

const StrategySessionContext = createContext<ReturnType<typeof createStrategySession>>();

export function StrategySessionProvider(props: { children: JSXElement }) {
    return <StrategySessionContext.Provider value={createStrategySession()}>{props.children}</StrategySessionContext.Provider>;
}

export function useStrategySession() {
    const session = useContext(StrategySessionContext);
    if (!session) throw new Error("No StrategySessionContext found");
    return session;
}
