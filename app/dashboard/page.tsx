import { auth } from "@/auth";
import { query } from "@/lib/db/client";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  const userId = session.user.id;

  const logs = await query<{ event_type: string; metadata: any; created_at: Date }>(
    `SELECT event_type, metadata, created_at FROM audit_logs 
     WHERE actor_user_id = $1 
     ORDER BY created_at DESC LIMIT 10`,
    [userId]
  );

  const formattedLogs = logs.map(log => {
    let detail = "Action performed";
    
    if (log.event_type === "upload" && log.metadata?.filename) {
      detail = `${log.metadata.filename} uploaded`;
    } else if (log.event_type === "token_created") {
      detail = `Token minted for asset`;
    } else if (log.event_type === "token_resolved") {
      detail = `Token resolved`;
    }

    // A simple time formatter for MVP
    const secondsAgo = Math.floor((new Date().getTime() - new Date(log.created_at).getTime()) / 1000);
    const time = secondsAgo < 60 ? `${secondsAgo}s ago` : `${Math.floor(secondsAgo/60)}m ago`;

    return {
      event: log.event_type,
      detail,
      time
    };
  });

  return (
    <main className="min-h-screen bg-[#0B0F13] text-[#EDEAE3]">
      <header className="border-b border-[#2A323C] px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <span className="font-mono text-sm">agentshare</span>
          <div className="flex items-center gap-4">
            <span className="text-xs text-[#9AA4B2]">{session.user.email}</span>
            <div className="h-8 w-8 rounded-full bg-[#2A323C] flex items-center justify-center text-xs">
              {session.user.name?.[0]?.toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      <DashboardClient initialActivity={formattedLogs} />
    </main>
  );
}
