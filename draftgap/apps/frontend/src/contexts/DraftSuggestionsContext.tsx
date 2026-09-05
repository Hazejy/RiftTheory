import { JSXElement, createContext, createMemo, useContext } from "solid-js";
import { getSuggestions } from "@draftgap/core/src/draft/suggestions";
import { useDraftAnalysis } from "./DraftAnalysisContext";
import { useDataset } from "./DatasetContext";
import { useDraft } from "./DraftContext";
import { Team } from "@draftgap/core/src/models/Team";
import { Role, ROLES } from "@draftgap/core/src/models/Role";
import {
    assessSuggestionEvidence,
    SuggestionEvidence,
} from "@draftgap/core/src/draft/suggestion-evidence";
import { useRiftTheoryKnowledge } from "./RiftTheoryKnowledgeContext";
import {
    suggestionEvidenceKey,
    EVIDENCE_ROLE_NAMES,
    toInteractionRule,
    toSuggestionEvidenceChampion,
} from "../utils/interactionEvidence";
import { latestRoleEvidence } from "../utils/flexEvidence";

export type RiftTheorySuggestionEvidence = SuggestionEvidence & {
    observedRole:
        | {
              tier: "primary" | "established" | "emerging";
              games: number;
              roleShare: number;
          }
        | undefined;
    flexOptions: Array<{
        role: Role;
        tier: "primary" | "established" | "emerging";
        games: number;
        roleShare: number;
    }>;
};

export function createDraftSuggestionsContext() {
    const { isLoaded, dataset, dataset30Days } = useDataset();
    const { selection, allyTeam, opponentTeam } = useDraft();
    const { knowledge, championForKey } = useRiftTheoryKnowledge();
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

    const evidenceMap = (
        suggestions: ReturnType<typeof allySuggestions>,
        team: Team,
        composition: Map<Role, string>,
        enemy: Map<Role, string>,
    ) => {
        const candidateTeam = team === "ally" ? "blue" : "red";
        const enemyTeam = team === "ally" ? "red" : "blue";
        const allies = [...composition].map(([role, championKey]) =>
            toSuggestionEvidenceChampion(
                championKey,
                role,
                candidateTeam,
                championForKey(championKey),
            ),
        );
        const enemies = [...enemy].map(([role, championKey]) =>
            toSuggestionEvidenceChampion(
                championKey,
                role,
                enemyTeam,
                championForKey(championKey),
            ),
        );
        const rules = (knowledge()?.interactionRules ?? []).map(
            toInteractionRule,
        );
        const openRoles = new Set(
            ROLES.filter((role) => !composition.has(role)),
        );
        return new Map(
            suggestions.map((suggestion) => {
                const champion = championForKey(suggestion.championKey);
                const candidate = toSuggestionEvidenceChampion(
                    suggestion.championKey,
                    suggestion.role,
                    candidateTeam,
                    champion,
                );
                const roleName = candidate.role;
                const observed = latestRoleEvidence(champion).roles.find(
                    (role) => role.role === roleName,
                );
                const observedRole =
                    observed && observed.tier !== "insufficient"
                        ? {
                              tier: observed.tier,
                              games: observed.games,
                              roleShare: observed.roleShare,
                          }
                        : undefined;
                const flexOptions = latestRoleEvidence(champion)
                    .roles.filter((role) => role.role !== roleName)
                    .flatMap((role) => {
                        if (role.tier === "insufficient") return [];
                        const mappedRole = ROLES.find(
                            (candidateRole) =>
                                EVIDENCE_ROLE_NAMES[candidateRole] ===
                                role.role,
                        );
                        if (
                            mappedRole === undefined ||
                            !openRoles.has(mappedRole)
                        )
                            return [];
                        return [
                            {
                                role: mappedRole,
                                tier: role.tier,
                                games: role.games,
                                roleShare: role.roleShare,
                            },
                        ];
                    });
                return [
                    suggestionEvidenceKey(
                        suggestion.championKey,
                        suggestion.role,
                    ),
                    {
                        ...assessSuggestionEvidence(
                            candidate,
                            allies,
                            enemies,
                            rules,
                        ),
                        observedRole,
                        flexOptions,
                    } satisfies RiftTheorySuggestionEvidence,
                ] as const;
            }),
        );
    };

    const allySuggestionEvidence = createMemo(() =>
        evidenceMap(
            allySuggestions(),
            "ally",
            suggestionTeam("ally", allyTeamComp()),
            opponentTeamComp(),
        ),
    );
    const opponentSuggestionEvidence = createMemo(() =>
        evidenceMap(
            opponentSuggestions(),
            "opponent",
            suggestionTeam("opponent", opponentTeamComp()),
            allyTeamComp(),
        ),
    );

    return {
        allySuggestions,
        opponentSuggestions,
        allySuggestionEvidence,
        opponentSuggestionEvidence,
    };
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
