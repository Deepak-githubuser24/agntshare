import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  if (req.nextUrl.pathname.startsWith("/api")) {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-agent-id, x-session-id, x-agent-role, x-forwarded-for",
      "Access-Control-Max-Age": "86400",
    };

    if (req.method === "OPTIONS") {
      return NextResponse.json({}, { status: 200, headers });
    }

    const res = NextResponse.next();
    Object.entries(headers).forEach(([key, value]) => {
      res.headers.set(key, value);
    });
    return res;
  }
});

export const config = {
  // matcher for protected routes and all API CORS handling
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
