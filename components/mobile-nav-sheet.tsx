"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { NAV } from "@/content/site";

// The modal runtime is only needed when Menu is opened (ADR 0006's JS budget).
const MobileNavDialog = dynamic(() => import("@/components/mobile-nav-dialog").then((module) => module.MobileNavDialog), { ssr: false });

export function MobileNavSheet() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Button
        ref={triggerRef}
        variant="ghost"
        size="sm"
        className="md:hidden"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          setLoaded(true);
          setOpen(true);
        }}>
        {NAV.menu}
      </Button>
      {loaded ? <MobileNavDialog open={open} setOpen={setOpen} triggerRef={triggerRef} /> : null}
    </>
  );
}
