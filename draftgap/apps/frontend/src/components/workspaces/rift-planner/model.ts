export type MapPoint = {
    x: number;
    y: number;
};

export type MarkerKind = "blue" | "red" | "vision" | "objective" | "champion";

export type PlannerMarker = MapPoint & {
    id: string;
    kind: MarkerKind;
    championKey?: string;
    team?: "blue" | "red";
};

export type PlannerStroke = {
    id: string;
    color: string;
    width: number;
    points: MapPoint[];
};

export type PlannerLabel = MapPoint & {
    id: string;
    text: string;
};

export type PlannerBoard = {
    markers: PlannerMarker[];
    strokes: PlannerStroke[];
    labels: PlannerLabel[];
};

export type PlannerTool =
    | { kind: "select" }
    | { kind: Exclude<MarkerKind, "champion"> }
    | { kind: "champion"; championKey: string; team: "blue" | "red" }
    | { kind: "draw" }
    | { kind: "text" }
    | { kind: "erase" };

export type PlannerDocument = PlannerBoard & {
    notes: string;
    customRoster: PlannerChampionDrag[];
};

export type PlannerChampionDrag = {
    championKey: string;
    team: "blue" | "red";
};

export const PLANNER_CHAMPION_DRAG_TYPE =
    "application/x-rifttheory-planner-champion";

export const EMPTY_BOARD: PlannerBoard = {
    markers: [],
    strokes: [],
    labels: [],
};

export function emptyPlannerDocument(): PlannerDocument {
    return { ...EMPTY_BOARD, notes: "", customRoster: [] };
}

export const RIFT_PLANNER_STORAGE_KEY = "rifttheory.rift-planner.v2";
const LEGACY_STORAGE_KEY = "rifttheory.rift-planner.v1";

function isPoint(value: unknown): value is MapPoint {
    return Boolean(
        value &&
        typeof value === "object" &&
        "x" in value &&
        typeof value.x === "number" &&
        "y" in value &&
        typeof value.y === "number",
    );
}

function hasId(value: unknown): value is { id: string } {
    return Boolean(
        value &&
        typeof value === "object" &&
        "id" in value &&
        typeof value.id === "string",
    );
}

export function loadPlannerDocument(): PlannerDocument {
    try {
        const parsed: unknown = JSON.parse(
            localStorage.getItem(RIFT_PLANNER_STORAGE_KEY) ??
                localStorage.getItem(LEGACY_STORAGE_KEY) ??
                "{}",
        );
        if (!parsed || typeof parsed !== "object") {
            return emptyPlannerDocument();
        }

        const markers =
            "markers" in parsed && Array.isArray(parsed.markers)
                ? parsed.markers.filter(
                      (marker): marker is PlannerMarker =>
                          hasId(marker) &&
                          isPoint(marker) &&
                          "kind" in marker &&
                          typeof marker.kind === "string",
                  )
                : [];
        const strokes =
            "strokes" in parsed && Array.isArray(parsed.strokes)
                ? parsed.strokes.filter(
                      (stroke): stroke is PlannerStroke =>
                          hasId(stroke) &&
                          "color" in stroke &&
                          typeof stroke.color === "string" &&
                          (!("width" in stroke) ||
                              typeof stroke.width === "number") &&
                          "points" in stroke &&
                          Array.isArray(stroke.points) &&
                          stroke.points.every(isPoint),
                  )
                : [];
        const labels =
            "labels" in parsed && Array.isArray(parsed.labels)
                ? parsed.labels.filter(
                      (label): label is PlannerLabel =>
                          hasId(label) &&
                          isPoint(label) &&
                          "text" in label &&
                          typeof label.text === "string",
                  )
                : [];

        return {
            markers,
            strokes: strokes.map((stroke) => ({
                ...stroke,
                width: stroke.width ?? 3,
            })),
            labels,
            notes:
                "notes" in parsed && typeof parsed.notes === "string"
                    ? parsed.notes
                    : "",
            customRoster:
                "customRoster" in parsed && Array.isArray(parsed.customRoster)
                    ? parsed.customRoster.filter(
                          (entry): entry is PlannerChampionDrag =>
                              Boolean(
                                  entry &&
                                  typeof entry === "object" &&
                                  "championKey" in entry &&
                                  typeof entry.championKey === "string" &&
                                  "team" in entry &&
                                  (entry.team === "blue" ||
                                      entry.team === "red"),
                              ),
                      )
                    : [],
        };
    } catch {
        return emptyPlannerDocument();
    }
}

export function copyBoard(board: PlannerBoard): PlannerBoard {
    return {
        markers: [...board.markers],
        strokes: [...board.strokes],
        labels: [...board.labels],
    };
}
