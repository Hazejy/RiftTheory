import type { Role } from "@rifttheory/core/src/models/Role";
import type { Team } from "@rifttheory/core/src/models/Team";

export function createLiveRoleOverrides() {
    const overrides = new Map<string, { championKey: string; role: Role | undefined }>();
    const key = (team: Team, index: number) => `${team}:${index}`;

    return {
        set(team: Team, index: number, championKey: string, role: Role | undefined) {
            overrides.set(key(team, index), { championKey, role });
        },
        resolve(team: Team, index: number, championKey: string, assignedRole: Role | undefined) {
            const slot = key(team, index);
            const override = overrides.get(slot);
            if (!override) return assignedRole;
            if (override.championKey !== championKey) {
                overrides.delete(slot);
                return assignedRole;
            }
            return override.role;
        },
        clear() {
            overrides.clear();
        },
    };
}
