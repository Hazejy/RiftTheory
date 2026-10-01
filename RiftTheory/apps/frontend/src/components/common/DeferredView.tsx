import { Component, createSignal, onCleanup, onMount, Show } from "solid-js";
import { Dynamic } from "solid-js/web";

/** Loads a workspace once without letting its own async data hide the entire view. */
export function deferredView(name: string, load: () => Promise<{ default: Component }>): Component {
    let cached: Component | undefined;
    return () => {
        const [view, setView] = createSignal<Component | undefined>(cached);
        const [failed, setFailed] = createSignal(false);
        let active = true;
        const request = () => {
            setFailed(false);
            void load().then((module) => {
                cached = module.default;
                if (active) setView(() => module.default);
            }).catch(() => { if (active) setFailed(true); });
        };
        onMount(() => { if (!cached) request(); });
        onCleanup(() => { active = false; });
        return <Show when={view()} fallback={failed()
            ? <p role="alert" class="px-4 py-4">{name} could not be loaded. <button type="button" class="underline" onClick={request}>Retry</button></p>
            : <p role="status" class="px-4 py-4">Loading {name}…</p>}>
            {(resolved) => <Dynamic component={resolved()} />}
        </Show>;
    };
}
