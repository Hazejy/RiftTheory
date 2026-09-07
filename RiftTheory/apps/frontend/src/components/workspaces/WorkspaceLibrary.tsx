import { createMemo, createSignal, For, Show } from "solid-js";
import { useI18n } from "../../utils/i18n";
import { Icon, folder, trash, xMark } from "../icons/RiftIcons";

type WorkspaceKind = "draft-prep" | "rift-planner";
type StoredWorkspace<T> = {
    id: string;
    kind: WorkspaceKind;
    name: string;
    updatedAt: string;
    data: T;
};

const STORAGE_KEY = "rifttheory.workspace-library.v1";

function readLibrary<T>(): StoredWorkspace<T>[] {
    try {
        const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
        return Array.isArray(value) ? value : [];
    } catch {
        return [];
    }
}

function writeLibrary<T>(records: StoredWorkspace<T>[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export default function WorkspaceLibrary<T>(props: {
    kind: WorkspaceKind;
    getSnapshot: () => T;
    onOpen: (data: T) => void;
}) {
    const { t } = useI18n();
    const [open, setOpen] = createSignal(false);
    const [records, setRecords] = createSignal(readLibrary<T>());
    const [name, setName] = createSignal("");
    const [activeId, setActiveId] = createSignal<string>();
    const relevantRecords = createMemo(() =>
        records()
            .filter((record) => record.kind === props.kind)
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    );

    const commitRecords = (next: StoredWorkspace<T>[]) => {
        setRecords(next);
        writeLibrary(next);
    };

    const saveWorkspace = () => {
        const workspaceName = name().trim();
        if (!workspaceName) return;
        const id = activeId() ?? crypto.randomUUID();
        const nextRecord: StoredWorkspace<T> = {
            id,
            kind: props.kind,
            name: workspaceName,
            updatedAt: new Date().toISOString(),
            data: props.getSnapshot(),
        };
        commitRecords([
            ...records().filter((record) => record.id !== id),
            nextRecord,
        ]);
        setActiveId(id);
    };

    const openWorkspace = (record: StoredWorkspace<T>) => {
        props.onOpen(structuredClone(record.data));
        setActiveId(record.id);
        setName(record.name);
        setOpen(false);
    };

    const newWorkspace = () => {
        setActiveId(undefined);
        setName("");
    };

    const removeWorkspace = (id: string) => {
        commitRecords(records().filter((record) => record.id !== id));
        if (activeId() === id) newWorkspace();
    };

    return (
        <>
            <button
                type="button"
                class="flex items-center gap-2 rounded-lg border border-accent/60 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent hover:bg-accent/20"
                onClick={() => setOpen(true)}
            >
                <Icon path={folder} class="h-4 w-4" />
                {t("workspaceFiles")}
            </button>

            <Show when={open()}>
                <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                    <section class="flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-neutral-700 bg-primary shadow-2xl">
                        <header class="flex items-center justify-between border-b border-neutral-700 px-5 py-4">
                            <div>
                                <p class="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">
                                    {t("workspaceFiles")}
                                </p>
                                <h3 class="mt-1 text-xl font-semibold">
                                    {t("savedWorkspaces")}
                                </h3>
                            </div>
                            <button
                                type="button"
                                aria-label={t("close")}
                                class="rounded-lg border border-neutral-700 p-2 text-neutral-400 hover:text-white"
                                onClick={() => setOpen(false)}
                            >
                                <Icon path={xMark} class="h-4 w-4" />
                            </button>
                        </header>

                        <div class="grid min-h-0 flex-1 md:grid-cols-[minmax(0,1fr)_250px]">
                            <div class="overflow-y-auto p-4">
                                <For
                                    each={relevantRecords()}
                                    fallback={
                                        <div class="rounded-xl border border-dashed border-neutral-700 p-10 text-center text-sm text-neutral-500">
                                            {t("noSavedWorkspaces")}
                                        </div>
                                    }
                                >
                                    {(record) => (
                                        <article
                                            class="mb-2 flex items-center gap-3 rounded-xl border bg-canvas p-3 last:mb-0"
                                            classList={{
                                                "border-accent":
                                                    activeId() === record.id,
                                                "border-neutral-700":
                                                    activeId() !== record.id,
                                            }}
                                        >
                                            <span class="rounded-lg bg-accent/10 p-2 text-accent">
                                                <Icon
                                                    path={folder}
                                                    class="h-5 w-5"
                                                />
                                            </span>
                                            <button
                                                type="button"
                                                class="min-w-0 flex-1 text-left"
                                                onClick={() =>
                                                    openWorkspace(record)
                                                }
                                            >
                                                <span class="block truncate font-semibold">
                                                    {record.name}
                                                </span>
                                                <span class="mt-0.5 block text-[11px] text-neutral-600">
                                                    {t("lastUpdated")} ·{" "}
                                                    {new Date(
                                                        record.updatedAt,
                                                    ).toLocaleString()}
                                                </span>
                                            </button>
                                            <button
                                                type="button"
                                                aria-label={t("remove")}
                                                class="rounded-lg p-2 text-neutral-600 hover:bg-rose-500/10 hover:text-rose-400"
                                                onClick={() =>
                                                    removeWorkspace(record.id)
                                                }
                                            >
                                                <Icon
                                                    path={trash}
                                                    class="h-4 w-4"
                                                />
                                            </button>
                                        </article>
                                    )}
                                </For>
                            </div>

                            <aside class="border-t border-neutral-700 bg-canvas/50 p-4 md:border-l md:border-t-0">
                                <label class="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                                    {t("workspaceName")}
                                </label>
                                <input
                                    class="mt-2 w-full rounded-lg border border-neutral-700 bg-primary px-3 py-2 text-sm outline-none focus:border-accent"
                                    value={name()}
                                    placeholder={t("workspaceName")}
                                    onInput={(event) =>
                                        setName(event.currentTarget.value)
                                    }
                                />
                                <button
                                    type="button"
                                    disabled={!name().trim()}
                                    class="mt-3 w-full rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-neutral-950 disabled:opacity-40"
                                    onClick={saveWorkspace}
                                >
                                    {activeId()
                                        ? t("updateWorkspace")
                                        : t("saveNewWorkspace")}
                                </button>
                                <button
                                    type="button"
                                    class="mt-2 w-full rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-400 hover:text-white"
                                    onClick={newWorkspace}
                                >
                                    {t("newWorkspace")}
                                </button>
                                <p class="mt-4 text-xs leading-relaxed text-neutral-600">
                                    {t("workspaceLibraryHint")}
                                </p>
                            </aside>
                        </div>
                    </section>
                </div>
            </Show>
        </>
    );
}
