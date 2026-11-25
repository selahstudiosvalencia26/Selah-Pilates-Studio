import type { NextRequest } from "next/server";
import { guardRequest } from "@/lib/auth/middleware";

export const middleware = (request: NextRequest) => guardRequest(request);

export const config = {
  // Every address except the app's own built files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
