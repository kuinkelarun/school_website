/**
 * Cloud Functions for School Website
 *
 * 1. onStorageUpload   – After every gallery/media upload, recalculates total
 *                        storage usage and writes it to siteSettings/storageUsage.
 *                        If usage exceeds a threshold, queues an alert email via
 *                        the Trigger Email extension (writes to "mail" collection).
 *
 * 2. scheduledCleanup  – Runs daily via Cloud Scheduler. If storage usage > 95%
 *                        of the configured limit, deletes the oldest unpublished
 *                        gallery items until usage drops below 85%.
 *
 * 3. onStorageDelete   – After a gallery item is deleted from Firestore,
 *                        recalculates total storage usage.
 *
 * Storage limit is read from siteSettings/storageUsage document:
 *   { totalBytes, limitBytes, lastChecked, warningEmailSentAt? }
 *
 * Default limit: 4.5 GB (leaving 0.5 GB headroom in the 5 GB free tier).
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();
const bucket = admin.storage().bucket();

// ─── Constants ───────────────────────────────────────────────────────────────
const DEFAULT_LIMIT_BYTES = 4.5 * 1024 * 1024 * 1024; // 4.5 GB
const WARN_THRESHOLD = 0.7;   // 70 %  → first email
const DANGER_THRESHOLD = 0.9; // 90 %  → urgent email
const CLEANUP_TRIGGER = 0.95; // 95 %  → auto-cleanup starts
const CLEANUP_TARGET = 0.85;  // 85 %  → cleanup stops
const USAGE_DOC = "siteSettings/storageUsage";
const EMAIL_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 1 day between repeat emails

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Sum fileSize from all docs in a collection. */
async function sumCollectionSize(collectionName: string): Promise<number> {
  const snap = await db.collection(collectionName).get();
  let total = 0;
  snap.forEach((doc) => {
    const size = doc.data().fileSize;
    if (typeof size === "number") total += size;
  });
  return total;
}

/** Recalculate total storage from all tracked collections. */
async function recalcTotalUsage(): Promise<number> {
  const [gallery, media] = await Promise.all([
    sumCollectionSize("gallery"),
    sumCollectionSize("mediaFiles"),
  ]);
  return gallery + media;
}

/** Read the current storageUsage document or initialize defaults. */
async function getUsageDoc(): Promise<{
  totalBytes: number;
  limitBytes: number;
  warningEmailSentAt: number | null;
}> {
  const snap = await db.doc(USAGE_DOC).get();
  if (snap.exists) {
    const d = snap.data()!;
    return {
      totalBytes: d.totalBytes ?? 0,
      limitBytes: d.limitBytes ?? DEFAULT_LIMIT_BYTES,
      warningEmailSentAt: d.warningEmailSentAt ?? null,
    };
  }
  return {
    totalBytes: 0,
    limitBytes: DEFAULT_LIMIT_BYTES,
    warningEmailSentAt: null,
  };
}

/** Write updated usage numbers. */
async function writeUsageDoc(totalBytes: number, extra: Record<string, any> = {}) {
  const usage = await getUsageDoc();
  await db.doc(USAGE_DOC).set(
    {
      totalBytes,
      limitBytes: usage.limitBytes,
      lastChecked: admin.firestore.FieldValue.serverTimestamp(),
      ...extra,
    },
    { merge: true }
  );
}

/** Fetch admin email from siteSettings/main. */
async function getAdminEmail(): Promise<string | null> {
  const snap = await db.doc("siteSettings/main").get();
  return snap.exists ? snap.data()?.email ?? null : null;
}

