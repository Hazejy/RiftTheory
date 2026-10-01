import type { Role } from "@rifttheory/core/src/models/Role";
import { DRAFT_PICK_ORDER } from "./draftOrder";

export const MANUAL_DRAFT_KEY = "rifttheory.manual-draft.v1";
export const MANUAL_DRAFT_BACKUP_KEY = "rifttheory.manual-draft.backup.v1";

export type SavedPick = { championKey: string | undefined; role: Role | undefined };
export type ManualDraft = { ally: SavedPick[]; opponent: SavedPick[] };

export function hasSavedPicks(board: ManualDraft): boolean {
    return [...board.ally, ...board.opponent].some((pick) => pick.championKey !== undefined);
}

export function nextManualDraftStep(board: ManualDraft) {
    return DRAFT_PICK_ORDER.find(({ team, index }) => !board[team][index]?.championKey);
}

export function serializeManualDraft(board: ManualDraft): string {
    return JSON.stringify({ version: 1, ally: board.ally, opponent: board.opponent });
}

export function parseManualDraft(raw: string | null): ManualDraft | undefined {
    if (!raw) return undefined;
    let value: unknown;
    try { value = JSON.parse(raw); } catch { return undefined; }
    if (!value || typeof value !== "object") return undefined;
    const record = value as Record<string, unknown>;
    if (record.version !== 1) return undefined;
    const used = new Set<string>();
    const parseTeam = (input: unknown): SavedPick[] | undefined => {
        if (!Array.isArray(input) || input.length !== 5) return undefined;
        const picks: SavedPick[] = [];
        for (const item of input) {
            if (!item || typeof item !== "object") return undefined;
            const pick = item as Record<string, unknown>;
            const key = pick.championKey ?? undefined;
            const role = pick.role ?? undefined;
            if (key !== undefined && (typeof key !== "string" || !/^\d{1,6}$/.test(key) || used.has(key))) return undefined;
            if (role !== undefined && (!Number.isInteger(role) || (role as number) < 0 || (role as number) > 4)) return undefined;
            if (key !== undefined) used.add(key as string);
            picks.push({ championKey: key as string | undefined, role: role as Role | undefined });
        }
        if (new Set(picks.map((pick) => pick.role).filter((role) => role !== undefined)).size !== picks.filter((pick) => pick.role !== undefined).length) return undefined;
        return picks;
    };
    const ally = parseTeam(record.ally);
    const opponent = parseTeam(record.opponent);
    return ally && opponent ? { ally, opponent } : undefined;
}
