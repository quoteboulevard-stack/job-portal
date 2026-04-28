import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { NotificationDropdown, UserMenuDropdown } from "./HeaderMenu";

const MenuIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6" strokeWidth="2" /><line x1="3" y1="12" x2="21" y2="12" strokeWidth="2" /><line x1="3" y1="18" x2="21" y2="18" strokeWidth="2" /></svg>;
const XIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" /><line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" /></svg>;
const BellIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" strokeWidth="2" /><path d="M10 20a2 2 0 0 0 4 0" strokeWidth="2" /></svg>;
const UserIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" strokeWidth="2" /><path d="M4 20a8 8 0 0 1 16 0" strokeWidth="2" /></svg>;

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false), [notificationsOpen, setNotificationsOpen] = useState(false), [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const mobileButtonRef = useRef<HTMLButtonElement | null>(null), notificationsRef = useRef<HTMLButtonElement | null>(null), userMenuRef = useRef<HTMLButtonElement | null>(null), mobileNavRef = useRef<HTMLDivElement | null>(null);
  const navItems = useMemo(() => [{ path: "/jobs", label: "Browse Jobs" }, { path: "/applications", label: "Applications" }, { path: "/messages", label: "Messages" }], []);
  const closeMenus = () => { setNotificationsOpen(false); setIsUserMenuOpen(false); };
  const handleNavigation = (path: string) => { navigate(path); setIsMobileMenuOpen(false); closeMenus(); };
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const getItems = () => Array.from(mobileNavRef.current?.querySelectorAll<HTMLElement>('a,input,[tabindex]:not([tabindex="-1"])') || []);
    getItems()[0]?.focus();
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") { setIsMobileMenuOpen(false); mobileButtonRef.current?.focus(); }
      if (e.key !== "Tab") return;
      const items = getItems(), first = items[0], last = items[items.length - 1];
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isMobileMenuOpen]);
  return (
    <header className="sticky top-0 z-50 border-b border-border-gray bg-white/95 backdrop-blur-md">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:text-gray-900">Skip to main content</a>
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link to="/" aria-label="Job Portal Home" className="rounded-lg px-2 py-1 text-xl font-bold text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue">JobPortal</Link>
        <div className="hidden max-w-md flex-1 md:block">
          <label htmlFor="search-jobs" className="block text-sm font-medium text-gray-700">Search jobs</label>
          <input id="search-jobs" name="search" autoComplete="off" type="search" placeholder={"Search by title, company, skills\u2026"} aria-label="Search jobs by title, company, or skills" className="mt-1 w-full rounded-lg border-2 border-gray-300 px-4 py-2 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200" />
        </div>
        <nav aria-label="Primary navigation" className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => <Link key={item.path} to={item.path} className="rounded-lg px-2 py-1 text-gray-600 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue">{item.label}</Link>)}
        </nav>
        <div className="relative flex items-center gap-3">
          <button ref={notificationsRef} type="button" aria-label="Notifications" aria-expanded={notificationsOpen} aria-controls="notifications-menu" onClick={() => { setNotificationsOpen((v) => !v); setIsUserMenuOpen(false); }} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue"><BellIcon /></button>
          <NotificationDropdown id="notifications-menu" open={notificationsOpen} onClose={() => setNotificationsOpen(false)} returnFocusRef={notificationsRef} items={[{ label: "New applicants", onSelect: () => handleNavigation("/notifications") }, { label: "Message requests", onSelect: () => handleNavigation("/notifications") }, { label: "Saved job alerts", onSelect: () => handleNavigation("/notifications") }]} />
          <div className="relative">
            <button ref={userMenuRef} type="button" aria-label="User menu" aria-expanded={isUserMenuOpen} aria-controls="user-menu" onClick={() => { setIsUserMenuOpen((v) => !v); setNotificationsOpen(false); }} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue"><UserIcon /></button>
            <UserMenuDropdown id="user-menu" open={isUserMenuOpen} onClose={() => setIsUserMenuOpen(false)} returnFocusRef={userMenuRef} items={[{ label: "Profile", onSelect: () => handleNavigation("/profile") }, { label: "Settings", onSelect: () => handleNavigation("/settings") }, { label: "Logout", onSelect: () => handleNavigation("/logout"), tone: "danger" }]} />
          </div>
          <button ref={mobileButtonRef} type="button" aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"} aria-expanded={isMobileMenuOpen} aria-controls="mobile-nav" onClick={() => setIsMobileMenuOpen((v) => !v)} className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue md:hidden">{isMobileMenuOpen ? <XIcon /> : <MenuIcon />}</button>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div ref={mobileNavRef} id="mobile-nav" className="border-t border-border-gray bg-gray-50 md:hidden">
          <nav aria-label="Mobile navigation" className="grid">
            {navItems.map((item) => <Link key={item.path} to={item.path} onClick={() => { setIsMobileMenuOpen(false); closeMenus(); }} className="px-4 py-2 text-gray-700 hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-blue">{item.label}</Link>)}
          </nav>
          <div className="border-t border-border-gray px-4 py-4">
            <label htmlFor="search-mobile" className="block text-sm font-medium text-gray-700">Search jobs</label>
            <input id="search-mobile" name="search" autoComplete="off" type="search" placeholder={"Search\u2026"} className="mt-1 w-full rounded-lg border-2 border-gray-300 px-3 py-2 focus-visible:border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200" />
          </div>
        </div>
      )}
    </header>
  );
}
