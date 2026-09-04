export const DEFAULT_SHORTCUTS = {
    slot1: "1",
    slot2: "2",
    slot3: "3",
    slot4: "4",
    slot5: "5",
    draft: "d",
    analysis: "a",
    strategy: "s",
    colors: "c",
    search: "/",
    blue: "b",
    red: "r",
    help: "?",
};
export type ShortcutAction = keyof typeof DEFAULT_SHORTCUTS;
export type ShortcutBindings = Record<ShortcutAction, string>;
export const SHORTCUT_ACTIONS = Object.keys(
    DEFAULT_SHORTCUTS,
) as ShortcutAction[];

export function validShortcutKey(value: unknown): value is string {
    return (
        typeof value === "string" &&
        (value === "" ||
            (value.length === 1 && value.trim() === value && !/\s/.test(value)))
    );
}

export function normalizeShortcuts(value: unknown): ShortcutBindings {
    if (!value || typeof value !== "object") return { ...DEFAULT_SHORTCUTS };
    const saved = value as Record<string, unknown>;
    const result = { ...DEFAULT_SHORTCUTS };
    const seen = new Set<string>();
    for (const action of SHORTCUT_ACTIONS) {
        const key = saved[action];
        if (!validShortcutKey(key)) return { ...DEFAULT_SHORTCUTS };
        const normalized = key.toLowerCase();
        if (normalized && seen.has(normalized)) return { ...DEFAULT_SHORTCUTS };
        if (normalized) seen.add(normalized);
        result[action] = normalized;
    }
    return result;
}
