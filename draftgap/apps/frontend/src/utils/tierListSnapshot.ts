export type TierSnapshotItem = {
    label: string;
    imageUrl?: string;
    detail?: string;
};

export type TierSnapshotRow = {
    label: string;
    color: string;
    items: TierSnapshotItem[];
};

const WIDTH = 1600;
const PADDING = 56;
const LABEL_WIDTH = 150;
const CARD_WIDTH = 112;
const CARD_HEIGHT = 128;
const GAP = 12;

function loadImage(url: string) {
    return new Promise<HTMLImageElement | undefined>((resolve) => {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => resolve(image);
        image.onerror = () => resolve(undefined);
        image.src = url;
    });
}

function roundedRect(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
) {
    context.beginPath();
    context.roundRect(x, y, width, height, radius);
}

export async function downloadTierListSnapshot(
    title: string,
    rows: TierSnapshotRow[],
) {
    const contentWidth = WIDTH - PADDING * 2 - LABEL_WIDTH;
    const columns = Math.max(
        1,
        Math.floor((contentWidth + GAP) / (CARD_WIDTH + GAP)),
    );
    const rowHeights = rows.map((row) =>
        Math.max(
            150,
            Math.ceil(Math.max(1, row.items.length) / columns) *
                (CARD_HEIGHT + GAP) +
                24,
        ),
    );
    const height =
        150 + rowHeights.reduce((sum, value) => sum + value, 0) + PADDING;
    const canvas = document.createElement("canvas");
    canvas.width = WIDTH;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is unavailable");

    context.fillStyle = "#101216";
    context.fillRect(0, 0, WIDTH, height);
    context.fillStyle = "#f5f7fa";
    context.font = "700 42px Inter, Arial, sans-serif";
    context.fillText(title, PADDING, 72);
    context.fillStyle = "#88919f";
    context.font = "500 17px Inter, Arial, sans-serif";
    context.fillText("RiftTheory · Tier List", PADDING, 105);

    const imageEntries = rows.flatMap((row) =>
        row.items.filter((item) => item.imageUrl),
    );
    const images = await Promise.all(
        imageEntries.map((item) => loadImage(item.imageUrl!)),
    );
    const imageMap = new Map(
        imageEntries.map((item, index) => [item.imageUrl!, images[index]]),
    );

    let y = 132;
    rows.forEach((row, rowIndex) => {
        const rowHeight = rowHeights[rowIndex];
        context.fillStyle = "#171a20";
        context.fillRect(
            PADDING + LABEL_WIDTH,
            y,
            WIDTH - PADDING * 2 - LABEL_WIDTH,
            rowHeight,
        );
        context.fillStyle = row.color;
        context.fillRect(PADDING, y, LABEL_WIDTH, rowHeight);
        context.fillStyle = "#090b0f";
        context.font = "800 34px Inter, Arial, sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText(
            row.label,
            PADDING + LABEL_WIDTH / 2,
            y + rowHeight / 2,
        );
        context.textAlign = "left";
        context.textBaseline = "alphabetic";

        row.items.forEach((item, itemIndex) => {
            const column = itemIndex % columns;
            const line = Math.floor(itemIndex / columns);
            const x = PADDING + LABEL_WIDTH + 18 + column * (CARD_WIDTH + GAP);
            const itemY = y + 12 + line * (CARD_HEIGHT + GAP);
            roundedRect(context, x, itemY, CARD_WIDTH, CARD_HEIGHT, 9);
            context.fillStyle = "#222630";
            context.fill();
            const image = item.imageUrl
                ? imageMap.get(item.imageUrl)
                : undefined;
            if (image) {
                context.save();
                roundedRect(context, x, itemY, CARD_WIDTH, 92, 9);
                context.clip();
                context.drawImage(image, x, itemY, CARD_WIDTH, 92);
                context.restore();
            }
            context.fillStyle = "#f5f7fa";
            context.font = "600 14px Inter, Arial, sans-serif";
            context.textAlign = "center";
            context.fillText(
                item.label.slice(0, 15),
                x + CARD_WIDTH / 2,
                itemY + 111,
            );
            if (item.detail) {
                context.fillStyle = "#9098a5";
                context.font = "500 11px Inter, Arial, sans-serif";
                context.fillText(item.detail, x + CARD_WIDTH / 2, itemY + 124);
            }
            context.textAlign = "left";
        });
        y += rowHeight;
    });

    const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
            (value) =>
                value ? resolve(value) : reject(new Error("PNG export failed")),
            "image/png",
        ),
    );
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `rifttheory-tier-list-${new Date().toISOString().slice(0, 10)}.png`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(href), 1000);
}
