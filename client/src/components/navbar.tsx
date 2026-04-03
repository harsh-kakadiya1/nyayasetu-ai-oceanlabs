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
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center justify-between py-3">
          {/* Logo & Branding */}
          <div className="flex flex-shrink-0 items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400">
              <Scale className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col justify-center">
              <span className="font-display whitespace-nowrap text-lg font-bold leading-tight text-white">{t("brand.name")}</span>
              <span className="-mt-1 hidden text-xs text-gray-400 sm:block">{t("brand.tagline")}</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden h-full flex-shrink-0 items-center space-x-1 md:flex">
            <Link href="/">
              <div className="flex h-10 items-center px-3">
                <span
                  className={`whitespace-nowrap text-sm font-medium transition-colors ${
                    location === "/" ? "text-blue-400" : "text-gray-300 hover:text-white"
                  }`}
                >
                  {t("navigation.home", { defaultValue: "Home" })}
                </span>
              </div>
            </Link>
            <Link href="/dashboard">
              <div className="flex h-10 items-center px-3">
                <span
                  className={`whitespace-nowrap text-sm font-medium transition-colors ${
                    location === "/dashboard" ? "text-blue-400" : "text-gray-300 hover:text-white"
                  }`}
                >
                  {t("navigation.dashboard")}
                </span>
              </div>
            </Link>
            <div className="flex h-10 items-center px-2">
              <LanguageSelector />
            </div>
          </div>

          {/* Auth Section */}
          <div className="flex flex-shrink-0 items-center space-x-3">
            <div className="hidden md:flex md:items-center md:space-x-2">
              {user ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-300 hover:text-white"
                  onClick={logout}
                >
                  Logout
                </Button>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                      Login
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button
                      size="sm"
                      className="rounded-full bg-blue-600 text-white hover:bg-blue-700"
                    >
                      Sign up
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMenu}
              className="flex-shrink-0 p-2 text-gray-300 md:hidden"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="border-t border-white/10 bg-black/60 md:hidden">
            <div className="space-y-2 py-3 px-2">
              <Link href="/" onClick={() => setIsMenuOpen(false)}>
                <div className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white">
                  {t("navigation.home", { defaultValue: "Home" })}
                </div>
              </Link>
              <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                <div className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white">
                  {t("navigation.dashboard")}
                </div>
              </Link>
              <div className="border-t border-white/10 pt-2">
                {user ? (
                  <button
                    onClick={async () => {
                      await logout();
                      setIsMenuOpen(false);
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    Logout
                  </button>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                      <div className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white">
                        Login
                      </div>
                    </Link>
                    <Link href="/signup" onClick={() => setIsMenuOpen(false)}>
                      <div className="block rounded-lg px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
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
