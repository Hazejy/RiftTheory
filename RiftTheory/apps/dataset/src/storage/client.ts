import { S3Client } from "@aws-sdk/client-s3";
import "dotenv/config";

export function getStorageClient() {
    if (!process.env.S3_ACCESS_KEY_ID)
        throw new Error("S3_ACCESS_KEY_ID must be set for S3 storage");
    if (!process.env.S3_SECRET_ACCESS_KEY)
        throw new Error("S3_SECRET_ACCESS_KEY must be set for S3 storage");
    if (!process.env.S3_ENDPOINT)
        throw new Error("S3_ENDPOINT must be set for S3 storage");

    return new S3Client({
        endpoint: process.env.S3_ENDPOINT,
        region: process.env.S3_REGION || "auto",
        credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        },
    });
}
