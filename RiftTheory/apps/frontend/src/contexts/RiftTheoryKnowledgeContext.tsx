import {
    JSXElement,
    createContext,
    createEffect,
    createMemo,
    createResource,
    useContext,
} from "solid-js";
import {
    isRiftTheoryKnowledge,
    RiftTheoryKnowledge,
} from "../types/RiftTheoryKnowledge";

const KNOWLEDGE_PATH = "data/rifttheory-knowledge.json";

async function fetchKnowledge() {
    const url = new URL(KNOWLEDGE_PATH, document.baseURI);
    const response = await fetch(url, { cache: "no-cache" });
    if (!response.ok) {
        throw new Error(`Knowledge request failed: ${response.status}`);
    }
    const value: unknown = await response.json();
    if (!isRiftTheoryKnowledge(value)) {
        throw new Error("Knowledge export has an unsupported schema");
    }
    return value;
}

function createRiftTheoryKnowledgeContext() {
    const [knowledge, { refetch }] = createResource<
        RiftTheoryKnowledge | undefined
    >(fetchKnowledge);
    const championsByKey = createMemo(
        () =>
            new Map(
                (knowledge()?.champions ?? [])
                    .filter((champion) => champion.riotKey !== null)
                    .map((champion) => [champion.riotKey!, champion]),
            ),
    );
    const sourcesByKey = createMemo(
        () =>
            new Map(
                (knowledge()?.sources ?? []).map((source) => [
                    source.source_key,
                    source,
                ]),
            ),
    );
    const championForKey = (riotKey: string) => championsByKey().get(riotKey);
    const sourceForKey = (sourceKey: string) => sourcesByKey().get(sourceKey);
    const championNameFor = (riotKey: string, locale: string) => {
        const champion = championForKey(riotKey);
        return champion?.localizations[locale]?.name ?? champion?.name;
    };

    createEffect(() => {
        (window as any).RIFTTHEORY_DEBUG =
            (window as any).RIFTTHEORY_DEBUG || {};
        // eslint-disable-next-line solid/reactivity
        (window as any).RIFTTHEORY_DEBUG.knowledge = knowledge;
    });

    return {
        knowledge,
        refetch,
        championForKey,
        championNameFor,
        sourceForKey,
    };
}

const RiftTheoryKnowledgeContext =
    createContext<ReturnType<typeof createRiftTheoryKnowledgeContext>>();

export function RiftTheoryKnowledgeProvider(props: { children: JSXElement }) {
    return (
        <RiftTheoryKnowledgeContext.Provider
            value={createRiftTheoryKnowledgeContext()}
        >
            {props.children}
        </RiftTheoryKnowledgeContext.Provider>
    );
}

export function useRiftTheoryKnowledge() {
    const context = useContext(RiftTheoryKnowledgeContext);
    if (!context) throw new Error("No RiftTheoryKnowledgeContext found");
    return context;
}
