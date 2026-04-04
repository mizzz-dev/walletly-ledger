import { listPublishedPresets } from "@/lib/preset-service";
import { NewTransactionClient } from "./transaction-form-client";

export default async function NewTransactionPage() {
  const presets = await listPublishedPresets().catch(() => []);
  return <NewTransactionClient presets={presets} />;
}
