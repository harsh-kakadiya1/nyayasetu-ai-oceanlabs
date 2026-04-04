import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ChevronRight, Crown, LogOut, Menu, Scale, Settings, UserCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import LanguageSelector from "@/components/language-selector";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import API_ENDPOINTS from "@/lib/api";

export default function Navbar() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const { user, logout, updateProfile } = useAuth();

  useEffect(() => {
    setProfileName(user?.username || "");
  }, [user?.username]);

  const closeMobileMenu = () => {
    setIsMenuOpen(false);
    setIsEditingProfile(false);
    setIsSettingsOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen((prev) => {
      const next = !prev;
      if (!next) {
        setIsEditingProfile(false);
        setIsSettingsOpen(false);
      }
      return next;
    });
  };

  const scrollToLandingSection = (sectionId: "pricing" | "faqs") => {
    const smoothScroll = () => {
      const target = document.getElementById(sectionId);
      if (!target) {
        return false;
      }

      target.scrollIntoView({ behavior: "smooth", block: "start" });
      return true;
    };

    closeMobileMenu();

    if (location === "/") {
      smoothScroll();
      return;
    }

    setLocation("/");

    let attempts = 0;
    const maxAttempts = 20;
    const intervalId = window.setInterval(() => {
      attempts += 1;
      const done = smoothScroll();
      if (done || attempts >= maxAttempts) {
        window.clearInterval(intervalId);
      }
    }, 80);
  };

  const initials = (user?.username || "U")
    .trim()
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 2);

  const currentPlanLabel = (() => {
    const plan = user?.plan || "starter";
    if (plan === "professional") return "Professional";
    if (plan === "enterprise") return "Enterprise";
    return "Starter";
  })();

  const handleProfileSave = async () => {
    const nextName = profileName.trim();
    if (nextName.length < 3) {
      toast({
        title: t("navbar.invalidUsername"),
        description: t("navbar.usernameMinLength"),
        variant: "destructive",
      });
      return;
    }

    const result = await updateProfile(nextName);
    if (!result.ok) {
      toast({
        title: t("navbar.profileUpdateFailed"),
        description: result.error || t("navbar.tryAgain"),
        variant: "destructive",
      });
      return;
    }

    setIsEditingProfile(false);
    toast({
      title: t("navbar.profileUpdated"),
      description: t("navbar.displayNameUpdated"),
    });
  };

  const clearHistory = async () => {
    if (!confirm(t("navbar.clearHistoryConfirm"))) {
      return;
    }

    try {
      setIsClearingHistory(true);
      const response = await fetch(API_ENDPOINTS.history, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to clear history");
      }

      window.dispatchEvent(new Event("history:cleared"));
      toast({
        title: t("navbar.historyCleared"),
        description: t("navbar.allHistoryRemoved"),
      });
    } catch {
      toast({
        title: t("navbar.couldNotClearHistory"),
        description: t("navbar.tryAgain"),
        variant: "destructive",
      });
    } finally {
      setIsClearingHistory(false);
    }
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-[#2d545c]/15 bg-[#f9f5eb]/80 backdrop-blur-md">
      <div className="w-full px-3 sm:px-4 lg:px-6">
      <div className="flex min-h-[68px] items-center justify-between gap-2 py-3 sm:gap-3">
          {/* Logo & Branding */}
        <div className="flex min-w-0 flex-1 items-center space-x-2 sm:space-x-3 md:flex-none">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1f525a] sm:h-9 sm:w-9">
          <Scale className="h-4 w-4 text-[#e8fff7] sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0 flex flex-col justify-center">
          <span className="font-display block max-w-[9.5rem] truncate text-[0.95rem] font-semibold leading-tight text-[#1f3c41] sm:max-w-none sm:text-lg">{t("brand.name")}</span>
          <span className="-mt-1 hidden text-xs text-[#61868d] sm:block">{t("brand.tagline")}</span>
            </div>
          </div>

          {/* Desktop Navigation */}
        <div className="hidden h-full flex-shrink-0 items-center space-x-4 md:flex lg:space-x-6">
        <div className="flex h-full items-center space-x-4 lg:space-x-6">
              <Link href="/">
          <div className="flex h-10 items-center px-2">
            <span className={`whitespace-nowrap text-sm font-medium transition-colors lg:text-base ${
            location === "/" ? "text-[#1f4f57]" : "text-[#5f8187] hover:text-[#1f4f57]"
            }`}>
                    {t("navigation.home", { defaultValue: "Home" })}
                  </span>
                </div>
              </Link>
              {user ? (
                <Link href="/dashboard">
            <div className="flex h-10 items-center px-2">
              <span className={`whitespace-nowrap text-sm font-medium transition-colors lg:text-base ${
              location === "/dashboard" ? "text-[#1f4f57]" : "text-[#5f8187] hover:text-[#1f4f57]"
              }`}>
                      {t("navigation.dashboard")}
                    </span>
                  </div>
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => scrollToLandingSection("pricing")}
                    className="flex h-10 items-center px-2 text-sm font-medium text-[#5f8187] transition-colors hover:text-[#1f4f57] lg:text-base"
                  >
                    {t("navigation.pricing")}
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToLandingSection("faqs")}
                    className="flex h-10 items-center px-2 text-sm font-medium text-[#5f8187] transition-colors hover:text-[#1f4f57] lg:text-base"
                  >
                    {t("navigation.faqs")}
                  </button>
                </>
              )}
          {user?.isAdmin && (
            <Link href="/admin">
              <div className="flex h-10 items-center px-2">
                <span
                  className={`whitespace-nowrap text-sm font-medium transition-colors lg:text-base ${
                    location === "/admin" ? "text-[#1f4f57]" : "text-[#5f8187] hover:text-[#1f4f57]"
                  }`}
                >
                  Admin
                </span>
              </div>
            </Link>
          )}
          <div className="flex h-10 items-center">
                <LanguageSelector />
              </div>
          {user ? (
            <HoverCard openDelay={120} closeDelay={180}>
              <HoverCardTrigger asChild>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#2f5960]/20 bg-white/75 transition-colors hover:border-[#2f5960]/35 hover:bg-[#eef8f5]"
                  aria-label="Open profile menu"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-[#e24f3d] text-xs font-semibold text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </HoverCardTrigger>
              <HoverCardContent align="end" sideOffset={12} className="w-[320px] rounded-2xl border-[#355a60]/25 bg-[#2f3135] p-3 text-[#f7f9fa]">
                <div className="rounded-xl bg-[#ffffff08] px-3 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-[#e24f3d] text-sm font-semibold text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold tracking-wide">{user.username}</p>
                        <span className="rounded-full border border-[#ffffff1f] bg-[#ffffff10] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#d5e3e6]">
                          {currentPlanLabel}
                        </span>
                      </div>
                      <p className="text-xs text-[#b6c3c6]">nyayasetu.ai</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile((prev) => !prev)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[15px] transition-colors hover:bg-[#ffffff12]"
                  >
                    <UserCircle2 className="h-4 w-4" />
                    <span>{t("navbar.editProfile")}</span>
                  </button>

                  {isEditingProfile && (
                    <div className="space-y-2 rounded-lg border border-[#ffffff18] bg-[#ffffff08] p-3">
                      <Input
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="h-9 border-[#ffffff24] bg-[#232529] text-[#f5f9f9] placeholder:text-[#8ca0a4]"
                        placeholder={t("navbar.enterUsername")}
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 w-full bg-[#e8edf0] text-[#1f2a2d] hover:bg-white"
                        onClick={handleProfileSave}
                      >
                        {t("navbar.saveProfile")}
                      </Button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => scrollToLandingSection("pricing")}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[15px] transition-colors hover:bg-[#ffffff12]"
                  >
                    <Crown className="h-4 w-4" />
                    <span>{t("navbar.upgradePlan")}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[15px] transition-colors hover:bg-[#ffffff12]"
                  >
                    <span className="flex items-center gap-3">
                      <Settings className="h-4 w-4" />
                      {t("navigation.settings")}
                    </span>
                    <ChevronRight className={`h-4 w-4 transition-transform ${isSettingsOpen ? "rotate-90" : ""}`} />
                  </button>

                  {isSettingsOpen && (
                    <div className="space-y-2 rounded-lg border border-[#ffffff18] bg-[#ffffff08] p-3 text-sm">
                      <div className="rounded-md border border-[#ffffff22] bg-[#1f565f33] px-3 py-2">
                        <p className="text-xs uppercase tracking-[0.08em] text-[#b8d5da]">Current plan</p>
                        <p className="mt-1 text-base font-semibold text-white">{currentPlanLabel}</p>
                      </div>
                      <div className="rounded-md border border-[#ffffff22] bg-[#1f565f33] px-3 py-2">
                        <p className="text-xs uppercase tracking-[0.08em] text-[#b8d5da]">{t("navbar.freeTokens")}</p>
                        <p className="mt-1 text-base font-semibold text-white">{user.tokens}</p>
                      </div>
                      <p className="text-[#c6d0d2]">{t("navbar.manageHistory")}</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="h-8 w-full"
                        onClick={clearHistory}
                        disabled={isClearingHistory}
                      >
                        {isClearingHistory ? t("navbar.removing") : t("navbar.removeAllHistory")}
                      </Button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={logout}
                    className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[15px] text-[#ffd9d3] transition-colors hover:bg-[#ff5f4b1a]"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{t("navbar.logout")}</span>
                  </button>
                </div>
              </HoverCardContent>
            </HoverCard>
          ) : (
            <Link href="/login">
              <Button
                size="sm"
                className="rounded-full bg-[#1f565f] px-5 text-white shadow-[0_8px_18px_rgba(31,86,95,0.22)] hover:bg-[#173f46]"
              >
                {t("navigation.getStarted")}
              </Button>
            </Link>
          )}
            </div>
          </div>

          {/* Mobile menu button */}
        <div className="flex flex-shrink-0 items-center space-x-1.5 md:hidden">
            {user && (
              <button
                type="button"
                onClick={toggleMenu}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#2f5960]/20 bg-white/80 transition-colors hover:border-[#2f5960]/35 hover:bg-[#eef8f5]"
                aria-label="Open profile menu"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-[#e24f3d] text-[10px] font-semibold text-white">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            )}
            <div className="flex-shrink-0">
              <LanguageSelector />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMenu}
          className="h-9 w-9 flex-shrink-0 p-0 text-[#2b555c]"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
        <div className="border-t border-[#2f5960]/20 bg-[#f9f5eb] md:hidden">
        <div className="space-y-2 px-3 py-4">
              <Link href="/" onClick={closeMobileMenu}>
          <div className="block rounded-lg px-4 py-2 text-base font-medium text-[#52767d] transition-colors hover:bg-[#e9f7f2] hover:text-[#264f56]">
                  {t("navigation.home", { defaultValue: "Home" })}
                </div>
              </Link>
              {user ? (
                <>
                <Link href="/dashboard" onClick={closeMobileMenu}>
            <div className="block rounded-lg px-4 py-2 text-base font-medium text-[#52767d] transition-colors hover:bg-[#e9f7f2] hover:text-[#264f56]">
                    {t("navigation.dashboard")}
                  </div>
                </Link>

                <div className="rounded-xl border border-[#2f5960]/18 bg-white/75 p-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-[#e24f3d] text-xs font-semibold text-white">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#1f3c41]">{user.username}</p>
                      <p className="mt-0.5 text-xs text-[#61868d]">{currentPlanLabel} · {t("navbar.freeTokens")}: {user.tokens}</p>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile((prev) => !prev)}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-[#476d74] transition-colors hover:bg-[#e9f7f2] hover:text-[#264f56]"
                    >
                      <UserCircle2 className="h-4 w-4" />
                      {t("navbar.editProfile")}
                    </button>

                    {isEditingProfile && (
                      <div className="space-y-2 rounded-lg border border-[#2f5960]/15 bg-white p-2">
                        <Input
                          value={profileName}
                          onChange={(e) => setProfileName(e.target.value)}
                          className="h-9 border-[#2f5960]/20 bg-white"
                          placeholder={t("navbar.enterUsername")}
                        />
                        <Button
                          type="button"
                          size="sm"
                          className="h-9 w-full bg-[#1f565f] text-white hover:bg-[#173f46]"
                          onClick={handleProfileSave}
                        >
                          {t("navbar.saveProfile")}
                        </Button>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => scrollToLandingSection("pricing")}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-[#476d74] transition-colors hover:bg-[#e9f7f2] hover:text-[#264f56]"
                    >
                      <Crown className="h-4 w-4" />
                      {t("navbar.upgradePlan")}
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsSettingsOpen((prev) => !prev)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium text-[#476d74] transition-colors hover:bg-[#e9f7f2] hover:text-[#264f56]"
                    >
                      <span className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        {t("navigation.settings")}
                      </span>
                      <ChevronRight className={`h-4 w-4 transition-transform ${isSettingsOpen ? "rotate-90" : ""}`} />
                    </button>

                    {isSettingsOpen && (
                      <div className="space-y-2 rounded-lg border border-[#2f5960]/15 bg-white p-2 text-sm text-[#35565c]">
                        <div className="rounded-md border border-[#2f5960]/15 bg-[#f7fbf9] px-3 py-2">
                          <p className="text-[11px] uppercase tracking-[0.08em] text-[#6b8a90]">Current plan</p>
                          <p className="mt-0.5 font-semibold text-[#1f3c41]">{currentPlanLabel}</p>
                        </div>
                        <div className="rounded-md border border-[#2f5960]/15 bg-[#f7fbf9] px-3 py-2">
                          <p className="text-[11px] uppercase tracking-[0.08em] text-[#6b8a90]">{t("navbar.freeTokens")}</p>
                          <p className="mt-0.5 font-semibold text-[#1f3c41]">{user.tokens}</p>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="h-9 w-full"
                          onClick={clearHistory}
                          disabled={isClearingHistory}
                        >
                          {isClearingHistory ? t("navbar.removing") : t("navbar.removeAllHistory")}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => scrollToLandingSection("pricing")}
                    className="block w-full rounded-lg px-4 py-2 text-left text-base font-medium text-[#52767d] transition-colors hover:bg-[#e9f7f2] hover:text-[#264f56]"
                  >
                    {t("navigation.pricing")}
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollToLandingSection("faqs")}
                    className="block w-full rounded-lg px-4 py-2 text-left text-base font-medium text-[#52767d] transition-colors hover:bg-[#e9f7f2] hover:text-[#264f56]"
                  >
                    {t("navigation.faqs")}
                  </button>
                </>
              )}
            <div className="border-t border-[#2f5960]/20 pt-3">
              {user ? (
                <>
                  <button
                    onClick={async () => {
                      await logout();
                      closeMobileMenu();
                    }}
                    className="block w-full rounded-lg px-4 py-2 text-left text-base font-medium text-[#52767d] transition-colors hover:bg-[#e9f7f2] hover:text-[#264f56]"
                  >
                    {t("navbar.logout")}
                  </button>
                </>
              ) : (
                <Link href="/login" onClick={closeMobileMenu}>
                  <div className="block rounded-lg bg-[#1f565f] px-4 py-2 text-base font-semibold text-white transition-colors hover:bg-[#173f46]">
                    {t("navigation.getStarted")}
                  </div>
                </Link>
              )}
            </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
