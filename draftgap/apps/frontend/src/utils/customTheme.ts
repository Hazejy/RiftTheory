export const DEFAULT_CUSTOM_COLORS = {
    background: "#0d1016",
    panel: "#171b23",
    inset: "#11151c",
    input: "#222630",
    text: "#f4f4f4",
    muted: "#b1b9c7",
    accent: "#e5bd80",
    border: "#3b414e",
};
export type CustomColors = typeof DEFAULT_CUSTOM_COLORS;
export type CustomColorKey = keyof CustomColors;
export const CUSTOM_COLOR_KEYS = Object.keys(
    DEFAULT_CUSTOM_COLORS,
) as CustomColorKey[];
export const isHexColor = (value: unknown): value is string =>
    typeof value === "string" && /^#[\da-f]{6}$/i.test(value);

export function normalizeCustomColors(value: unknown): CustomColors {
    const saved =
        value && typeof value === "object"
            ? (value as Record<string, unknown>)
            : {};
    return Object.fromEntries(
        CUSTOM_COLOR_KEYS.map((key) => [
            key,
            isHexColor(saved[key])
                ? saved[key].toLowerCase()
                : DEFAULT_CUSTOM_COLORS[key],
        ]),
    ) as CustomColors;
}

export function customThemeVariables(colors: CustomColors) {
    return {
        "--color-canvas": colors.background,
        "--color-primary": colors.panel,
        "--color-panel-inset": colors.inset,
        "--color-text": colors.text,
        "--color-accent": colors.accent,
        "--color-secondary": colors.accent,
        "--color-neutral-950": colors.background,
        "--color-neutral-900": colors.inset,
        "--color-neutral-800": colors.input,
        "--color-neutral-700": colors.border,
        "--color-neutral-600": colors.border,
        "--color-neutral-500": colors.muted,
        "--color-neutral-400": colors.muted,
        "--color-neutral-300": colors.text,
        "--color-neutral-200": colors.text,
        "--color-neutral-100": colors.text,
        "--color-neutral-50": colors.text,
        "--workspace-glow": `radial-gradient(ellipse at 95% 0%, ${colors.accent}14, transparent 55%)`,
        "--header-sheen": `linear-gradient(110deg, ${colors.accent}15, transparent 45%)`,
    };
}

export function contrastRatio(first: string, second: string) {
    const luminance = (hex: string) => {
        const rgb = [1, 3, 5]
            .map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255)
            .map((channel) =>
                channel <= 0.04045
                    ? channel / 12.92
                    : ((channel + 0.055) / 1.055) ** 2.4,
            );
        return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
    };
    const a = luminance(first),
        b = luminance(second);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function hslToHex(hue: number, saturation: number, lightness: number) {
    const s = saturation / 100;
    const l = lightness / 100;
    const chroma = (1 - Math.abs(2 * l - 1)) * s;
    const section = (((hue % 360) + 360) % 360) / 60;
    const x = chroma * (1 - Math.abs((section % 2) - 1));
    const [r, g, b] =
        section < 1
            ? [chroma, x, 0]
            : section < 2
              ? [x, chroma, 0]
              : section < 3
                ? [0, chroma, x]
                : section < 4
                  ? [0, x, chroma]
                  : section < 5
                    ? [x, 0, chroma]
                    : [chroma, 0, x];
    const m = l - chroma / 2;
    return `#${[r, g, b]
        .map((channel) =>
            Math.round((channel + m) * 255)
                .toString(16)
                .padStart(2, "0"),
        )
        .join("")}`;
}

export function generateRandomDarkPalette(): CustomColors {
    const random = new Uint16Array(1);
    crypto.getRandomValues(random);
    const hue = (random[0] / 65535) * 360;
    return {
        background: hslToHex(hue, 22, 6),
        panel: hslToHex(hue, 20, 10),
        inset: hslToHex(hue, 22, 8),
        input: hslToHex(hue, 18, 15),
        text: hslToHex(hue, 20, 95),
        muted: hslToHex(hue, 14, 72),
        accent: hslToHex(hue + 28, 78, 70),
        border: hslToHex(hue, 16, 28),
    };
}
