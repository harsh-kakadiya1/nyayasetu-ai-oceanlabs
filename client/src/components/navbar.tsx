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
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [isClearingHistory, setIsClearingHistory] = useState(false);
  const { user, logout, updateProfile } = useAuth();

  useEffect(() => {
    setProfileName(user?.username || "");
  }, [user?.username]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const initials = (user?.username || "U")
    .trim()
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 2);

  const handleProfileSave = async () => {
    const nextName = profileName.trim();
    if (nextName.length < 3) {
      toast({
        title: "Invalid username",
        description: "Username must be at least 3 characters",
        variant: "destructive",
      });
      return;
    }

    const result = await updateProfile(nextName);
    if (!result.ok) {
      toast({
        title: "Profile update failed",
        description: result.error || "Please try again",
        variant: "destructive",
      });
      return;
    }

    setIsEditingProfile(false);
    toast({
      title: "Profile updated",
      description: "Your display name has been updated",
    });
  };

  const clearHistory = async () => {
    if (!confirm("Remove all analysis history? This cannot be undone.")) {
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
        title: "History cleared",
        description: "All analysis history was removed",
      });
    } catch {
      toast({
        title: "Could not clear history",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsClearingHistory(false);
    }
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-[#2d545c]/15 bg-[#f9f5eb]/80 backdrop-blur-md">
      <div className="w-full px-3 sm:px-4 lg:px-6">
      <div className="flex min-h-[68px] items-center justify-between py-3">
          {/* Logo & Branding */}
        <div className="flex flex-shrink-0 items-center space-x-2 sm:space-x-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1f525a] sm:h-9 sm:w-9">
          <Scale className="h-4 w-4 text-[#e8fff7] sm:h-5 sm:w-5" />
            </div>
            <div className="flex flex-col justify-center">
          <span className="font-display whitespace-nowrap text-base font-semibold leading-tight text-[#1f3c41] sm:text-lg">{t("brand.name")}</span>
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
              <Link href="/dashboard">
          <div className="flex h-10 items-center px-2">
            <span className={`whitespace-nowrap text-sm font-medium transition-colors lg:text-base ${
            location === "/dashboard" ? "text-[#1f4f57]" : "text-[#5f8187] hover:text-[#1f4f57]"
            }`}>
                    {t("navigation.dashboard")}
                  </span>
                </div>
              </Link>
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
                    <div>
                      <p className="text-sm font-semibold tracking-wide">{user.username}</p>
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
                    <span>Edit profile</span>
                  </button>

                  {isEditingProfile && (
                    <div className="space-y-2 rounded-lg border border-[#ffffff18] bg-[#ffffff08] p-3">
                      <Input
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="h-9 border-[#ffffff24] bg-[#232529] text-[#f5f9f9] placeholder:text-[#8ca0a4]"
                        placeholder="Enter username"
                      />
                      <Button
                        type="button"
                        size="sm"
                        className="h-8 w-full bg-[#e8edf0] text-[#1f2a2d] hover:bg-white"
                        onClick={handleProfileSave}
                      >
                        Save profile
                      </Button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      toast({ title: "Upgrade plan", description: "Pricing options are coming soon." })
                    }
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[15px] transition-colors hover:bg-[#ffffff12]"
                  >
                    <Crown className="h-4 w-4" />
                    <span>Upgrade plan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[15px] transition-colors hover:bg-[#ffffff12]"
                  >
                    <span className="flex items-center gap-3">
                      <Settings className="h-4 w-4" />
                      Settings
                    </span>
                    <ChevronRight className={`h-4 w-4 transition-transform ${isSettingsOpen ? "rotate-90" : ""}`} />
                  </button>

                  {isSettingsOpen && (
                    <div className="space-y-2 rounded-lg border border-[#ffffff18] bg-[#ffffff08] p-3 text-sm">
                      <div className="rounded-md border border-[#ffffff22] bg-[#1f565f33] px-3 py-2">
                        <p className="text-xs uppercase tracking-[0.08em] text-[#b8d5da]">Free tokens</p>
                        <p className="mt-1 text-base font-semibold text-white">{user.tokens}</p>
                      </div>
                      <p className="text-[#c6d0d2]">Manage analysis history</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="h-8 w-full"
                        onClick={clearHistory}
                        disabled={isClearingHistory}
                      >
                        {isClearingHistory ? "Removing..." : "Remove all history"}
                      </Button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={logout}
                    className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[15px] text-[#ffd9d3] transition-colors hover:bg-[#ff5f4b1a]"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log out</span>
                  </button>
                </div>
              </HoverCardContent>
            </HoverCard>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-[#5f8187] hover:text-[#1f4f57]">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="ghost" size="sm" className="text-[#5f8187] hover:text-[#1f4f57]">
                  Sign up
                </Button>
              </Link>
            </>
          )}
            </div>
          </div>

          {/* Mobile menu button */}
        <div className="flex flex-shrink-0 items-center space-x-2 md:hidden">
            <div className="flex-shrink-0">
              <LanguageSelector />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMenu}
          className="flex-shrink-0 p-2 text-[#2b555c]"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
        <div className="border-t border-[#2f5960]/20 bg-[#f9f5eb] md:hidden">
        <div className="space-y-3 py-4">
              <Link href="/" onClick={() => setIsMenuOpen(false)}>
          <div className="block rounded-lg px-4 py-2 text-base font-medium text-[#52767d] transition-colors hover:bg-[#e9f7f2] hover:text-[#264f56]">
                  {t("navigation.home", { defaultValue: "Home" })}
                </div>
              </Link>
              <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
          <div className="block rounded-lg px-4 py-2 text-base font-medium text-[#52767d] transition-colors hover:bg-[#e9f7f2] hover:text-[#264f56]">
                  {t("navigation.dashboard")}
                </div>
              </Link>
            <div className="border-t border-[#2f5960]/20 pt-3">
              {user ? (
                <>
                  <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                    <div className="block rounded-lg px-4 py-2 text-base font-medium text-[#52767d] transition-colors hover:bg-[#e9f7f2] hover:text-[#264f56]">
                      Dashboard
                    </div>
                  </Link>
                  <button
                    onClick={async () => {
                      await logout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full rounded-lg px-4 py-2 text-left text-base font-medium text-[#52767d] transition-colors hover:bg-[#e9f7f2] hover:text-[#264f56]"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                    <div className="block rounded-lg px-4 py-2 text-base font-medium text-[#52767d] transition-colors hover:bg-[#e9f7f2] hover:text-[#264f56]">
                      Login
                    </div>
                  </Link>
                  <Link href="/signup" onClick={() => setIsMenuOpen(false)}>
                    <div className="block rounded-lg px-4 py-2 text-base font-medium text-[#52767d] transition-colors hover:bg-[#e9f7f2] hover:text-[#264f56]">
                      Sign up
                    </div>
                  </Link>
                </>
              )}
            </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
