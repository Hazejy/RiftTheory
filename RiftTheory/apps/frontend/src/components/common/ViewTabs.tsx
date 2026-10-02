import { createEffect, For, Show } from "solid-js";
import { Icon } from "../icons/RiftIcons";
import { ComponentProps } from "solid-js";
import { cn } from "../../utils/style";

type Props<T> = {
    tabs: readonly {
        value: T;
        label: string;
        icon?: ComponentProps<typeof Icon>["path"];
        disabled?: boolean;
        disabledReason?: string;
    }[];
    selected: T;
    onChange: (tab: T) => void;
    class?: string;
    equals?: (a: T, b: T) => boolean;
};

export const ViewTabs = <T,>(props: Props<T>) => {
    let tabList!: HTMLDivElement;
    createEffect(() => {
        void props.selected;
        requestAnimationFrame(() =>
            tabList
                .querySelector<HTMLElement>('[aria-pressed="true"]')
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "nearest",
                    inline: "nearest",
                }),
        );
    });

    return (
        <div
            ref={tabList}
            class={cn(
                "rt-view-tabs bg-primary w-full border-b border-neutral-700",
                props.class,
            )}
        >
            <For each={props.tabs}>
                {(tab) => (
                    <button
                        type="button"
                        disabled={tab.disabled}
                        title={tab.disabled ? tab.disabledReason : undefined}
                        aria-pressed={
                            props.equals
                                ? props.equals(tab.value, props.selected)
                                : tab.value === props.selected
                        }
                        class={cn(
                            "rt-view-tab px-4 py-3 text-neutral-400 uppercase font-semibold hover:text-neutral-200 transition-colors focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-40 disabled:cursor-not-allowed",
                            {
                                "text-neutral-50 hover:text-neutral-50":
                                    props.equals
                                        ? props.equals(
                                              tab.value,
                                              props.selected,
                                          )
                                        : tab.value === props.selected,
                            },
                        )}
                        onClick={() => { if (!tab.disabled) props.onChange(tab.value); }}
                    >
                        <Show when={tab.icon}>
                            {(icon) => (
                                <Icon path={icon()} class="h-4 w-4 shrink-0" />
                            )}
                        </Show>
                        {tab.label}
                    </button>
                )}
            </For>
        </div>
    );
};
