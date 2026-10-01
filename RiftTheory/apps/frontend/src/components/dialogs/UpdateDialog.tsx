import { createSignal, onMount, Show } from "solid-js";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export function UpdateDialog() {
    const [update, setUpdate] = createSignal<Update | null>(null);
    const [status, setStatus] = createSignal("Update status has not been checked.");
    const [busy, setBusy] = createSignal(false);

    const checkForUpdate = async () => {
        if (busy()) return;
        setBusy(true);
        setStatus("Checking for updates…");
        try {
            const available = await check();
            setUpdate(available);
            setStatus(available ? `Version ${available.version} is available.` : "RiftTheory is up to date.");
        } catch {
            setUpdate(null);
            setStatus("Update check failed. Check your connection and try again.");
        } finally {
            setBusy(false);
        }
    };

    const installUpdate = async () => {
        const available = update();
        if (!available || busy()) return;
        setBusy(true);
        setStatus(`Downloading version ${available.version}…`);
        try {
            await available.downloadAndInstall((event) => {
                if (event.event === "Finished") setStatus("Installing update…");
            });
            setStatus("Restarting RiftTheory…");
            await relaunch();
        } catch {
            setStatus("Update failed. Your current version remains installed. Try again later.");
            setBusy(false);
        }
    };

    onMount(() => { void checkForUpdate(); });

    return (
        <section aria-label="App updates">
            <h3 class="text-3xl uppercase">App updates</h3>
            <p role="status" class="mt-2 text-sm text-neutral-300">{status()}</p>
            <div class="mt-3 flex flex-wrap gap-2">
                <button type="button" class="rounded border border-neutral-600 px-3 py-2 disabled:opacity-50" disabled={busy()} onClick={checkForUpdate}>Check again</button>
                <Show when={update()}>
                    <button type="button" class="rounded bg-white px-3 py-2 text-primary disabled:opacity-50" disabled={busy()} onClick={installUpdate}>Download and install</button>
                </Show>
            </div>
        </section>
    );
}
