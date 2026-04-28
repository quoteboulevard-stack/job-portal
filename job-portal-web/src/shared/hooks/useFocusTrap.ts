import { RefObject, useEffect, useRef } from "react";

const selector = 'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])';

export function useFocusTrap(isOpen: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!isOpen) return;
    triggerRef.current = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const focusables = () => Array.from(node?.querySelectorAll<HTMLElement>(selector) || []).filter((el) => !el.hasAttribute("disabled"));
    const first = focusables()[0];
    first?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        triggerRef.current?.focus();
        return;
      }
      if (e.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const start = items[0], end = items[items.length - 1], active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === start) { e.preventDefault(); end.focus(); }
      if (!e.shiftKey && active === end) { e.preventDefault(); start.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);
  useEffect(() => {
    if (!isOpen) triggerRef.current?.focus();
  }, [isOpen]);
  return { ref, triggerRef: triggerRef as RefObject<HTMLButtonElement> };
}
