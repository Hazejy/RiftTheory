import { openDatabase, migrateDatabase, verifyDatabase } from "./database";
import { importCuratedData } from "./curated";
import { syncRiotData } from "./riot";
import { exportWebData } from "./export";
import { getStatus } from "./status";
import { DATABASE_PATH } from "./paths";
import { checkPatchStatus } from "./patch";
import { importObservedRoles } from "./observedRoles";
import { syncDraftGapRoleSamples } from "./providers/draftGap";

const command = process.argv[2] ?? "status";
const offline = process.argv.includes("--offline");
const database = openDatabase();

try {
  await migrateDatabase(database);
  switch (command) {
    case "init":
      console.log(`Initialized ${DATABASE_PATH}`);
      break;
    case "sync-riot": {
      const result = await syncRiotData(database);
      console.log(
        `Riot ${result.patch}: ${result.champions} champions, ${result.records} localized records`,
      );
      break;
    }
    case "check-patch": {
      const status = await checkPatchStatus();
      console.log(JSON.stringify(status, null, 2));
      break;
    }
    case "refresh": {
      const status = await checkPatchStatus();
      if (!status.updateAvailable) {
        console.log(`RiftTheory data is current at ${status.latestRiotPatch}`);
        break;
      }
      const riot = await syncRiotData(database, status.latestRiotPatch);
      const records = await importCuratedData(database);
      const result = await exportWebData(database);
      verifyDatabase(database);
      console.log(
        `Updated ${result.champions} champions from ${status.publishedPatch ?? "no published patch"} to ${riot.patch} with ${records} curated records`,
      );
      break;
    }
    case "import-curated": {
      const records = await importCuratedData(database);
      console.log(`Imported ${records} curated profile records`);
      break;
    }
    case "import-roles": {
      const inputPath = process.argv[3];
      if (!inputPath)
        throw new Error(
          "import-roles requires a snapshot path, for example: bun run data:import:roles -- ../data/roles.json",
        );
      const result = await importObservedRoles(database, inputPath);
      console.log(
        `Imported ${result.records} role observations for ${result.context.patch} from ${result.source}`,
      );
      break;
    }
    case "sync-draftgap-roles": {
      const result = await syncDraftGapRoleSamples(database, process.argv[3]);
      const output = await exportWebData(database);
      verifyDatabase(database);
      console.log(
        `Imported ${result.records} DraftGap role samples for observed patch ${result.context.patch} and exported ${output.champions} champions`,
      );
      break;
    }
    case "export": {
      const result = await exportWebData(database);
      console.log(
        `Exported ${result.champions} champions (${result.bytes} bytes) to ${result.path}`,
      );
      break;
    }
    case "build": {
      if (!offline) {
        const result = await syncRiotData(database);
        console.log(`Synchronized Riot ${result.patch}`);
      }
      const records = await importCuratedData(database);
      const result = await exportWebData(database);
      verifyDatabase(database);
      console.log(
        `Built ${result.champions} champions with ${records} curated records${offline ? " (offline)" : ""}`,
      );
      break;
    }
    case "status":
      console.log(JSON.stringify(getStatus(database), null, 2));
      break;
    case "verify":
      verifyDatabase(database);
      console.log("Database integrity: ok");
      break;
    default:
      throw new Error(
        `Unknown command: ${command}. Use init, check-patch, refresh, sync-riot, sync-draftgap-roles, import-curated, import-roles, export, build, status or verify.`,
      );
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  database.close();
}
