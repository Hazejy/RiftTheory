import { Icon, trash } from "../icons/RiftIcons";
import { useDraft } from "../../contexts/DraftContext";
import { Team } from "@draftgap/core/src/models/Team";
import { cn } from "../../utils/style";
import { buttonVariants } from "../common/Button";
import { useI18n } from "../../utils/i18n";

export function TeamResetButton(props: { team: Team }) {
    const { t } = useI18n();
    const { resetTeam, allyTeam, opponentTeam } = useDraft();
    const label = () => t(props.team === "ally" ? "resetBlue" : "resetRed");
    const empty = () =>
        (props.team === "ally" ? allyTeam : opponentTeam).every(
            (pick) => !pick.championKey && !pick.hoverKey,
        );

    return (
        <button
            type="button"
            aria-label={label()}
            title={label()}
            disabled={empty()}
            class={cn(
                buttonVariants({ variant: "transparent" }),
                "absolute right-1 top-1 p-2 text-neutral-400 hover:text-red-300 disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-accent",
            )}
            onClick={() => resetTeam(props.team)}
        >
            <Icon path={trash} class="h-5 w-5" aria-hidden="true" />
        </button>
    );
}
