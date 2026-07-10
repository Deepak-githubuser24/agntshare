"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function ViewPage() {
  const params = useParams();
  const [status, setStatus] = useState("Resolving token...");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/resolve/${params.token}`)
      .then(res => res.json().then(data => ({ status: res.status, data })))
      .then(({ status, data }) => {
        if (status !== 200) {
          setError(data.error || "Failed to resolve token");
          setStatus("");
        } else {
          setStatus("Redirecting to secure stream...");
          window.location.href = data.streamUrl;
        }
      })
      .catch(err => {
        setError("Network error");
        setStatus("");
        console.error(err);
      });
  }, [params.token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0F13] text-[#EDEAE3] font-mono text-sm">
      <div className="text-center">
        {status && <p className="animate-pulse">{status}</p>}
        {error && <p className="text-red-400">{error}</p>}
      </div>
    </div>
  );
}
