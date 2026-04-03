import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, Scale, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import LanguageSelector from "@/components/language-selector";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";

export default function Navbar() {
  const { t } = useTranslation();
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <nav className="sticky top-0 z-40 border-b border-[#2d545c]/10 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-10">
      <div className="flex min-h-[68px] items-center justify-between py-3">
          {/* Logo & Branding */}
        <div className="flex flex-shrink-0 items-center space-x-2 sm:space-x-3 group cursor-pointer">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#1f565f] to-[#235962] shadow-lg group-hover:shadow-xl transition-all duration-300 sm:h-10 sm:w-10">
          <Scale className="h-5 w-5 text-white sm:h-6 sm:w-6 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <div className="flex flex-col justify-center">
          <span className="font-display whitespace-nowrap text-base font-bold leading-tight text-[#1f3c41] sm:text-lg">{t("brand.name")}</span>
          <span className="-mt-1 hidden text-xs text-[#61868d] sm:block font-medium">{t("brand.tagline")}</span>
            </div>
          </div>

          {/* Desktop Navigation */}
        <div className="hidden h-full flex-shrink-0 items-center space-x-6 md:flex lg:space-x-8">
        <div className="flex h-full items-center space-x-6 lg:space-x-8">
              <Link href="/">
          <div className="flex h-10 items-center px-2 relative group">
            <span className={`whitespace-nowrap text-sm font-semibold transition-colors lg:text-base ${
            location === "/" ? "text-[#1f4f57]" : "text-[#6d8b90] hover:text-[#1f4f57]"
            }`}>
                    {t("navigation.home", { defaultValue: "Home" })}
                  </span>
                  {location === "/" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1f4f57]" />}
                </div>
              </Link>
              <Link href="/dashboard">
          <div className="flex h-10 items-center px-2 relative group">
            <span className={`whitespace-nowrap text-sm font-semibold transition-colors lg:text-base ${
            location === "/dashboard" ? "text-[#1f4f57]" : "text-[#6d8b90] hover:text-[#1f4f57]"
            }`}>
                    {t("navigation.dashboard")}
                  </span>
                  {location === "/dashboard" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1f4f57]" />}
                </div>
              </Link>
          <div className="flex h-10 items-center">
                <LanguageSelector />
              </div>
          {user ? (
            <>
              <Button variant="ghost" size="sm" className="text-[#6d8b90] hover:text-[#1f4f57] hover:bg-[#f0f8f6]" onClick={logout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-[#6d8b90] hover:text-[#1f4f57] hover:bg-[#f0f8f6]">
                  Login
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="rounded-full bg-[#1f565f] px-6 text-white hover:bg-[#173f46] font-semibold shadow-md hover:shadow-lg transition-all duration-300">
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
