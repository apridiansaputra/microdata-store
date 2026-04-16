import { createHmac } from "node:crypto";

import { getAuthSecret } from "@/lib/auth/config";

export function hashSessionToken(rawSessionToken: string) {
  return createHmac("sha256", getAuthSecret())
    .update(rawSessionToken)
    .digest("hex");
}
