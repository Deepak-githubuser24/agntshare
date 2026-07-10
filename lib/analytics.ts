"use client";

type EventName =
  | "page_view"
  | "signup_completed"
  | "api_key_issued"
  | "api_upload_success"
  | "api_token_minted"
  | "token_resolved"
  | "invite_sent";

interface EventProperties {
  // page_view
  path?: string;
  referrer?: string;
  // signup_completed
  provider?: string;
  // api_key_issued
  environment?: string;
  // api_upload_success
  size_bytes?: number;
  content_type?: string;
  // api_token_minted
  scope?: string;
  ttl?: number;
  // token_resolved
  viewer_ip_hash?: string;
  user_agent?: string;
  // invite_sent
  role?: string;
  // shared
  user_id?: string;
  timestamp?: string;
  [key: string]: unknown;
}

class Analytics {
  private endpoint: string;
  private debug: boolean;

  constructor() {
    this.endpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT || "/api/events";
    this.debug = process.env.NODE_ENV === "development";
  }

  track(event: EventName, properties: EventProperties = {}) {
    const payload = {
      event,
      properties: {
        ...properties,
        timestamp: properties.timestamp || new Date().toISOString(),
        url: typeof window !== "undefined" ? window.location.href : undefined,
      },
    };

    if (this.debug) {
      console.log("[analytics]", payload);
    }

    // Fire and forget — never block the UI
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon(this.endpoint, JSON.stringify(payload));
    } else {
      fetch(this.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  }

  pageView(path?: string) {
    this.track("page_view", {
      path: path || (typeof window !== "undefined" ? window.location.pathname : ""),
      referrer: typeof document !== "undefined" ? document.referrer : "",
    });
  }

  signupCompleted(provider: string) {
    this.track("signup_completed", { provider });
  }

  apiKeyIssued(environment: string) {
    this.track("api_key_issued", { environment });
  }

  uploadSuccess(sizeBytes: number, contentType: string) {
    this.track("api_upload_success", { size_bytes: sizeBytes, content_type: contentType });
  }

  tokenMinted(scope: string, ttl?: number) {
    this.track("api_token_minted", { scope, ttl });
  }

  tokenResolved(viewerIpHash: string, userAgent: string) {
    this.track("token_resolved", { viewer_ip_hash: viewerIpHash, user_agent: userAgent });
  }

  inviteSent(role: string) {
    this.track("invite_sent", { role });
  }
}

export const analytics = new Analytics();
export type { EventName, EventProperties };
