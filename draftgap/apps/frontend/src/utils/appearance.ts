import { CustomColors, normalizeCustomColors } from "./customTheme";

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
    theme: "obsidian" | "custom";
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
        theme: theme === "custom" ? "custom" : "obsidian",
        customColors: normalizeCustomColors(value.customColors),
    };
}
