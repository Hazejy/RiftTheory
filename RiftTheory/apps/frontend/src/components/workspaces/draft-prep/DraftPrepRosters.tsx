import { ROLES, Role } from "@draftgap/core/src/models/Role";
import { For, Setter } from "solid-js";
import { useI18n } from "../../../utils/i18n";
import { RoleIcon } from "../../icons/roles/RoleIcon";
import { Icon, trash } from "../../icons/RiftIcons";
import { createPrepPlayer, PrepDocument, PrepPlayer } from "./model";

export default function DraftPrepRosters(props: {
    document: PrepDocument;
    setDocument: Setter<PrepDocument>;
}) {
    const { t, roleName } = useI18n();

    const updatePlayer = (
        playerId: string,
        update: (player: PrepPlayer) => PrepPlayer,
    ) =>
        props.setDocument((current) => ({
            ...current,
            players: current.players.map((player) =>
                player.id === playerId ? update(player) : player,
            ),
        }));

    const addPlayer = () =>
        props.setDocument((current) => ({
            ...current,
            players: [...current.players, createPrepPlayer(Role.Support)],
        }));

    const removePlayer = (playerId: string) =>
        props.setDocument((current) => ({
            ...current,
            players: current.players.filter((player) => player.id !== playerId),
        }));

    return (
        <section class="mx-auto max-w-6xl rounded-xl border border-neutral-700 bg-primary/60 p-5">
            <div class="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 class="text-xl font-semibold">{t("teamRoster")}</h3>
                    <p class="mt-1 text-sm text-neutral-500">
                        {t("teamRosterHint")}
                    </p>
                </div>
                <button
                    type="button"
                    class="rounded-lg border border-accent/50 bg-accent/10 px-3 py-2 text-sm font-semibold text-accent"
                    onClick={addPlayer}
                >
                    + {t("addRosterMember")}
                </button>
            </div>
            <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <For each={props.document.players}>
                    {(player) => (
                        <article class="relative rounded-xl border border-neutral-700 bg-canvas p-4 focus-within:border-accent">
                            <label class="flex items-center gap-2">
                                <RoleIcon
                                    role={player.role}
                                    class="h-5 w-5 fill-current text-accent"
                                />
                                <select
                                    class="min-w-0 flex-1 bg-transparent text-xs font-semibold uppercase tracking-wider text-neutral-400 outline-none"
                                    value={player.role}
                                    onChange={(event) =>
                                        updatePlayer(player.id, (current) => ({
                                            ...current,
                                            role: Number(
                                                event.currentTarget.value,
                                            ) as Role,
                                        }))
                                    }
                                >
                                    <For each={ROLES}>
                                        {(role) => (
                                            <option value={role}>
                                                {roleName(role)}
                                            </option>
                                        )}
                                    </For>
                                </select>
                            </label>
                            <input
                                class="mt-4 w-full border-b border-neutral-700 bg-transparent pb-2 text-base font-semibold outline-none placeholder:text-neutral-700 focus:border-accent"
                                placeholder={t("playerName")}
                                value={player.name}
                                onBlur={(event) =>
                                    updatePlayer(player.id, (current) => ({
                                        ...current,
                                        name: event.currentTarget.value,
                                    }))
                                }
                            />
                            <button
                                type="button"
                                aria-label={t("removeRosterMember")}
                                class="absolute right-2 top-2 rounded-md p-1.5 text-neutral-700 hover:bg-rose-500/10 hover:text-rose-400"
                                onClick={() => removePlayer(player.id)}
                            >
                                <Icon path={trash} class="h-3.5 w-3.5" />
                            </button>
                        </article>
                    )}
                </For>
            </div>
        </section>
    );
}
