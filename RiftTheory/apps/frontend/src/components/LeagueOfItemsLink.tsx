import { Icon, globeAlt } from "./icons/RiftIcons";
import { cn } from "../utils/style";
import { buttonVariants } from "./common/Button";

export function LeagueOfItemsLink() {
    return (
        <a
            href="https://leagueofitems.com"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="League of Items"
            title="League of Items"
            class={cn(
                buttonVariants({ variant: "transparent" }),
                "px-1 py-2 inline-flex items-center justify-center",
            )}
        >
            <Icon path={globeAlt} class="w-7 h-7" aria-hidden="true" />
        </a>
    );
}
