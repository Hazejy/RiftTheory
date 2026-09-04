import { createSignal, For, onCleanup, onMount } from "solid-js";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogTrigger,
} from "../common/Dialog";
import { Icon, keyboard } from "../icons/RiftIcons";
import { useDraftView } from "../../contexts/DraftViewContext";
import { useDraft } from "../../contexts/DraftContext";
import { useUser } from "../../contexts/UserContext";
import { useI18n } from "../../utils/i18n";
import {
    DEFAULT_SHORTCUTS,
    normalizeShortcuts,
    SHORTCUT_ACTIONS,
    ShortcutAction,
    ShortcutBindings,
    validShortcutKey,
} from "../../utils/shortcuts";

const COPY = {
    en_US: {
        title: "Keyboard shortcuts",
        edit: "Edit a key below. Duplicate keys are allowed and highlighted. Changes are saved on this device.",
        duplicate:
            "This key is also assigned to another action. The first matching action in the list takes priority.",
        invalid: "Use a single visible character, or leave the field empty.",
        reset: "Restore default keys",
        slot: "Slot",
        note: "Shortcuts pause while typing or using a dialog. There is no instant-reset shortcut.",
        enabled: "Enable single-key shortcuts",
        help: "Open this guide",
        search: "Focus champion search",
        slots: "Pick slot on the selected side (B1–B5 / R1–R5)",
        blue: "Target Blue Side (next empty slot)",
        red: "Target Red Side (next empty slot)",
    },
    ko_KR: {
        title: "키보드 단축키",
        edit: "아래에서 키를 변경하세요. 중복 키도 허용되며 경고로 표시됩니다. 변경 사항은 이 기기에 저장됩니다.",
        duplicate:
            "이 키는 다른 동작에도 지정되어 있습니다. 목록에서 먼저 일치하는 동작이 우선합니다.",
        invalid: "문자 하나를 입력하거나 비워 두세요.",
        reset: "기본 키 복원",
        slot: "슬롯",
        note: "입력 중이거나 대화상자를 사용할 때는 단축키가 멈춥니다. 즉시 초기화 단축키는 없습니다.",
        enabled: "한 키 단축키 사용",
        help: "이 안내 열기",
        search: "챔피언 검색으로 이동",
        slots: "선택한 진영의 슬롯 선택 (B1–B5 / R1–R5)",
        blue: "블루 진영 선택 (다음 빈 슬롯)",
        red: "레드 진영 선택 (다음 빈 슬롯)",
    },
    zh_CN: {
        title: "键盘快捷键",
        edit: "在下方修改按键。允许重复按键，并会显示警告。更改保存在此设备上。",
        duplicate: "此按键也分配给其他操作。列表中第一个匹配的操作优先。",
        invalid: "请输入单个可见字符，或留空。",
        reset: "恢复默认按键",
        slot: "槽位",
        note: "输入文字或使用对话框时暂停快捷键。不提供立即重置快捷键。",
        enabled: "启用单键快捷键",
        help: "打开此指南",
        search: "聚焦英雄搜索",
        slots: "选择当前阵营的槽位（B1–B5 / R1–R5）",
        blue: "选择蓝色方（下一个空位）",
        red: "选择红色方（下一个空位）",
    },
};

