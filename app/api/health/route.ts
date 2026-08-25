import { NextResponse } from "next/server";
import { getRepositoryProviderMode } from "@/lib/db";
import { getStorageProviderMode } from "@/lib/storage";

function hostedConfigurationPresent() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Safe readiness signal for deployment probes: it never reveals configuration values. */
export function GET() {
  const repository = getRepositoryProviderMode();
  const storage = getStorageProviderMode();
  const hostedRequested = repository === "supabase" || storage === "supabase";
  const configured = !hostedRequested || hostedConfigurationPresent();
  return NextResponse.json({ status: configured ? "ok" : "degraded", repository, storage, configured }, { status: configured ? 200 : 503 });
}
