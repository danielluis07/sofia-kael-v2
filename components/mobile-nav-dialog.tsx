"use client";

import { useEffect, useRef, type MouseEvent, type RefObject } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { NAV, SECTIONS, sectionHref, type SectionId } from "@/content/site";

export function MobileNavDialog({ open, setOpen, triggerRef }: {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
}) {
  const destination = useRef<SectionId | null>(null);
  const navigating = useRef(false);

  useEffect(() => {
    if (open) {
      destination.current = null;
      navigating.current = false;
    }
  }, [open]);

  // Resizing into the desktop navigation must release the modal and scroll lock.
  useEffect(() => {
    const desktop = matchMedia("(min-width: 48rem)");
    const closeOnDesktop = () => {
      if (desktop.matches) setOpen(false);
    };
    closeOnDesktop();
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, [setOpen]);

  function navigate(event: MouseEvent<HTMLAnchorElement>, id: SectionId) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    destination.current = id;
    navigating.current = true;
    setOpen(false);
  }

  function finishClose(isOpen: boolean) {
    if (isOpen || !destination.current) return;
    const id = destination.current;
    destination.current = null;
    // Base UI has finished closing: the scroll lock is released before the jump.
    location.hash = sectionHref(id);
    document.getElementById(`${id}-title`)?.focus({ preventScroll: true });
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          destination.current = null;
          navigating.current = false;
        }
        setOpen(nextOpen);
      }}
      onOpenChangeComplete={finishClose}>
      <SheetContent side="full" showCloseButton={false} finalFocus={() => navigating.current ? false : triggerRef.current}>
        <SheetHeader className="gutter h-(--nav-h) shrink-0 flex-row items-center justify-between gap-4 border-b border-border py-0">
          <SheetTitle className="sr-only">{NAV.navigationLabel}</SheetTitle>
          <span className="font-serif text-2xl tracking-tight">{NAV.wordmark}</span>
          <SheetClose render={<Button variant="ghost" size="sm" />}>{NAV.closeMenu}</SheetClose>
        </SheetHeader>
        <nav aria-label={NAV.navigationLabel} className="gutter flex flex-1 flex-col justify-center gap-12 py-12">
          <ul className="flex flex-col gap-6">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={sectionHref(section.id)}
                  onClick={(event) => navigate(event, section.id)}
                  className="inline-block py-1 font-serif text-display-m text-foreground transition-colors hover:text-primary">
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
          <a href={sectionHref("contact")} onClick={(event) => navigate(event, "contact")} className={buttonVariants({ className: "self-start" })}>
            {NAV.consultation}
          </a>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