export function WorkspaceShortcuts() {
    const { config } = useUser();
    const { t } = useI18n();
    const { setCurrentDraftView } = useDraftView();
    const { select, selection, allyTeam, opponentTeam } = useDraft();
    const [open, setOpen] = createSignal(false);
    const [enabled, setEnabled] = createSignal(true);
    const [bindings, setBindings] = createSignal<ShortcutBindings>({
        ...DEFAULT_SHORTCUTS,
    });
    const [error, setError] = createSignal<"duplicate" | "invalid">();
    const copy = () => COPY[config.language as keyof typeof COPY] ?? COPY.en_US;
    const rows = () =>
        [
            ["slot1", `${copy().slot} 1 · B1 / R1`],
            ["slot2", `${copy().slot} 2 · B2 / R2`],
            ["slot3", `${copy().slot} 3 · B3 / R3`],
            ["slot4", `${copy().slot} 4 · B4 / R4`],
            ["slot5", `${copy().slot} 5 · B5 / R5`],
            ["draft", t("draft")],
            ["analysis", t("analysis")],
            ["strategy", t("strategy")],
            ["colors", t("champColors")],
            ["search", copy().search],
            ["blue", copy().blue],
            ["red", copy().red],
            ["help", copy().help],
        ] as const;

    function saveBindings(next: ShortcutBindings) {
        setBindings(next);
        setError(undefined);
        try {
            localStorage.setItem(
                "rifttheory.keybindings",
                JSON.stringify(next),
            );
        } catch {
            /* Storage is optional. */
        }
    }

    function editBinding(action: ShortcutAction, input: HTMLInputElement) {
        const key = input.value.toLowerCase();
        if (!validShortcutKey(key)) {
            setError("invalid");
            input.value = bindings()[action];
            return;
        }
        const duplicate =
            key &&
            SHORTCUT_ACTIONS.some(
                (other) => other !== action && bindings()[other] === key,
            );
        saveBindings({ ...bindings(), [action]: key });
        if (duplicate) setError("duplicate");
        input.value = key;
    }

    onMount(() => {
        try {
            setEnabled(localStorage.getItem("rifttheory.shortcuts") !== "off");
            setBindings(
                normalizeShortcuts(
                    JSON.parse(
                        localStorage.getItem("rifttheory.keybindings") ??
                            "null",
                    ),
                ),
            );
        } catch {
            /* Storage is optional. */
        }
        const handleKey = (event: KeyboardEvent) => {
            if (
                !enabled() ||
                event.defaultPrevented ||
                event.repeat ||
                event.isComposing ||
                event.ctrlKey ||
                event.metaKey ||
                event.altKey
            )
                return;
            if (
                event.target instanceof HTMLElement &&
                event.target.closest(
                    "input, textarea, select, [contenteditable]:not([contenteditable=false]), [role=combobox], [role=textbox]",
                )
            )
                return;
            if (
                document.querySelector(
                    '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"]',
                )
            )
                return;
            const key = event.key.toLowerCase();
            const action = SHORTCUT_ACTIONS.find(
                (action) =>
                    bindings()[action] !== "" && bindings()[action] === key,
            );
            if (!action) return;
            if (action.startsWith("slot")) {
                event.preventDefault();
                select(
                    selection.team ?? "ally",
                    Number(action.slice(4)) - 1,
                    false,
                    false,
                );
            } else if (
                action === "draft" ||
                action === "analysis" ||
                action === "strategy" ||
                action === "colors"
            ) {
                event.preventDefault();
                setCurrentDraftView({
                    type: action,
                    subType: "draft",
                });
            } else if (action === "search") {
                const input = [
                    ...document.querySelectorAll<HTMLInputElement>(
                        "[data-champion-search]",
                    ),
                ].find((el) => el.getClientRects().length > 0);
                if (input) {
                    event.preventDefault();
                    input.focus();
                }
            } else if (action === "blue" || action === "red") {
                const team = action === "blue" ? "ally" : "opponent";
                const index = (
                    team === "ally" ? allyTeam : opponentTeam
                ).findIndex((pick) => !pick.championKey);
                event.preventDefault();
                select(team, index >= 0 ? index : 0, false, false);
            } else if (action === "help") {
                event.preventDefault();
                setOpen(true);
            }
        };
        window.addEventListener("keydown", handleKey);
        onCleanup(() => window.removeEventListener("keydown", handleKey));
    });

    return (
        <Dialog open={open()} onOpenChange={setOpen}>
            <DialogTrigger
                aria-label={copy().title}
                title={copy().title}
                class="hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-accent"
            >
                <Icon path={keyboard} class="h-6 w-6" />
            </DialogTrigger>
            <DialogContent>
                <DialogTitle class="text-xl font-semibold">
                    {copy().title}
                </DialogTitle>
                <p class="text-sm text-neutral-400 pr-4">{copy().note}</p>
                <p class="text-xs text-neutral-400">{copy().edit}</p>
                <p
                    role="status"
                    class="text-sm"
                    classList={{
                        "text-amber-300": error() === "duplicate",
                        "text-red-300": error() === "invalid",
                    }}
                >
                    {error() ? copy()[error()!] : ""}
                </p>
                <dl class="grid gap-2">
                    <For each={rows()}>
                        {(row) => (
                            <div class="flex items-center justify-between gap-4 border-b border-neutral-700 py-2 text-sm">
                                <dt>{row[1]}</dt>
                                <dd>
                                    <input
                                        aria-label={row[1]}
                                        value={bindings()[row[0]]}
                                        onInput={(event) =>
                                            editBinding(
                                                row[0],
                                                event.currentTarget,
                                            )
                                        }
                                        autocomplete="off"
                                        spellcheck={false}
                                        class="w-14 rounded border border-neutral-600 bg-neutral-900 px-2 py-1 text-center text-accent focus-visible:outline-2 focus-visible:outline-accent"
                                    />
                                </dd>
                            </div>
                        )}
                    </For>
                </dl>
                <button
                    type="button"
                    class="rounded-lg border border-neutral-600 px-3 py-2 text-sm hover:bg-neutral-800"
                    onClick={() => saveBindings({ ...DEFAULT_SHORTCUTS })}
                >
                    {copy().reset}
                </button>
                <label class="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={enabled()}
                        onChange={(event) => {
                            setEnabled(event.currentTarget.checked);
                            try {
                                localStorage.setItem(
                                    "rifttheory.shortcuts",
                                    enabled() ? "on" : "off",
                                );
                            } catch {
                                /* Storage is optional. */
                            }
                        }}
                    />
                    {copy().enabled}
                </label>
            </DialogContent>
        </Dialog>
    );
}
