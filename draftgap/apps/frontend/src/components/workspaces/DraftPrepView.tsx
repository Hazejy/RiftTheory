import { createSignal, For, Match, Switch } from "solid-js";
import { useI18n } from "../../utils/i18n";
import {
    Icon,
    calendar,
    colorLayers,
    prepBoard,
    users,
} from "../icons/RiftIcons";
import DraftPrepBoard from "./draft-prep/DraftPrepBoard";
import DraftPrepCalendar from "./draft-prep/DraftPrepCalendar";
import DraftPrepPools from "./draft-prep/DraftPrepPools";
import DraftPrepRosters from "./draft-prep/DraftPrepRosters";
import {
    copyPrepDocument,
    emptyPrepDocument,
    PrepDocument,
    PrepSection,
} from "./draft-prep/model";
import WorkspaceLibrary from "./WorkspaceLibrary";

const SECTIONS = [
    { id: "board", label: "prepBoard", icon: prepBoard },
    { id: "rosters", label: "rosters", icon: users },
    { id: "pools", label: "championPools", icon: colorLayers },
    { id: "calendar", label: "calendar", icon: calendar },
] as const;

export default function DraftPrepView() {
    const { t } = useI18n();
    const [section, setSection] = createSignal<PrepSection>("board");
    const [document, setDocument] =
        createSignal<PrepDocument>(emptyPrepDocument());

    return (
        <div class="h-full overflow-y-auto px-4 py-5 xl:px-8">
            <div class="mx-auto max-w-[1700px]">
                <header class="mb-4 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p class="text-xs uppercase tracking-[0.2em] text-accent">
                            {t("teamWorkspace")}
                        </p>
                        <h2 class="mt-1 text-3xl font-semibold">
                            {t("draftPrep")}
                        </h2>
                        <p class="mt-2 max-w-3xl text-sm text-neutral-400">
                            {t("draftPrepIntro")}
                        </p>
                    </div>
                    <WorkspaceLibrary
                        kind="draft-prep"
                        getSnapshot={() => copyPrepDocument(document())}
                        onOpen={(savedDocument) =>
                            setDocument(copyPrepDocument(savedDocument))
                        }
                    />
                </header>

                <nav class="mb-4 flex max-w-full gap-1 overflow-x-auto rounded-xl border border-neutral-700 bg-primary p-1">
                    <For each={SECTIONS}>
                        {(item) => (
                            <button
                                type="button"
                                class="flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
                                classList={{
                                    "bg-accent text-neutral-950":
                                        section() === item.id,
                                    "text-neutral-400 hover:bg-neutral-800 hover:text-white":
                                        section() !== item.id,
                                }}
                                onClick={() => setSection(item.id)}
                            >
                                <Icon path={item.icon} class="h-4 w-4" />
                                {t(item.label)}
                            </button>
                        )}
                    </For>
                </nav>

                <Switch>
                    <Match when={section() === "board"}>
                        <DraftPrepBoard
                            document={document()}
                            setDocument={setDocument}
                        />
                    </Match>
                    <Match when={section() === "rosters"}>
                        <DraftPrepRosters
                            document={document()}
                            setDocument={setDocument}
                        />
                    </Match>
                    <Match when={section() === "pools"}>
                        <DraftPrepPools
                            document={document()}
                            setDocument={setDocument}
                        />
                    </Match>
                    <Match when={section() === "calendar"}>
                        <DraftPrepCalendar
                            document={document()}
                            setDocument={setDocument}
                        />
                    </Match>
                </Switch>
            </div>
        </div>
    );
}
