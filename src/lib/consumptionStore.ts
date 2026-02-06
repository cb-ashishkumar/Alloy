import { promises as fs } from "node:fs";
import path from "node:path";

type DbShape = {
  // key = `${customer_id}::${subscription_id}::${feature_id}`
  consumedByKey: Record<string, number>;
};

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "consumption.json");

function makeKey(customerId: string, subscriptionId: string, featureId: string) {
  return `${customerId}::${subscriptionId}::${featureId}`;
}

async function readDb(): Promise<DbShape> {
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "consumedByKey" in parsed &&
      typeof (parsed as { consumedByKey?: unknown }).consumedByKey === "object" &&
      (parsed as { consumedByKey?: unknown }).consumedByKey !== null
    ) {
      return parsed as DbShape;
    }
  } catch {
    // ignore
  }
  return { consumedByKey: {} };
}

async function writeDb(db: DbShape) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, DB_FILE);
}

export async function getConsumptionBulk(params: {
  customerId: string;
  subscriptionId: string;
  featureIds: string[];
}) {
  const db = await readDb();
  const items = params.featureIds.map((featureId) => {
    const key = makeKey(params.customerId, params.subscriptionId, featureId);
    const consumed = Number(db.consumedByKey[key] ?? 0);
    return { featureId, consumed };
  });
  return items;
}

export async function incrementConsumption(params: {
  customerId: string;
  subscriptionId: string;
  featureId: string;
  delta: number;
}) {
  const db = await readDb();
  const key = makeKey(params.customerId, params.subscriptionId, params.featureId);
  const current = Number(db.consumedByKey[key] ?? 0);
  const next = Math.max(0, current + params.delta);
  db.consumedByKey[key] = next;
  await writeDb(db);
  return { featureId: params.featureId, consumed: next };
}

