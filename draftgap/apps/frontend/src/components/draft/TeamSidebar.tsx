import { For } from "solid-js";
import { ratingToWinrate } from "@draftgap/core/src/rating/ratings";
import { CountUp } from "../CountUp";
import { DamageDistributionBar } from "./DamageDistributionBar";
import { Pick } from "./Pick";
import { TeamResetButton } from "./TeamResetButton";
import { tooltip } from "../../directives/tooltip";
import { useI18n } from "../../utils/i18n";
import { getRatingClass } from "../../utils/rating";
import { useDraftAnalysis } from "../../contexts/DraftAnalysisContext";
// eslint-disable-next-line
tooltip;

interface IProps {
    team: "ally" | "opponent";
}

export function TeamSidebar(props: IProps) {
    const { t } = useI18n();
    const {
        allyDraftAnalysis: allyDraftResult,
        opponentDraftAnalysis: opponentDraftResult,
    } = useDraftAnalysis();

    const rating = () =>
        props.team === "ally"
            ? allyDraftResult()?.totalRating
            : opponentDraftResult()?.totalRating;

    return (
        <div class="rt-team-sidebar bg-primary flex flex-col h-full relative">
            <DamageDistributionBar team={props.team} />
            <div class="relative flex-1 flex justify-center items-center bg-panel-inset pt-7 pb-1">
                <span
                    class="text-[2.5rem] text-center leading-tight"
                    // @ts-ignore
                    use:tooltip={{
                        content: (
                            <>
                                {t("winrate")}. {t("modelCaveat")}
                            </>
                        ),
                    }}
                >
                    <span
                        classList={{
                            "text-ally": props.team === "ally",
                            "text-opponent": props.team === "opponent",
                        }}
                    >
                        {t(props.team)}
                    </span>
                    <br />
                    <CountUp
                        value={rating() ? ratingToWinrate(rating()!) : 0.5}
                        formatFn={(value) => (value * 100).toFixed(2)}
                        class={`${getRatingClass(
                            rating() ?? 0,
                        )} transition-colors duration-500`}
                        style={{
                            "font-variant-numeric": "tabular-nums",
                        }}
                    />
                </span>
                <TeamResetButton team={props.team} />
            </div>
            <For each={[0, 1, 2, 3, 4]}>
                {(index) => <Pick team={props.team} index={index} />}
            </For>
        </div>
    );
}
