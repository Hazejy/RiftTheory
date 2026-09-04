import { createMemo, For, Show } from "solid-js";
import { KnowledgeChampion } from "../../types/RiftTheoryKnowledge";
import { latestRoleEvidence } from "../../utils/flexEvidence";
import { useUser } from "../../contexts/UserContext";
import { useI18n } from "../../utils/i18n";

const TIER_CLASSES = {
    primary: "border-accent/70 bg-accent/10 text-accent",
    established: "border-emerald-700 bg-emerald-950/40 text-emerald-200",
    emerging: "border-neutral-600 bg-neutral-800 text-neutral-300",
    insufficient: "border-neutral-800 text-neutral-500",
} as const;

const TIER_LABELS = {
    primary: "flexPrimary",
    established: "flexEstablished",
    emerging: "flexEmerging",
    insufficient: "flexInsufficient",
} as const;

export default function ObservedRoleBadges(props: {
    champion?: KnowledgeChampion;
    selectedRole?: string;
}) {
    const { config } = useUser();
    const { t, term } = useI18n();
    const evidence = createMemo(() => latestRoleEvidence(props.champion));
    const visibleRoles = createMemo(() =>
        evidence().roles.filter((role) => role.tier !== "insufficient"),
    );
    const percent = createMemo(
        () =>
            new Intl.NumberFormat(config.language.replace("_", "-"), {
                style: "percent",
                maximumFractionDigits: 1,
            }),
    );
    const integer = createMemo(
        () => new Intl.NumberFormat(config.language.replace("_", "-")),
    );

    return (
        <Show
            when={visibleRoles().length}
            fallback={<span class="text-xs text-neutral-500">{t("none")}</span>}
        >
            <div class="flex flex-wrap gap-1.5">
                <For each={visibleRoles()}>
                    {(role) => (
                        <span
                            class={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs tabular-nums ${TIER_CLASSES[role.tier]}`}
                            classList={{
                                "ring-1 ring-white/50":
                                    props.selectedRole === role.role,
                            }}
                            title={`${t(TIER_LABELS[role.tier])} · ${integer().format(role.games)} ${t("games")} · ${t("flexLowerBound")}: ${percent().format(role.lowerShare)} · ${t("patch")} ${evidence().context?.patch ?? "—"}`}
                        >
                            <span>{term(role.role)}</span>
                            <span class="opacity-75">
                                {percent().format(role.roleShare)}
                            </span>
                        </span>
                    )}
                </For>
            </div>
        </Show>
    );
}
