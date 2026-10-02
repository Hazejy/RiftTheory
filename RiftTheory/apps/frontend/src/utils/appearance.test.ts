import { expect, test } from "bun:test";
import { normalizeAppearance, THEME_PRESETS } from "./appearance";
import { contrastRatio, customThemeVariables, DEFAULT_CUSTOM_COLORS } from "./customTheme";

test("saved transparency is clamped and old preferences remain opaque", () => {
    expect(normalizeAppearance({}).transparency).toBe(0);
    expect(normalizeAppearance({ transparency: 126 }).transparency).toBe(100);
    expect(normalizeAppearance({ transparency: -20 }).transparency).toBe(0);
    expect(normalizeAppearance({ transparency: Number.NaN }).transparency).toBe(0);
});

test("surface transparency leaves text colors opaque", () => {
    const variables = customThemeVariables(DEFAULT_CUSTOM_COLORS);
    expect(variables["--color-primary"]).toContain("var(--surface-opacity)");
    expect(variables["--color-text"]).toBe(DEFAULT_CUSTOM_COLORS.text);
});

test("all theme text and accent colors remain readable on panels", () => {
    for (const theme of THEME_PRESETS) {
        for (const foreground of ["text", "muted", "accent"] as const) {
            expect(contrastRatio(theme.colors[foreground], theme.colors.panel)).toBeGreaterThanOrEqual(4.5);
        }
    }
});
