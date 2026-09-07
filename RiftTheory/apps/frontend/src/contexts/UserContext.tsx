import {
    JSXElement,
    createContext,
    createEffect,
    createSignal,
    useContext,
} from "solid-js";
import { createStore } from "solid-js/store";
import { Role } from "@draftgap/core/src/models/Role";
import { DraftGapConfig } from "@draftgap/core/src/models/user/Config";
import {
    AppearancePreferences,
    normalizeAppearance,
} from "../utils/appearance";

type RiftTheoryConfig = DraftGapConfig & AppearancePreferences;
import { DEFAULT_CUSTOM_COLORS } from "../utils/customTheme";

type FavouritePick = `${string}:${Role}`;

const DEFAULT_CONFIG: RiftTheoryConfig = {
    // DRAFT CONFIG
    ignoreChampionWinrates: false,
    riskLevel: "medium",
    minGames: 1000,

    // UI
    showFavouritesAtTop: false,
    banPlacement: "bottom",
    unownedPlacement: "bottom",
    showAdvancedWinrates: false,
    language: "en_US",
    fontPreset: "inter",
    theme: "obsidian",
    customColors: { ...DEFAULT_CUSTOM_COLORS },

    // MISC
    defaultStatsSite: "lolalytics",
    enableBetaFeatures: false,

    // LOL CLIENT
    disableLeagueClientIntegration: false,
};

const FAVOURITE_PICKS_KEY = "rifttheory-favourite-picks";
const CONFIG_KEY = "rifttheory-config";
const LEAGUE_SYNC_DEFAULT_MIGRATION_KEY =
    "rifttheory-league-sync-default-enabled-v1";

function createConfig() {
    let partialInitialConfig: Partial<RiftTheoryConfig> = {};
    try {
        const saved = JSON.parse(
            localStorage.getItem(CONFIG_KEY) ??
                localStorage.getItem("draftos-config") ??
                "{}",
        );
        if (saved && typeof saved === "object" && !Array.isArray(saved))
            partialInitialConfig = saved;
    } catch {
        // An invalid stored preference must not prevent the workspace from opening.
    }

    // Previous builds stored sync as disabled without the user choosing it.
    if (!localStorage.getItem(LEAGUE_SYNC_DEFAULT_MIGRATION_KEY)) {
        partialInitialConfig.disableLeagueClientIntegration = false;
        localStorage.setItem(LEAGUE_SYNC_DEFAULT_MIGRATION_KEY, "true");
    }

    const [config, setConfig] = createStore<RiftTheoryConfig>({
        ...DEFAULT_CONFIG,
        ...partialInitialConfig,
        ...normalizeAppearance(partialInitialConfig),
    });
    createEffect(() => {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    });

    return [config, setConfig] as const;
}

function createFavouritePicks() {
    const favouriteInitial =
        localStorage.getItem(FAVOURITE_PICKS_KEY) ??
        localStorage.getItem("draftos-favourite-picks");
    const favouriteInitialParsed = JSON.parse(favouriteInitial || "[]");

    const [favouritePicks, setFavouritePicks] = createSignal<
        Set<FavouritePick>
    >(new Set(favouriteInitialParsed));
    createEffect(() => {
        localStorage.setItem(
            FAVOURITE_PICKS_KEY,
            JSON.stringify([...favouritePicks()]),
        );
    });

    return [favouritePicks, setFavouritePicks] as const;
}

function createUserContext() {
    const [config, setConfig] = createConfig();
    const [favouritePicks, setFavouritePicks] = createFavouritePicks();

    function setFavourite(championKey: string, role: Role, value: boolean) {
        const favouritePick: FavouritePick = `${championKey}:${role}`;
        const newFavourites = new Set(favouritePicks());

        if (value) {
            newFavourites.add(favouritePick);
        } else {
            newFavourites.delete(favouritePick);
        }

        setFavouritePicks(newFavourites);
    }

    const isFavourite = (championKey: string, role: Role) => {
        const favouritePick: FavouritePick = `${championKey}:${role}`;

        return favouritePicks().has(favouritePick);
    };

    return {
        config,
        setConfig,
        favouritePicks,
        setFavourite,
        isFavourite,
    };
}

const UserContext =
    createContext<ReturnType<typeof createUserContext>>(undefined);

export function UserProvider(props: { children: JSXElement }) {
    const ctx = createUserContext();

    return (
        <UserContext.Provider value={ctx}>
            {props.children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const useCtx = useContext(UserContext);
    if (!useCtx) throw new Error("No UserContext found");

    return useCtx;
}
