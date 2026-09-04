import { JSX, splitProps } from "solid-js";

// RiftTheory's original 24px icon grid: clipped corners, open lines and facets.
// Each access creates fresh SVG nodes; definitions are safe to reuse in Solid lists.
function glyph(d: string, filled = false) {
    return {
        outline: true,
        mini: false,
        get path() {
            return <path d={d} fill={filled ? "currentColor" : "none"} />;
        },
    };
}

type Props = JSX.SvgSVGAttributes<SVGSVGElement> & {
    path: { path: JSX.Element };
};

export function Icon(props: Props) {
    const [local, svgProps] = splitProps(props, ["path", "children"]);
    return (
        <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.65"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
            {...svgProps}
        >
            {local.path.path}
        </svg>
    );
}

export const riftMark = glyph(
    "M4 5 10 3 8 10 3 17 9 15 7 21 M14 3 21 6 16 12 21 18 14 21 16 14 11 12Z",
);
export const draftBoard = glyph(
    "M3 4h7v6H3z M14 14h7v6h-7z M15 4h6v6 M3 14v6h6 M9 15l6-6",
);
export const strategy = glyph("M4 18 12 4l8 14-8-3Z M12 4v11 M4 18v3 M20 18v3");
export const colorLayers = glyph(
    "m12 3 9 5-9 5-9-5Z M3 12l9 5 9-5 M3 16l9 5 9-5",
);
export const itemCube = glyph(
    "m12 3 8 4v10l-8 4-8-4V7Z M4 7l8 5 8-5 M12 12v9 M8 5l8 5",
);
export const cog_6Tooth = glyph(
    "M4 6h16 M4 12h16 M4 18h16 M8 3v6 M16 9v6 M10 15v6",
);
export const ellipsisVertical = glyph(
    "M5 5h5v5H5z M14 5h5v5h-5z M5 14h5v5H5z M14 14h5v5h-5z",
);
export const trash = glyph(
    "M4 6h16 M9 6V3h6v3 M6 9l1 11h10l1-11 M10 10v6 M14 10v6",
);
export const magnifyingGlass = glyph("m10 3 6 3v7l-6 3-6-3V6Z M15 15l6 6");
export const xMark = glyph("M6 6l12 12 M18 6 6 18");
export const funnel = glyph("M3 5h18l-7 8v6l-4 2v-8Z M8 5h8");
export const informationCircle = glyph(
    "m12 2 9 5v10l-9 5-9-5V7Z M12 11v6 M12 7v.2",
);
export const questionMarkCircle = glyph(
    "m12 2 9 5v10l-9 5-9-5V7Z M9 8l3-2 3 2v3l-3 2 M12 17v.2",
);
export const exclamationCircle = glyph(
    "m12 2 9 5v10l-9 5-9-5V7Z M12 6v7 M12 17v.2",
);
export const exclamationTriangle = glyph("M12 3 22 20H2Z M12 9v5 M12 17v.2");
export const check = glyph("M4 12l5 5L20 6");
export const checkCircle = glyph("m12 2 9 5v10l-9 5-9-5V7Z M7 12l3 3 7-7");
export const chevronRight = glyph("M9 5l7 7-7 7");
export const arrowLeft = glyph("M20 12H4 M10 6l-6 6 6 6");
export const arrowRight = glyph("M4 12h16 M14 6l6 6-6 6");
export const arrowsRightLeft = glyph("M3 7h17l-4-4 M21 17H4l4 4");
export const presentationChartLine = glyph(
    "M3 3v17h18 M6 15l5-6 4 3 6-8 M17 4h4v4",
);
export const user = glyph("m12 3 4 3-1 5H9L8 6Z M4 21v-4l5-3h6l5 3v4");
export const users = glyph(
    "m9 3 3 3-1 4H7L6 6Z M2 20v-4l5-3h4l5 3v4 M16 4l3 2v4l-3 2 M18 14l4 3v3",
);
export const hashtag = glyph("M9 3 6 21 M18 3l-3 18 M3 9h18 M2 15h18");
export const lockClosed = glyph("M7 10V6l3-3h4l3 3v4 M5 10h14v10H5Z M12 14v3");
export const lockOpen = glyph("M7 10V6l3-3h4l3 3 M5 10h14v10H5Z M12 14v3");
export const eye = glyph("m2 12 6-6h8l6 6-6 6H8Z m10-3 3 3-3 3-3-3Z");
export const eyeSlash = glyph("M3 3l18 18 M9 6h7l6 6-4 4 M6 6l-4 6 6 6h7");
export const star = glyph("M6 3h12v18l-6-4-6 4Z", true);
export const starOutline = glyph("M6 3h12v18l-6-4-6 4Z");
export const globeAlt = itemCube;
export const camera = glyph("M3 7h4l2-3h6l2 3h4v13H3Z m9 3 4 4-4 4-4-4Z");
export const resetDraft = glyph(
    "M4 10V4 M4 10h6 M4 10l4-5h9l4 4v8l-4 4H8l-4-4",
);
export const keyboard = glyph(
    "M3 5h18v14H3Z M6 9h1 M11 9h1 M16 9h1 M6 12h1 M11 12h1 M16 12h1 M8 16h8",
);
export const topLane = glyph("M4 20V7l3-3h13 M9 20V9h11 M4 14h5 M14 4v5");
export const middleLane = glyph(
    "M3 7V3h4 M17 21h4v-4 M4 16 16 4l4 4L8 20Z M10 10l4 4",
);
export const bottomLane = glyph("M4 20h13l3-3V4 M4 15h11V4 M10 15v5 M15 10h5");
export const jungleRole = glyph(
    "M12 21V3 M12 16 5 11 3 4l6 5 3 7 M12 18l7-5 2-7-6 5-3 7",
);
export const supportRole = glyph(
    "M12 3 20 6v7l-3 5-5 3-5-3-3-5V6Z M8 11h8 M12 7v8",
);
export const anyRole = glyph("m12 3 9 9-9 9-9-9Z M12 7v10 M7 12h10");
export const loading = glyph(
    "M12 3h5l4 4v5 M21 16l-5 5h-4 M8 21H7l-4-4v-5 M3 8l5-5 M12 8l4 4-4 4-4-4Z",
);
