import { createSignal, Show } from "solid-js";
import { useDraft } from "../../contexts/DraftContext";
import { useDataset } from "../../contexts/DatasetContext";
import { useUser } from "../../contexts/UserContext";
import { championName, useI18n } from "../../utils/i18n";
import { downloadDraftSnapshot } from "../../utils/draftSnapshot";
import { pickLabel } from "../../utils/draftOrder";
import { formatPatch } from "../../utils/strings";
import { Icon, camera } from "../icons/RiftIcons";

const COPY = {
    en_US: {
        button: "Save draft image",
        working: "Creating PNG…",
        empty: "Empty slot",
        role: "Role open",
        done: "PNG download started",
        partial: "PNG ready; some portraits could not load",
        error: "Image export failed. Please try again.",
    },
    ko_KR: {
        button: "드래프트 이미지 저장",
        working: "PNG 생성 중…",
        empty: "빈 슬롯",
        role: "포지션 미정",
        done: "PNG 다운로드 시작됨",
        partial: "PNG 준비됨. 일부 초상화를 불러오지 못했습니다",
        error: "이미지 저장에 실패했습니다. 다시 시도하세요.",
    },
    zh_CN: {
        button: "保存选人图片",
        working: "正在生成 PNG…",
        empty: "空槽位",
        role: "分路未定",
        done: "已开始下载 PNG",
        partial: "PNG 已生成，部分头像未能加载",
        error: "图片导出失败，请重试。",
    },
};

export function DraftSnapshotButton() {
    const { allyTeam, opponentTeam } = useDraft();
    const { dataset } = useDataset();
    const { config } = useUser();
    const { t, roleName } = useI18n();
    const [busy, setBusy] = createSignal(false);
    const [message, setMessage] = createSignal<"done" | "partial" | "error">();
    const copy = () => COPY[config.language as keyof typeof COPY] ?? COPY.en_US;
    async function save() {
        const data = dataset();
        if (busy() || !data) return;
        setBusy(true);
        setMessage(undefined);
        // Capture state before asynchronous image loading: later picks cannot alter this export.
        const picks = [...allyTeam, ...opponentTeam].map((pick, index) => {
            const champion = pick.championKey
                ? data.championData[pick.championKey]
                : undefined;
            return {
                slot: pickLabel(index < 5 ? "ally" : "opponent", index % 5),
                name: champion ? championName(champion, config) : copy().empty,
                role:
                    pick.role === undefined ? copy().role : roleName(pick.role),
                portrait: champion
                    ? `https://ddragon.leagueoflegends.com/cdn/${data.version}/img/champion/${champion.id}.png`
                    : undefined,
            };
        });
        const css = getComputedStyle(document.documentElement);
        try {
            const missing = await downloadDraftSnapshot({
                picks,
                blueLabel: t("ally"),
                redLabel: t("opponent"),
                patchLabel: `${t("patch")} ${formatPatch(data.version)}`,
                background: css.getPropertyValue("--color-canvas").trim(),
                panel: css.getPropertyValue("--color-primary").trim(),
                text: css.getPropertyValue("--color-text").trim(),
                muted: css.getPropertyValue("--color-neutral-400").trim(),
                accent: css.getPropertyValue("--color-accent").trim(),
                font: css.getPropertyValue("--font-body").trim(),
            });
            setMessage(missing ? "partial" : "done");
        } catch {
            setMessage("error");
        } finally {
            setBusy(false);
        }
    }
    return (
        <div class="relative">
            <button
                type="button"
                aria-label={copy().button}
                title={busy() ? copy().working : copy().button}
                aria-busy={busy()}
                disabled={
                    busy() ||
                    !dataset() ||
                    ![...allyTeam, ...opponentTeam].some(
                        (pick) => pick.championKey,
                    )
                }
                onClick={save}
                class="hover:bg-white/10 disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-accent"
            >
                <Icon path={camera} class="h-6 w-6" />
            </button>
            <Show when={message() || busy()}>
                <p
                    role="status"
                    class="absolute right-0 top-full mt-2 w-56 rounded-lg border border-neutral-700 bg-primary p-3 text-xs text-neutral-200 shadow-lg z-50"
                    onClick={() => setMessage(undefined)}
                >
                    {busy() ? copy().working : copy()[message()!]}
                </p>
            </Show>
        </div>
    );
}
