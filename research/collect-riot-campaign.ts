/** Run several ladder pages sequentially with the existing resumable collector.
 * Example: bun research/collect-riot-campaign.ts euw1 DIAMOND I 1 10 25 20
 * Append --plan to inspect the campaign without making API calls.
 * RIOT_API_KEY must be set privately in the environment for a real run.
 */
import { join } from "node:path";
import { ROUTING } from "./collect-riot-soloq";

export function planCampaign(args: string[]) {
    const [platform, tier, division, firstText, countText, playersText, matchesText, flag] = args;
    const firstPage = Number(firstText);
    const pageCount = Number(countText);
    const playersPerPage = Number(playersText);
    const matchesPerPlayer = Number(matchesText);
    if (
        !ROUTING[platform?.toLowerCase()] || !["IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM", "EMERALD", "DIAMOND"].includes(tier) ||
        !["I", "II", "III", "IV"].includes(division) ||
        ![firstPage, pageCount, playersPerPage, matchesPerPlayer].every(Number.isInteger) ||
        firstPage < 1 || pageCount < 1 || pageCount > 50 ||
        playersPerPage < 1 || playersPerPage > 100 ||
        matchesPerPlayer < 1 || matchesPerPlayer > 100 ||
        (flag !== undefined && flag !== "--plan")
    ) throw new Error("Usage: bun research/collect-riot-campaign.ts platform tier division firstPage pageCount playersPerPage matchesPerPlayer [--plan]");
    return Array.from({ length: pageCount }, (_, index) => [
        platform.toLowerCase(), tier, division, String(firstPage + index),
        String(playersPerPage), String(matchesPerPlayer),
    ]);
}

if (import.meta.main) {
    const args = process.argv.slice(2);
    const pages = planCampaign(args);
    if (args.at(-1) === "--plan") {
        console.log(JSON.stringify({ pages, note: "Ladder seed only; participant ranks are not verified" }, null, 2));
    } else {
        if (!process.env.RIOT_API_KEY) throw new Error("Set RIOT_API_KEY privately in this shell before running the campaign");
        const collector = join(import.meta.dir, "collect-riot-soloq.ts");
        for (const page of pages) {
            console.log(`Collecting ${page[0]} ${page[1]} ${page[2]} page ${page[3]}...`);
            const child = Bun.spawn([process.execPath, collector, ...page], {
                cwd: join(import.meta.dir, ".."),
                env: process.env,
                stdout: "inherit",
                stderr: "inherit",
            });
            const code = await child.exited;
            if (code !== 0) throw new Error(`Collection stopped at page ${page[3]}; rerun the same command after fixing the cause`);
        }
    }
}
