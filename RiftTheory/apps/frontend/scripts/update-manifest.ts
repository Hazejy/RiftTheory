import { readFileSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

export function createUpdateManifest(version: string, installerName: string, signature: string) {
    if (!/^\d+\.\d+\.\d+$/.test(version) || installerName !== `RiftTheory_${version}_x64-setup.exe` || !signature.trim()) {
        throw new Error("Update version, installer name and signature must match");
    }
    return {
        version,
        platforms: {
            "windows-x86_64": {
                signature: signature.trim(),
                url: `https://github.com/Hazejy/RiftTheory/releases/download/v${version}/${installerName}`,
            },
        },
    };
}

if (import.meta.main) {
    const [version, installerPath, signaturePath, outputPath] = process.argv.slice(2);
    if (!version || !installerPath || !signaturePath || !outputPath) {
        throw new Error("Usage: bun update-manifest.ts <version> <installer> <installer.sig> <latest.json>");
    }
    const manifest = createUpdateManifest(version, basename(installerPath), readFileSync(signaturePath, "utf8"));
    writeFileSync(outputPath, JSON.stringify(manifest, null, 2) + "\n");
}
