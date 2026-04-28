import { KeyboardEvent, RefObject, useEffect, useRef } from "react";

type Item = { label: string; onSelect: () => void; tone?: "default" | "danger" };
type MenuProps = { id: string; open: boolean; label: string; items: Item[]; onClose: () => void; returnFocusRef: RefObject<HTMLButtonElement | null> };

function Dropdown({ id, open, label, items, onClose, returnFocusRef }: MenuProps) {
  const ref = useRef<HTMLDivElement | null>(null), itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  useEffect(() => { if (open) itemRefs.current[0]?.focus(); }, [open]);
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) { onClose(); returnFocusRef.current?.focus(); } };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, [open, onClose, returnFocusRef]);
  if (!open) return null;
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const active = itemRefs.current.findIndex((item) => item === document.activeElement);
    if (e.key === "Escape") { onClose(); returnFocusRef.current?.focus(); }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      itemRefs.current[(active + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length]?.focus();
    }
    if (e.key === "Tab") {
      const first = itemRefs.current[0], last = itemRefs.current[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }
  };
  return (
    <div id={id} ref={ref} role="menu" aria-label={label} onKeyDown={onKeyDown} className="absolute right-0 top-[calc(100%+8px)] grid min-w-[180px] gap-1 rounded-lg border border-border-gray bg-bg-white p-2 shadow-md">
      {items.map((item, index) => (
        <button key={item.label} ref={(node) => { itemRefs.current[index] = node; }} type="button" role="menuitem" onClick={item.onSelect} className={`rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-blue ${item.tone === "danger" ? "text-red-600" : "text-gray-700"}`}>
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function NotificationDropdown(props: Omit<MenuProps, "label">) {
  return <Dropdown label="Notifications menu" {...props} />;
}

export function UserMenuDropdown(props: Omit<MenuProps, "label">) {
  return <Dropdown label="User menu" {...props} />;
}
