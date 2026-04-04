import { listAdminPresets } from "@/lib/preset-service";
import { PresetsAdminClient } from "./presets-admin-client";

export default async function PresetsPage() {
  const presets = await listAdminPresets().catch(() => []);
  return <PresetsAdminClient initialPresets={presets} />;
}
