import { expect, test } from "bun:test";
import shippedKnowledge from "../../public/data/rifttheory-knowledge.json";
import { isRiftTheoryKnowledge, SUPPORTED_KNOWLEDGE_SCHEMA_VERSION } from "./RiftTheoryKnowledge";

test("the shipped knowledge export uses the supported schema", () => {
    expect(shippedKnowledge.metadata.schemaVersion).toBe(SUPPORTED_KNOWLEDGE_SCHEMA_VERSION);
    expect(isRiftTheoryKnowledge(shippedKnowledge)).toBe(true);
    expect(isRiftTheoryKnowledge({ ...shippedKnowledge, metadata: {
        ...shippedKnowledge.metadata, schemaVersion: SUPPORTED_KNOWLEDGE_SCHEMA_VERSION + 1,
    } })).toBe(false);
});