/** Queue an email via the Trigger Email extension (writes to "mail" collection). */
async function sendAlertEmail(
  to: string,
  subject: string,
  html: string
) {
  await db.collection("mail").add({
    to: [to],
    message: { subject, html },
  });
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

// ─── 1. Recalc on gallery / media writes ─────────────────────────────────────

export const onGalleryWrite = functions.firestore
  .document("gallery/{docId}")
  .onWrite(async () => {
    const totalBytes = await recalcTotalUsage();
    const usage = await getUsageDoc();
    const pct = totalBytes / usage.limitBytes;

    const extra: Record<string, any> = {};

    // Check if we should send a warning email
    if (pct >= WARN_THRESHOLD) {
      const now = Date.now();
      const lastSent = usage.warningEmailSentAt ?? 0;
      if (now - lastSent > EMAIL_COOLDOWN_MS) {
        const adminEmail = await getAdminEmail();
        if (adminEmail) {
          const level = pct >= DANGER_THRESHOLD ? "🔴 URGENT" : "🟡 WARNING";
          const pctStr = (pct * 100).toFixed(1);
          await sendAlertEmail(
            adminEmail,
            `${level}: Storage at ${pctStr}% capacity`,
            `
              <h2>${level}: Storage Usage Alert</h2>
              <p>Your school website storage is at <strong>${pctStr}%</strong> of the configured limit.</p>
              <table style="border-collapse:collapse;">
                <tr><td style="padding:4px 12px;"><strong>Used:</strong></td><td>${formatBytes(totalBytes)}</td></tr>
                <tr><td style="padding:4px 12px;"><strong>Limit:</strong></td><td>${formatBytes(usage.limitBytes)}</td></tr>
                <tr><td style="padding:4px 12px;"><strong>Free:</strong></td><td>${formatBytes(usage.limitBytes - totalBytes)}</td></tr>
              </table>
              <p style="margin-top:16px;">
                Please log in to the admin panel and delete unused photos/videos, or
                older items will be automatically removed when usage exceeds 95%.
              </p>
            `
          );
          extra.warningEmailSentAt = now;
        }
      }
    }

    await writeUsageDoc(totalBytes, extra);
  });

export const onMediaWrite = functions.firestore
  .document("mediaFiles/{docId}")
  .onWrite(async () => {
    const totalBytes = await recalcTotalUsage();
    await writeUsageDoc(totalBytes);
  });

// ─── 2. Scheduled daily cleanup ──────────────────────────────────────────────

export const scheduledStorageCleanup = functions.pubsub
  .schedule("every 24 hours")
  .timeZone("Asia/Kathmandu")
  .onRun(async () => {
    const totalBytes = await recalcTotalUsage();
    const usage = await getUsageDoc();
    const pct = totalBytes / usage.limitBytes;

    functions.logger.info(
      `Storage check: ${formatBytes(totalBytes)} / ${formatBytes(usage.limitBytes)} (${(pct * 100).toFixed(1)}%)`
    );

    if (pct < CLEANUP_TRIGGER) {
      await writeUsageDoc(totalBytes);
      return;
    }

    // Need to clean up — delete oldest UNPUBLISHED gallery items first
    functions.logger.warn(
      `Storage at ${(pct * 100).toFixed(1)}% — starting auto-cleanup`
    );

    let currentBytes = totalBytes;
    const deletedIds: string[] = [];
    const targetBytes = usage.limitBytes * CLEANUP_TARGET;

    // 1. Delete unpublished gallery items (oldest first)
    const unpublished = await db
      .collection("gallery")
      .where("isPublished", "==", false)
      .orderBy("createdAt", "asc")
      .get();

    for (const doc of unpublished.docs) {
      if (currentBytes <= targetBytes) break;
      const data = doc.data();
      const fileSize = data.fileSize ?? 0;

      // Try to delete the actual Storage file
      if (data.url && !data.url.startsWith("data:")) {
        try {
          // Extract path from Firebase Storage URL
          const urlObj = new URL(data.url);
          const path = decodeURIComponent(
            urlObj.pathname.split("/o/")[1]?.split("?")[0] ?? ""
          );
          if (path) await bucket.file(path).delete().catch(() => {});
        } catch {
          // URL parsing failed — skip file deletion
        }
      }

      await doc.ref.delete();
      currentBytes -= fileSize;
      deletedIds.push(doc.id);
    }

    // 2. If still over limit, delete oldest PUBLISHED gallery items
    if (currentBytes > targetBytes) {
      const published = await db
        .collection("gallery")
        .where("isPublished", "==", true)
        .orderBy("createdAt", "asc")
        .get();

      for (const doc of published.docs) {
        if (currentBytes <= targetBytes) break;
        const data = doc.data();
        const fileSize = data.fileSize ?? 0;

        if (data.url && !data.url.startsWith("data:")) {
          try {
            const urlObj = new URL(data.url);
            const path = decodeURIComponent(
              urlObj.pathname.split("/o/")[1]?.split("?")[0] ?? ""
            );
            if (path) await bucket.file(path).delete().catch(() => {});
          } catch {
            // skip
          }
        }

        await doc.ref.delete();
        currentBytes -= fileSize;
        deletedIds.push(doc.id);
      }
    }

    // Update usage
    await writeUsageDoc(currentBytes);

    // Email the admin about the cleanup
    if (deletedIds.length > 0) {
      const adminEmail = await getAdminEmail();
      if (adminEmail) {
        await sendAlertEmail(
          adminEmail,
          `⚠️ Auto-Cleanup: ${deletedIds.length} item(s) deleted`,
          `
            <h2>Automatic Storage Cleanup Report</h2>
            <p>Storage was at <strong>${(pct * 100).toFixed(1)}%</strong> capacity.
               The system automatically deleted <strong>${deletedIds.length}</strong> gallery item(s)
               to bring usage below ${(CLEANUP_TARGET * 100).toFixed(0)}%.</p>
            <table style="border-collapse:collapse;">
              <tr><td style="padding:4px 12px;"><strong>Before:</strong></td><td>${formatBytes(totalBytes)}</td></tr>
              <tr><td style="padding:4px 12px;"><strong>After:</strong></td><td>${formatBytes(currentBytes)}</td></tr>
              <tr><td style="padding:4px 12px;"><strong>Freed:</strong></td><td>${formatBytes(totalBytes - currentBytes)}</td></tr>
            </table>
            <p style="margin-top:16px;">
              To prevent automatic deletion, regularly review and delete unused media from the admin panel.
            </p>
          `
        );
      }
    }

    functions.logger.info(
      `Cleanup complete: deleted ${deletedIds.length} items, usage now ${formatBytes(currentBytes)}`
    );
  });

// ─── 3. Pre-upload check (callable) ──────────────────────────────────────────
// The client calls this before uploading a file to check if there's enough room.

export const checkStorageBeforeUpload = functions.https.onCall(
  async (data: { fileSizeBytes: number }) => {
    const fileSizeBytes = data?.fileSizeBytes ?? 0;
    if (typeof fileSizeBytes !== "number" || fileSizeBytes <= 0) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "fileSizeBytes must be a positive number"
      );
    }

    const totalBytes = await recalcTotalUsage();
    const usage = await getUsageDoc();
    const projectedBytes = totalBytes + fileSizeBytes;
    const projectedPct = projectedBytes / usage.limitBytes;

    return {
      allowed: projectedPct < 1.0, // Reject if would exceed 100%
      currentBytes: totalBytes,
      limitBytes: usage.limitBytes,
      projectedBytes,
      projectedPct: Math.round(projectedPct * 1000) / 10, // e.g. 72.3
      message:
        projectedPct >= 1.0
          ? `Upload rejected: this file (${formatBytes(fileSizeBytes)}) would push storage to ${(projectedPct * 100).toFixed(1)}% of the limit. Please delete some files first.`
          : "OK",
    };
  }
);
