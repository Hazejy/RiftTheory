import { CustomColors, normalizeCustomColors } from "./customTheme";

export const THEME_PRESETS = [
    {
        id: "obsidian",
        name: "Obsidian",
        description: "Warm gold on deep graphite",
        colors: {
            background: "#0d1016", panel: "#171b23", inset: "#11151c",
            input: "#222630", text: "#f4f4f4", muted: "#b1b9c7",
            accent: "#e5bd80", border: "#3b414e",
        },
    },
    {
        id: "ember",
        name: "Ember",
        description: "Copper signal on midnight black",
        colors: {
            background: "#120d0d", panel: "#211515", inset: "#180f10",
            input: "#302020", text: "#fff5f0", muted: "#c9aaa0",
            accent: "#f08a62", border: "#593630",
        },
    },
    {
        id: "tide",
        name: "Tide",
        description: "Arctic cyan with ocean depth",
        colors: {
            background: "#081217", panel: "#10212a", inset: "#0b1a21",
            input: "#17313b", text: "#edfaff", muted: "#a4c4cd",
            accent: "#66d9e8", border: "#28515d",
        },
    },
    {
        id: "arcane",
        name: "Arcane",
        description: "Violet energy and polished steel",
        colors: {
            background: "#100d18", panel: "#1c1628", inset: "#151020",
            input: "#2b2040", text: "#f7f1ff", muted: "#bbaed0",
            accent: "#b58cff", border: "#4b3a6b",
        },
    },
    {
        id: "verdant",
        name: "Verdant",
        description: "Emerald strategy board",
        colors: {
            background: "#091310", panel: "#12201a", inset: "#0d1914",
            input: "#1b3027", text: "#effff5", muted: "#a8c8b4",
            accent: "#77d69a", border: "#2f5942",
        },
    },
] as const;

export type ThemePresetId = (typeof THEME_PRESETS)[number]["id"];

export const FONT_PRESETS = [
    {
        id: "inter",
        name: "Inter",
        family: '"Inter Variable", "Malgun Gothic", "Microsoft YaHei", "PingFang SC", sans-serif',
    },
    {
        id: "roboto",
        name: "Roboto",
        family: '"Roboto Variable", "Malgun Gothic", "Microsoft YaHei", "PingFang SC", sans-serif',
    },
    {
        id: "plus-jakarta-sans",
        name: "Plus Jakarta Sans",
        family: '"Plus Jakarta Sans Variable", "Malgun Gothic", "Microsoft YaHei", "PingFang SC", sans-serif',
    },
] as const;

export type AppearancePreferences = {
    fontPreset: (typeof FONT_PRESETS)[number]["id"];
    theme: ThemePresetId | "custom";
    customColors: CustomColors;
};

export function normalizeAppearance(value: {
    fontPreset?: unknown;
    theme?: unknown;
    customColors?: unknown;
}): AppearancePreferences {
    const theme = typeof value.theme === "string" ? value.theme : undefined;
    return {
        fontPreset:
            FONT_PRESETS.find((font) => font.id === value.fontPreset)?.id ??
            "inter",
        theme:
            theme === "custom" ||
            THEME_PRESETS.some((preset) => preset.id === theme)
                ? (theme as ThemePresetId | "custom")
                : "obsidian",
        customColors: normalizeCustomColors(value.customColors),
    };
}
