import { Icon, trash } from "../icons/RiftIcons";
import { Team } from "@draftgap/core/src/models/Team";
import { useDraft } from "../../contexts/DraftContext";
import { useI18n } from "../../utils/i18n";
import { pickLabel } from "../../utils/draftOrder";

export function PickResetButton(props: { team: Team; index: number }) {
    const { t } = useI18n();
    const { allyTeam, opponentTeam, pickChampion } = useDraft();
    const pick = () =>
        (props.team === "ally" ? allyTeam : opponentTeam)[props.index];
    const label = () => `${t("reset")} ${pickLabel(props.team, props.index)}`;
    return (
        <button
            type="button"
            aria-label={label()}
            title={label()}
            disabled={!pick().championKey && !pick().hoverKey}
            class="absolute right-1 top-1 rounded p-2 text-neutral-400 hover:text-red-300 disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-accent"
            onClick={(event) => {
                event.stopPropagation();
                pickChampion(props.team, props.index, undefined, undefined);
            }}
        >
            <Icon path={trash} class="h-5 w-5" aria-hidden="true" />
        </button>
    );
}
