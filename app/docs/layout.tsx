"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/docs", label: "Home" },
  { href: "/docs/quickstart", label: "Quickstart" },
  { href: "/docs/api-reference", label: "API Reference" },
  { href: "/docs/integrations", label: "Integrations" },
  { href: "/docs/comparisons", label: "Comparisons" },
  { href: "/docs/troubleshooting", label: "Troubleshooting" },
] as const;

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B0F13] text-[#EDEAE3]">
      {/* Mobile header */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-[#2A323C] bg-[#0B0F13] px-4 py-3 lg:hidden">
        <Link href="/docs" className="font-mono text-sm tracking-tight">
          agentshare<span className="text-[#5C6675]">/docs</span>
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="text-[#9AA4B2] hover:text-[#EDEAE3]"
          aria-label="Toggle navigation"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            {open ? (
              <path d="M5 5l10 10M15 5L5 15" />
            ) : (
              <path d="M3 6h14M3 10h14M3 14h14" />
            )}
          </svg>
        </button>
      </div>

      <div className="mx-auto flex max-w-7xl">
        {/* Sidebar */}
        <aside
          className={`${
            open ? "block" : "hidden"
          } fixed inset-y-0 left-0 z-30 w-64 overflow-y-auto border-r border-[#2A323C] bg-[#0B0F13] px-4 pb-8 pt-6 lg:sticky lg:top-0 lg:block lg:h-screen lg:shrink-0`}
        >
          <Link
            href="/docs"
            className="mb-8 hidden font-mono text-sm tracking-tight lg:block"
          >
            agentshare<span className="text-[#5C6675]">/docs</span>
          </Link>

          <nav className="mt-4 space-y-1 lg:mt-0">
            {NAV.map(({ href, label }) => {
              const active =
                href === "/docs"
                  ? pathname === "/docs"
                  : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                    active
                      ? "bg-[#5EEAD4]/10 font-medium text-[#5EEAD4]"
                      : "text-[#9AA4B2] hover:bg-[#2A323C]/50 hover:text-[#EDEAE3]"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-10 border-t border-[#2A323C] pt-6">
            <Link
              href="/"
              className="block text-xs text-[#5C6675] hover:text-[#9AA4B2]"
            >
              ← Back to agentshare.dev
            </Link>
          </div>
        </aside>

        {/* Mobile overlay */}
        {open && (
          <div
            className="fixed inset-0 z-20 bg-black/60 lg:hidden"
            onClick={() => setOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="min-w-0 flex-1 px-6 py-10 lg:px-16 lg:py-14">
          {children}
        </main>
      </div>
    </div>
  );
}
