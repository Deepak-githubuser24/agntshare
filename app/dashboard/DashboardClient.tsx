"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type AuditRow = {
  event: string;
  detail: string;
  time: string;
};

export default function DashboardClient({ initialActivity }: { initialActivity: AuditRow[] }) {
  const [isUploading, setIsUploading] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<{ token: string; shareUrl: string; expiresAt: string; scope: string } | null>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setTokenInfo(null);

    try {
      // 1. Get presigned URL and Asset ID
      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          sizeBytes: file.size,
        }),
      });

      if (!uploadRes.ok) throw new Error("Upload initialization failed");
      const { uploadUrl, assetId } = await uploadRes.json();

      // 2. Upload directly to S3
      const s3Res = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });

      if (!s3Res.ok) throw new Error("Failed to upload to storage");

      // 3. Generate Pathway Token
      const tokenRes = await fetch("/api/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assetId }),
      });

      if (!tokenRes.ok) throw new Error("Failed to generate token");
      const tokenData = await tokenRes.json();
      
      setTokenInfo(tokenData);
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setIsUploading(false);
      e.target.value = ''; // reset file input
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-xl font-medium">Assets</h1>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {/* Upload card */}
        <div className="rounded-lg border border-dashed border-[#2A323C] bg-[#10151B] p-6 relative">
          <p className="font-mono text-xs uppercase tracking-widest text-[#5C6675]">Upload</p>
          <div className="mt-4 flex h-32 items-center justify-center rounded-md border border-[#2A323C] text-sm text-[#5C6675] relative overflow-hidden group cursor-pointer hover:border-[#5EEAD4] transition-colors">
            {isUploading ? (
              <span className="animate-pulse">Uploading...</span>
            ) : (
              <span>Drag a file here, or click to browse</span>
            )}
            <input
              type="file"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleFileSelect}
              disabled={isUploading}
            />
          </div>
        </div>

        {/* Token card */}
        <div className="rounded-lg border border-[#2A323C] bg-[#10151B] p-6">
          <p className="font-mono text-xs uppercase tracking-widest text-[#5C6675]">Latest token</p>
          {tokenInfo ? (
            <>
              <p className="mt-4 font-mono text-lg text-[#5EEAD4] break-all">{tokenInfo.shareUrl}</p>
              <div className="mt-3 flex items-center gap-4 text-xs text-[#9AA4B2]">
                <span>expires at {new Date(tokenInfo.expiresAt).toLocaleTimeString()}</span>
                <span>scope: {tokenInfo.scope}</span>
              </div>
              <Button 
                variant="outline"
                className="mt-4 rounded-md border border-[#2A323C] px-3 py-1.5 text-xs text-[#EDEAE3] hover:border-[#5EEAD4] hover:text-[#5EEAD4] bg-transparent"
                onClick={() => navigator.clipboard.writeText(tokenInfo.shareUrl)}
              >
                Copy link
              </Button>
            </>
          ) : (
            <p className="mt-4 text-sm text-[#5C6675]">No recent tokens generated.</p>
          )}
        </div>
      </div>

      {/* Activity list */}
      <div className="mt-10">
        <p className="font-mono text-xs uppercase tracking-widest text-[#5C6675]">Activity</p>
        <div className="mt-4 divide-y divide-[#2A323C] rounded-lg border border-[#2A323C]">
          {initialActivity.length > 0 ? initialActivity.map((row, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-[#151b23]">
              <div>
                <span className="font-mono text-xs text-[#5EEAD4]">{row.event}</span>
                <span className="ml-3 text-[#9AA4B2]">{row.detail}</span>
              </div>
              <span className="text-xs text-[#5C6675]">{row.time}</span>
            </div>
          )) : (
            <div className="px-4 py-3 text-sm text-[#5C6675]">No recent activity found.</div>
          )}
        </div>
      </div>
    </div>
  );
}
