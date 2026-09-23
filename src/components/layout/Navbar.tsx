"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import {
  ChevronDown,
  Globe2,
  LayoutDashboard,
  LogOut,
  Menu,
  PlusCircle,
  Search,
  Shield,
  User,
  X,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Wordmark } from "@/components/layout/Brand";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/store/auth";
import { cn } from "@/lib/utils";

/**
 * Compact two-tier desktop-store shell:
 * a dark global bar (brand, sections, account) and a blue store bar
 * (discovery links plus a working search form).
 */
export function Navbar({ locale }: { locale: string }) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { profile, setProfile } = useAuthStore();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [query, setQuery] = useState("");
  const accountRef = useRef<HTMLDivElement>(null);

  const otherLocale = locale === "ar" ? "en" : "ar";
  const isAdmin = profile?.role === "admin" || profile?.role === "super_admin";
  const isContributor = profile?.role === "contributor" || isAdmin;

  useEffect(() => {
    if (!accountOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [accountOpen]);

  const primaryLinks = [
    { href: "/", label: t("store") },
    { href: "/games", label: t("games") },
    { href: "/developers", label: t("developers") },
    { href: "/about", label: t("about") },
  ];

  const discoverLinks = [
    { href: "/", label: t("featured") },
    { href: "/games?sort=release_date", label: t("new_releases") },
    { href: "/games?sort=average_rating", label: t("top_rated") },
    { href: "/games?sort=view_count", label: t("most_viewed") },
    { href: "/games", label: t("browse_all") },
  ];

  const isActive = (href: string) => {
    const path = href.split("?")[0];
    return path === "/" ? pathname === "/" : pathname.startsWith(path);
  };

  const accountLinks = [
    { href: "/profile", label: t("profile"), icon: User },
    ...(isContributor
      ? [
          { href: "/dashboard", label: t("dashboard"), icon: LayoutDashboard },
          { href: "/submit", label: t("submit"), icon: PlusCircle },
        ]
      : []),
    ...(isAdmin ? [{ href: "/admin", label: t("admin"), icon: Shield }] : []),
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setAccountOpen(false);
    setMobileOpen(false);
    router.push("/");
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const term = query.trim();
    setMobileOpen(false);
    router.push(term ? `/games?search=${encodeURIComponent(term)}` : "/games");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-black/50 bg-eg-header">
      {/* Global bar: brand, sections, account */}
      <div className="store-container flex h-12 items-center gap-3">
        <Link
          href="/"
          className="shrink-0 rounded-sm"
          aria-label="EGGameDB"
          onClick={() => setMobileOpen(false)}
        >
          <Wordmark />
        </Link>

        <nav aria-label="Primary" className="hidden items-center md:flex">
          {primaryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={cn(
                "rounded-sm px-3 py-1.5 text-[13px] transition-colors",
                isActive(link.href)
                  ? "bg-white/[0.07] text-white"
                  : "text-eg-text-sub hover:bg-white/[0.05] hover:text-white"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-1.5">
          <Link
            href={pathname}
            locale={otherLocale}
            className="hidden items-center gap-1.5 rounded-sm px-2 py-1.5 text-[13px] text-eg-text-sub transition-colors hover:bg-white/[0.05] hover:text-white sm:flex"
            aria-label={tc("language")}
          >
            <Globe2 size={15} aria-hidden="true" />
            <span>{locale === "en" ? "العربية" : "English"}</span>
          </Link>

          {profile ? (
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                onClick={() => setAccountOpen((open) => !open)}
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                className="flex items-center gap-2 rounded-sm px-1.5 py-1 text-[13px] text-eg-text-sub transition-colors hover:bg-white/[0.05] hover:text-white"
              >
                <Avatar
                  src={profile.avatar_url}
                  name={profile.display_name || profile.username}
                  size="xs"
                />
                <span className="hidden max-w-28 truncate sm:inline">
                  {profile.display_name || profile.username}
                </span>
                <ChevronDown size={14} aria-hidden="true" />
              </button>

              {accountOpen && (
                <div
                  role="menu"
                  aria-label={t("account")}
                  className="absolute end-0 top-full z-50 mt-1 w-56 border border-eg-border bg-eg-darker py-1 shadow-[0_10px_24px_rgba(0,0,0,0.45)]"
                >
                  <div className="border-b border-eg-border px-3 py-2">
                    <p className="truncate text-[13px] font-semibold text-white">
                      {profile.display_name || profile.username}
                    </p>
                    <p className="mt-0.5 text-[11px] text-eg-muted">
                      {profile.role.replace("_", " ")}
                    </p>
                  </div>
                  {accountLinks.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      role="menuitem"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-eg-text-sub transition-colors hover:bg-white/[0.06] hover:text-white"
                    >
                      <Icon size={14} aria-hidden="true" />
                      {label}
                    </Link>
                  ))}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 border-t border-eg-border px-3 py-2 text-[13px] text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200"
                  >
                    <LogOut size={14} aria-hidden="true" />
                    {t("logout")}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden items-center gap-1.5 md:flex">
              <Link
                href="/login"
                className="rounded-sm px-3 py-1.5 text-[13px] text-eg-text-sub transition-colors hover:bg-white/[0.05] hover:text-white"
              >
                {t("login")}
              </Link>
              <Link
                href="/register"
                className="rounded-sm bg-eg-blue px-3 py-1.5 text-[13px] font-medium text-[#0f1a24] transition-colors hover:bg-[#8bd2fa]"
              >
                {t("register")}
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
            aria-label={mobileOpen ? tc("close") : tc("menu")}
            className="flex h-8 w-8 items-center justify-center rounded-sm text-eg-text-sub transition-colors hover:bg-white/[0.05] hover:text-white md:hidden"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Store bar: discovery links and a real search form */}
      <div className="bg-eg-nav">
        <div className="store-container flex h-10 items-center gap-2">
          <nav aria-label="Store" className="hidden items-center md:flex">
            {discoverLinks.map((link) => (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                aria-current={!link.href.includes("?") && isActive(link.href) ? "page" : undefined}
                className={cn(
                  "rounded-sm px-2.5 py-1 text-[13px] whitespace-nowrap transition-colors",
                  !link.href.includes("?") && isActive(link.href)
                    ? "bg-black/25 text-white"
                    : "text-[#d5e6f5] hover:bg-black/20 hover:text-white"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <form onSubmit={handleSearch} role="search" className="ms-auto w-full md:w-auto">
            <label htmlFor="store-search" className="sr-only">
              {tc("search")}
            </label>
            <div className="flex h-7 items-center overflow-hidden rounded-sm bg-[#0f1a24]/70 focus-within:ring-1 focus-within:ring-eg-blue">
              <input
                id="store-search"
                type="search"
                name="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("search_store")}
                className="h-full w-full min-w-0 bg-transparent px-2.5 text-[13px] text-white placeholder:text-[#8fa9bf] focus:outline-none md:w-52"
              />
              <button
                type="submit"
                aria-label={tc("search")}
                className="flex h-7 w-8 shrink-0 items-center justify-center text-[#cfe4f5] transition-colors hover:bg-black/25 hover:text-white"
              >
                <Search size={14} aria-hidden="true" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Mobile navigation — complete for signed-in and anonymous visitors */}
      {mobileOpen && (
        <div id="mobile-navigation" className="border-t border-eg-border bg-eg-darker md:hidden">
          <div className="store-container space-y-4 py-4">
            <div>
              <p className="mb-1.5 text-[11px] font-semibold text-eg-muted">{t("store")}</p>
              <div className="grid grid-cols-2 gap-1">
                {primaryLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    aria-current={isActive(link.href) ? "page" : undefined}
                    className={cn(
                      "rounded-sm border border-eg-border px-3 py-2 text-[13px]",
                      isActive(link.href)
                        ? "bg-white/[0.07] text-white"
                        : "bg-eg-card text-eg-text-sub"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-semibold text-eg-muted">{t("discover")}</p>
              <div className="flex flex-wrap gap-1.5">
                {discoverLinks.map((link) => (
                  <Link
                    key={`mobile-${link.href}-${link.label}`}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-sm border border-eg-border bg-eg-card px-2.5 py-1.5 text-[12px] text-eg-text-sub"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 border-t border-eg-border pt-3">
              <Link
                href={pathname}
                locale={otherLocale}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-1.5 rounded-sm border border-eg-border px-2.5 py-1.5 text-[12px] text-eg-text-sub"
              >
                <Globe2 size={14} aria-hidden="true" />
                {locale === "en" ? "العربية" : "English"}
              </Link>

              {profile ? (
                <>
                  {accountLinks.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={`mobile-${href}`}
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-1.5 rounded-sm border border-eg-border px-2.5 py-1.5 text-[12px] text-eg-text-sub"
                    >
                      <Icon size={14} aria-hidden="true" />
                      {label}
                    </Link>
                  ))}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 rounded-sm border border-red-500/30 px-2.5 py-1.5 text-[12px] text-red-300"
                  >
                    <LogOut size={14} aria-hidden="true" />
                    {t("logout")}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-sm border border-eg-border px-2.5 py-1.5 text-[12px] text-eg-text-sub"
                  >
                    {t("login")}
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-sm bg-eg-blue px-2.5 py-1.5 text-[12px] font-medium text-[#0f1a24]"
                  >
                    {t("register")}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
