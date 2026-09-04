import { createSignal, For, Show } from "solid-js";
import { useUser } from "../contexts/UserContext";
import {
    CUSTOM_COLOR_KEYS,
    DEFAULT_CUSTOM_COLORS,
    CustomColorKey,
    isHexColor,
    normalizeCustomColors,
    contrastRatio,
    generateRandomDarkPalette,
} from "../utils/customTheme";

const COPY = {
    en_US: {
        title: "Custom theme · Hex colors",
        hint: "Choose colors, preview, then apply. Strategic colors and team identities stay unchanged.",
        apply: "Apply custom theme",
        reset: "Reset custom colors",
        random: "Generate random palette",
        invalid: "Use six-digit hex codes, e.g. #123456.",
        contrast: "Low text contrast. Some text may be hard to read.",
        sample: "Draft preview",
        saved: "Custom theme applied",
        fields: {
            background: "Background",
            panel: "Panels / header",
            inset: "Inset panels",
            input: "Inputs / controls",
            text: "Main text",
            muted: "Secondary text",
            accent: "Accent / selection",
            border: "Borders",
        },
    },
    ko_KR: {
        title: "사용자 테마 · Hex 색상",
        hint: "색상을 선택하고 미리 본 뒤 적용하세요. 전략 색상과 진영 색상은 유지됩니다.",
        apply: "사용자 테마 적용",
        reset: "사용자 색상 초기화",
        random: "무작위 팔레트 생성",
        invalid: "#123456 형식의 6자리 Hex 코드를 사용하세요.",
        contrast: "텍스트 대비가 낮아 읽기 어려울 수 있습니다.",
        sample: "드래프트 미리보기",
        saved: "사용자 테마 적용됨",
        fields: {
            background: "배경",
            panel: "패널 / 헤더",
            inset: "내부 패널",
            input: "입력 / 컨트롤",
            text: "기본 텍스트",
            muted: "보조 텍스트",
            accent: "강조 / 선택",
            border: "테두리",
        },
    },
    zh_CN: {
        title: "自定义主题 · Hex 颜色",
        hint: "选择颜色并预览，然后应用。策略颜色和阵营颜色保持不变。",
        apply: "应用自定义主题",
        reset: "重置自定义颜色",
        random: "生成随机配色",
        invalid: "请输入六位 Hex 颜色，例如 #123456。",
        contrast: "文字对比度较低，可能难以阅读。",
        sample: "选人预览",
        saved: "已应用自定义主题",
        fields: {
            background: "背景",
            panel: "面板 / 页眉",
            inset: "内嵌面板",
            input: "输入 / 控件",
            text: "主文字",
            muted: "次要文字",
            accent: "强调 / 选中",
            border: "边框",
        },
    },
};

export function CustomThemeEditor() {
    const { config, setConfig } = useUser();
    const copy = () => COPY[config.language as keyof typeof COPY] ?? COPY.en_US;
    const [draft, setDraft] = createSignal({ ...config.customColors });
    const [applied, setApplied] = createSignal(false);
    const valid = () =>
        CUSTOM_COLOR_KEYS.every((key) => isHexColor(draft()[key]));
    const preview = () => normalizeCustomColors(draft());
    const lowContrast = () =>
        valid() &&
        [draft().background, draft().panel, draft().input].some(
            (bg) =>
                contrastRatio(draft().text, bg) < 4.5 ||
                contrastRatio(draft().muted, bg) < 4.5,
        );
    const edit = (key: CustomColorKey, value: string) => {
        setDraft((old) => ({ ...old, [key]: value }));
        setApplied(false);
    };
    return (
        <details
            class="rounded-xl border border-neutral-700 p-3"
            open={config.theme === "custom"}
        >
            <summary class="cursor-pointer text-sm font-semibold">
                {copy().title}
            </summary>
            <div
                class="mt-3 space-y-3 rounded-lg p-3"
                style={{ background: "#11151c", color: "#f4f4f4" }}
            >
                <p class="text-xs">{copy().hint}</p>
                <div class="grid gap-3 sm:grid-cols-2">
                    <For each={CUSTOM_COLOR_KEYS}>
                        {(key) => (
                            <label class="text-xs space-y-1 block">
                                <span>{copy().fields[key]}</span>
                                <span class="flex gap-2">
                                    <input
                                        type="color"
                                        aria-label={`${copy().fields[key]} picker`}
                                        value={preview()[key]}
                                        onInput={(event) =>
                                            edit(key, event.currentTarget.value)
                                        }
                                        class="h-9 w-9 shrink-0 cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        aria-label={`${copy().fields[key]} hex`}
                                        value={draft()[key]}
                                        maxlength={7}
                                        spellcheck={false}
                                        autocomplete="off"
                                        aria-invalid={!isHexColor(draft()[key])}
                                        onInput={(event) =>
                                            edit(key, event.currentTarget.value)
                                        }
                                        class="min-w-0 w-full rounded border px-2 font-mono"
                                        style={{
                                            background: "#222630",
                                            color: "#f4f4f4",
                                            "border-color": isHexColor(
                                                draft()[key],
                                            )
                                                ? "#616b7b"
                                                : "#fb7185",
                                        }}
                                    />
                                </span>
                            </label>
                        )}
                    </For>
                </div>
                <div
                    class="rounded-lg p-4 border"
                    style={{
                        background: preview().background,
                        color: preview().text,
                        "border-color": preview().border,
                    }}
                >
                    <div
                        class="rounded-lg p-3"
                        style={{ background: preview().panel }}
                    >
                        <p style={{ color: preview().accent }}>RiftTheory</p>
                        <p>{copy().sample}</p>
                        <p class="text-xs" style={{ color: preview().muted }}>
                            Blue Side · Red Side
                        </p>
                    </div>
                </div>
                <Show when={!valid()}>
                    <p
                        role="status"
                        class="text-xs"
                        style={{ color: "#fda4af" }}
                    >
                        {copy().invalid}
                    </p>
                </Show>
                <Show when={lowContrast()}>
                    <p
                        role="status"
                        class="text-xs"
                        style={{ color: "#fcd34d" }}
                    >
                        {copy().contrast}
                    </p>
                </Show>
                <div class="flex flex-wrap gap-2">
                    <button
                        type="button"
                        class="rounded-lg border px-3 py-2 text-xs"
                        style={{ "border-color": "#e5bd80", color: "#e5bd80" }}
                        onClick={() => {
                            setDraft(generateRandomDarkPalette());
                            setApplied(false);
                        }}
                    >
                        {copy().random}
                    </button>
                    <button
                        type="button"
                        disabled={!valid()}
                        class="rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-40"
                        style={{ background: "#e5bd80", color: "#11151c" }}
                        onClick={() => {
                            if (valid()) {
                                setConfig({
                                    theme: "custom",
                                    customColors:
                                        normalizeCustomColors(draft()),
                                });
                                setApplied(true);
                            }
                        }}
                    >
                        {copy().apply}
                    </button>
                    <button
                        type="button"
                        class="rounded-lg border px-3 py-2 text-xs"
                        style={{ "border-color": "#616b7b" }}
                        onClick={() => {
                            setDraft({ ...DEFAULT_CUSTOM_COLORS });
                            setConfig({
                                theme: "obsidian",
                                customColors: { ...DEFAULT_CUSTOM_COLORS },
                            });
                            setApplied(false);
                        }}
                    >
                        {copy().reset}
                    </button>
                </div>
                <Show when={applied()}>
                    <p role="status" class="text-xs">
                        {copy().saved}
                    </p>
                </Show>
            </div>
        </details>
    );
}
