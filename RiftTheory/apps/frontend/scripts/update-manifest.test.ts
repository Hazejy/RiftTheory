import { expect, test } from "bun:test";
import { createUpdateManifest } from "./update-manifest";

test("Windows update metadata points to the signed installer for the same version", () => {
    expect(createUpdateManifest("3.2.14", "RiftTheory_3.2.14_x64-setup.exe", "signed-value")).toEqual({
        version: "3.2.14",
        platforms: {
            "windows-x86_64": {
                signature: "signed-value",
                url: "https://github.com/Hazejy/RiftTheory/releases/download/v3.2.14/RiftTheory_3.2.14_x64-setup.exe",
            },
        },
    });
});

test("update metadata rejects mismatched versions and missing signatures", () => {
    expect(() => createUpdateManifest("3.2.14", "RiftTheory_3.2.13_x64-setup.exe", "signed-value")).toThrow();
    expect(() => createUpdateManifest("3.2.14", "RiftTheory_3.2.14_x64-setup.exe", "")).toThrow();
});
