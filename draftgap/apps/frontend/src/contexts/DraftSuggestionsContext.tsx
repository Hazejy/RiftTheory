import { JSXElement, createContext, createMemo, useContext } from "solid-js";
import { getSuggestions } from "@draftgap/core/src/draft/suggestions";
import { useDraftAnalysis } from "./DraftAnalysisContext";
import { useDataset } from "./DatasetContext";
import { useDraft } from "./DraftContext";
import { Team } from "@draftgap/core/src/models/Team";
import { Role } from "@draftgap/core/src/models/Role";

export function createDraftSuggestionsContext() {
    const { isLoaded, dataset, dataset30Days } = useDataset();
    const { selection, allyTeam, opponentTeam } = useDraft();
    const { draftAnalysisConfig, allyTeamComp, opponentTeamComp } =
        useDraftAnalysis();

    // Evaluate replacements without counting the champion being replaced as an ally.
    const suggestionTeam = (team: Team, composition: Map<Role, string>) => {
        const result = new Map(composition);
        if (selection.team !== team) return result;
        const key = (team === "ally" ? allyTeam : opponentTeam)[selection.index]
            .championKey;
        for (const [role, championKey] of result) {
            if (key === championKey) result.delete(role);
        }
        return result;
    };

    const allySuggestions = createMemo(() => {
        if (!isLoaded()) return [];

        return getSuggestions(
            dataset()!,
            dataset30Days()!,
            suggestionTeam("ally", allyTeamComp()),
            opponentTeamComp(),
            draftAnalysisConfig(),
        );
    });

    const opponentSuggestions = createMemo(() => {
        if (!isLoaded()) return [];

        return getSuggestions(
            dataset()!,
            dataset30Days()!,
            suggestionTeam("opponent", opponentTeamComp()),
            allyTeamComp(),
            draftAnalysisConfig(),
        );
    });

    return { allySuggestions, opponentSuggestions };
}

export const DraftSuggestionsContext =
    createContext<ReturnType<typeof createDraftSuggestionsContext>>();

export function DraftSuggestionsProvider(props: { children: JSXElement }) {
    return (
        <DraftSuggestionsContext.Provider
            value={createDraftSuggestionsContext()}
        >
            {props.children}
        </DraftSuggestionsContext.Provider>
    );
}

export function useDraftSuggestions() {
    const useCtx = useContext(DraftSuggestionsContext);
    if (!useCtx) throw new Error("No DraftSuggestionsContext found");

    return useCtx;
}
