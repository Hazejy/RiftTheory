type SnapshotPick = {
    slot: string;
    name: string;
    role: string;
    portrait?: string;
};
export type DraftSnapshot = {
    blueLabel: string;
    redLabel: string;
    winrateLabel: string;
    blueWinrate?: number;
    redWinrate?: number;
    patchLabel: string;
    picks: SnapshotPick[];
    background: string;
    panel: string;
    text: string;
    muted: string;
    accent: string;
    font: string;
};

function loadPortrait(url?: string): Promise<HTMLImageElement | undefined> {
    if (!url) return Promise.resolve(undefined);
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        const finish = (result?: HTMLImageElement) => {
            clearTimeout(timeout);
            img.onload = null;
            img.onerror = null;
            resolve(result);
        };
        const timeout = window.setTimeout(() => finish(), 5000);
        img.onload = () => finish(img);
        img.onerror = () => finish();
        img.src = url;
    });
}

// A shareable draft-only image, not a screen capture of menus or private browser UI.
export async function downloadDraftSnapshot(snapshot: DraftSnapshot) {
    const portraits = await Promise.all(
        snapshot.picks.map((pick) => loadPortrait(pick.portrait)),
    );
    await document.fonts.ready;
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 850;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    const text = (
        value: string,
        x: number,
        y: number,
        size: number,
        color: string,
        maxWidth = 490,
    ) => {
        context.fillStyle = color;
        context.font = `600 ${size}px ${snapshot.font}`;
        let clipped = value;
        while (
            clipped.length > 1 &&
            context.measureText(clipped).width > maxWidth
        )
            clipped = clipped.slice(0, -1);
        context.fillText(
            clipped === value ? value : clipped.slice(0, -1) + "…",
            x,
            y,
        );
    };
    context.fillStyle = snapshot.background;
    context.fillRect(0, 0, 1200, 850);
    text("RiftTheory", 42, 58, 30, snapshot.accent);
    text(snapshot.patchLabel, 42, 88, 13, snapshot.muted, 1100);
    text(snapshot.blueLabel, 42, 139, 22, "#60a5fa");
    text(snapshot.redLabel, 622, 139, 22, "#fb7185");
    text(snapshot.winrateLabel, 42, 162, 11, snapshot.muted);
    text(snapshot.winrateLabel, 622, 162, 11, snapshot.muted);
    text(
        snapshot.blueWinrate === undefined
            ? "—"
            : `${(snapshot.blueWinrate * 100).toFixed(2)}%`,
        42,
        188,
        22,
        "#60a5fa",
    );
    text(
        snapshot.redWinrate === undefined
            ? "—"
            : `${(snapshot.redWinrate * 100).toFixed(2)}%`,
        622,
        188,
        22,
        "#fb7185",
    );
    snapshot.picks.forEach((pick, index) => {
        const x = index < 5 ? 40 : 620;
        const y = 204 + (index % 5) * 116;
        context.fillStyle = snapshot.panel;
        context.fillRect(x, y, 540, 104);
        context.fillStyle = index < 5 ? "#60a5fa" : "#fb7185";
        context.fillRect(x, y, 3, 104);
        const portrait = portraits[index];
        if (portrait) context.drawImage(portrait, x + 16, y + 12, 80, 80);
        else {
            context.strokeStyle = snapshot.muted;
            context.strokeRect(x + 16, y + 12, 80, 80);
            text(pick.slot, x + 31, y + 61, 23, snapshot.muted, 70);
        }
        text(pick.slot, x + 112, y + 24, 12, snapshot.muted);
        text(pick.name, x + 112, y + 56, 23, snapshot.text, 408);
        text(pick.role, x + 112, y + 81, 13, snapshot.muted, 408);
    });
    text(
        "RiftTheory · " + new Date().toLocaleString(),
        42,
        827,
        12,
        snapshot.muted,
        1100,
    );
    const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
            (value) =>
                value ? resolve(value) : reject(new Error("PNG export failed")),
            "image/png",
        ),
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rifttheory-draft-${new Date().toISOString().replace(/[:.]/g, "-")}.png`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 30000);
    return snapshot.picks.filter(
        (pick, index) => pick.portrait && !portraits[index],
    ).length;
}
