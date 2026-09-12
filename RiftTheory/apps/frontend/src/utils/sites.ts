import { Role } from "@draftgap/core/src/models/Role";
import { RankBracket, StatsSite } from "@draftgap/core/src/models/user/Config";

const UGG_ROLES = ["top", "jungle", "mid", "adc", "support"] as const;
const OP_GG_ROLES = ["top", "jungle", "mid", "adc", "support"] as const;
const LOLALYTICS_ROLES = [
    "top",
    "jungle",
    "middle",
    "bottom",
    "support",
] as const;

export const linkByStatsSite = (
    statsSite: StatsSite,
    champion: string,
    role: Role,
    rankBracket: RankBracket = "emerald_plus",
) => {
    champion = champion.toLowerCase();
    if (champion === "monkeyking") champion = "wukong";

    switch (statsSite) {
        case "lolalytics":
            return `https://lolalytics.com/lol/${champion}/build/?lane=${LOLALYTICS_ROLES[role]}&tier=${rankBracket}`;
        case "u.gg":
            return `https://u.gg/lol/champions/${champion}/build/${UGG_ROLES[role]}`;
        case "op.gg":
            return `https://op.gg/champions/${champion}/${OP_GG_ROLES[role]}/build`;
    }
};

export const matchupLinkByStatsSite = (
    statsSite: StatsSite,
    champion: string,
    opponent: string,
    role: Role,
    rankBracket: RankBracket = "emerald_plus",
) => {
    champion = champion.toLowerCase();
    opponent = opponent.toLowerCase();
    if (champion === "monkeyking") champion = "wukong";
    if (opponent === "monkeyking") opponent = "wukong";

    switch (statsSite) {
        case "lolalytics":
            return `https://lolalytics.com/lol/${champion}/vs/${opponent}/build/?lane=${LOLALYTICS_ROLES[role]}&vslane=${LOLALYTICS_ROLES[role]}&tier=${rankBracket}`;
        case "u.gg":
            return `https://u.gg/lol/champions/${champion}/counter?role=${UGG_ROLES[role]}&rank=${rankBracket}&opp=${opponent}`;
        case "op.gg":
            return `https://op.gg/lol/champions/${champion}/counters/${OP_GG_ROLES[role]}?region=global&tier=${rankBracket}&target_champion=${opponent}`;
    }
};

export const displayNameByStatsSite = (statsSite: StatsSite) => {
    switch (statsSite) {
        case "lolalytics":
            return "LoLalytics";
        case "u.gg":
            return "U.GG";
        case "op.gg":
            return "OP.GG";
    }
};
