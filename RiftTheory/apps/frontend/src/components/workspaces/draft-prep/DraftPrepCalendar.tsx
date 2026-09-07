import { createMemo, createSignal, For, Setter, Show } from "solid-js";
import { useI18n } from "../../../utils/i18n";
import { PrepDocument } from "./model";

function dateKey(date: Date) {
    return date.toISOString().slice(0, 10);
}

function nextDays(count: number) {
    const start = new Date();
    start.setHours(12, 0, 0, 0);
    return Array.from({ length: count }, (_, offset) => {
        const date = new Date(start);
        date.setDate(start.getDate() + offset);
        return date;
    });
}

export default function DraftPrepCalendar(props: {
    document: PrepDocument;
    setDocument: Setter<PrepDocument>;
}) {
    const { t } = useI18n();
    const days = createMemo(() => nextDays(21));
    const [title, setTitle] = createSignal("");
    const [opponent, setOpponent] = createSignal("");
    const [date, setDate] = createSignal(dateKey(new Date()));
    const [time, setTime] = createSignal("18:00");

    const cycleAvailability = (key: string) =>
        props.setDocument((current) => {
            const state = current.availability[key];
            const availability = { ...current.availability };
            if (!state) availability[key] = "available";
            else if (state === "available") availability[key] = "unavailable";
            else delete availability[key];
            return { ...current, availability };
        });

    const addBooking = () => {
        if (!title().trim()) return;
        props.setDocument((current) => ({
            ...current,
            bookings: [
                ...current.bookings,
                {
                    id: crypto.randomUUID(),
                    title: title().trim(),
                    opponent: opponent().trim(),
                    date: date(),
                    time: time(),
                },
            ],
        }));
        setTitle("");
        setOpponent("");
    };

    return (
        <div class="grid min-h-[650px] gap-4 xl:grid-cols-[minmax(0,1fr)_330px]">
            <main>
                <div class="mb-4">
                    <h3 class="text-xl font-semibold">{t("availability")}</h3>
                    <p class="mt-1 text-sm text-neutral-500">
                        {t("available")} / {t("unavailable")}
                    </p>
                </div>
                <div class="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
                    <For each={days()}>
                        {(day) => {
                            const key = dateKey(day);
                            const state = () =>
                                props.document.availability[key];
                            return (
                                <button
                                    type="button"
                                    class="min-h-32 rounded-xl border bg-primary/60 p-3 text-left transition-colors"
                                    classList={{
                                        "border-neutral-700 hover:border-neutral-500":
                                            !state(),
                                        "border-emerald-500 bg-emerald-500/10":
                                            state() === "available",
                                        "border-rose-500 bg-rose-500/10":
                                            state() === "unavailable",
                                    }}
                                    onClick={() => cycleAvailability(key)}
                                >
                                    <span class="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                                        {day.toLocaleDateString(undefined, {
                                            weekday: "short",
                                        })}
                                    </span>
                                    <span class="mt-1 block text-lg font-semibold">
                                        {day.toLocaleDateString(undefined, {
                                            day: "2-digit",
                                            month: "2-digit",
                                        })}
                                    </span>
                                    <Show when={state()}>
                                        {(value) => (
                                            <span class="mt-8 block text-xs font-semibold uppercase">
                                                {t(value())}
                                            </span>
                                        )}
                                    </Show>
                                </button>
                            );
                        }}
                    </For>
                </div>
            </main>
            <aside class="h-fit rounded-xl border border-neutral-700 bg-primary p-4 xl:sticky xl:top-16">
                <h3 class="font-semibold">{t("bookings")}</h3>
                <div class="mt-3 grid gap-2">
                    <input
                        class="rounded-lg border border-neutral-700 bg-canvas px-3 py-2 text-sm outline-none focus:border-accent"
                        placeholder={t("bookingTitle")}
                        value={title()}
                        onInput={(event) => setTitle(event.currentTarget.value)}
                    />
                    <input
                        class="rounded-lg border border-neutral-700 bg-canvas px-3 py-2 text-sm outline-none focus:border-accent"
                        placeholder={t("opponentName")}
                        value={opponent()}
                        onInput={(event) =>
                            setOpponent(event.currentTarget.value)
                        }
                    />
                    <div class="grid grid-cols-2 gap-2">
                        <input
                            type="date"
                            class="rounded-lg border border-neutral-700 bg-canvas px-2 py-2 text-sm outline-none focus:border-accent"
                            value={date()}
                            onInput={(event) =>
                                setDate(event.currentTarget.value)
                            }
                        />
                        <input
                            type="time"
                            class="rounded-lg border border-neutral-700 bg-canvas px-2 py-2 text-sm outline-none focus:border-accent"
                            value={time()}
                            onInput={(event) =>
                                setTime(event.currentTarget.value)
                            }
                        />
                    </div>
                    <button
                        type="button"
                        class="rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-neutral-950"
                        onClick={() => addBooking()}
                    >
                        + {t("addBooking")}
                    </button>
                </div>
                <div class="mt-4 grid gap-2">
                    <For
                        each={props.document.bookings}
                        fallback={
                            <p class="text-xs text-neutral-600">
                                {t("noBookings")}
                            </p>
                        }
                    >
                        {(booking) => (
                            <article class="rounded-lg border border-neutral-700 bg-canvas p-3">
                                <div class="flex items-start justify-between gap-2">
                                    <div>
                                        <p class="font-semibold">
                                            {booking.title}
                                        </p>
                                        <p class="text-xs text-neutral-500">
                                            {booking.opponent || "—"}
                                        </p>
                                        <p class="mt-2 text-xs text-accent">
                                            {booking.date} · {booking.time}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        class="text-xs text-neutral-600 hover:text-rose-400"
                                        onClick={() =>
                                            props.setDocument((current) => ({
                                                ...current,
                                                bookings:
                                                    current.bookings.filter(
                                                        (entry) =>
                                                            entry.id !==
                                                            booking.id,
                                                    ),
                                            }))
                                        }
                                    >
                                        {t("remove")}
                                    </button>
                                </div>
                            </article>
                        )}
                    </For>
                </div>
            </aside>
        </div>
    );
}
