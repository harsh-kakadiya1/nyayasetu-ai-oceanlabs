import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, signup, googleLogin } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const isSignupMode = location === "/signup";

  const switchMode = (mode: "login" | "signup") => {
    if (mode === "login") {
      setLocation("/login");
      return;
    }

    setLocation("/signup");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!username.trim() || !password.trim() || (isSignupMode && !confirmPassword.trim())) {
      toast({
        title: "Missing fields",
        description: isSignupMode
          ? "Please fill all fields."
          : "Please enter both username and password.",
        variant: "destructive",
      });
      return;
    }

    if (isSignupMode && password.length < 6) {
      toast({
        title: "Weak password",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (isSignupMode && password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please confirm your password again.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const ok = isSignupMode
      ? await signup(username.trim(), password)
      : await login(username.trim(), password);
    setIsSubmitting(false);

    if (ok) {
      toast({
        title: isSignupMode ? "Account created" : "Welcome back",
        description: isSignupMode ? "Welcome to Nyayasetu AI." : "You are now logged in.",
      });
      setLocation("/dashboard");
    } else {
      toast({
        title: isSignupMode ? "Signup failed" : "Login failed",
        description: isSignupMode
          ? "Username may already exist."
          : "Invalid username or password.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f5f0] via-[#f0f7f4] to-[#f8f9f8] px-4 py-10 flex items-center justify-center">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-[#1f565f]/12 bg-white/95 p-6 shadow-[0_8px_32px_rgba(31,86,95,0.08)] backdrop-blur-md sm:p-8">
        <div className="relative mb-6 rounded-lg border border-[#1f565f]/15 bg-[#f3f8f6] p-1">
          <div
            className={`absolute left-1 top-1 h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-md bg-white shadow-[0_2px_8px_rgba(31,86,95,0.1)] transition-transform duration-300 ${
              isSignupMode ? "translate-x-full" : "translate-x-0"
            }`}
          />
          <div className="relative grid grid-cols-2">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`h-10 rounded-md text-sm font-bold transition-colors ${
                !isSignupMode ? "text-[#1f3c41]" : "text-[#7f9a9f]"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`h-10 rounded-md text-sm font-bold transition-colors ${
                isSignupMode ? "text-[#1f3c41]" : "text-[#7f9a9f]"
              }`}
            >
              Sign up
            </button>
          </div>
        </div>

        <h1 className="font-display text-3xl font-bold text-[#1f3c41]">
          {isSignupMode ? "Create account" : "Welcome back"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[#5f8187]">
          {isSignupMode
            ? "Create your account to save analysis history securely."
            : "Access your analysis dashboard and saved history."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder={isSignupMode ? "Choose a username" : "Enter your username"}
              autoComplete="username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={isSignupMode ? "Create a password" : "Enter your password"}
              autoComplete={isSignupMode ? "new-password" : "current-password"}
            />
          </div>

          <div
            className={`grid transition-all duration-300 ${
              isSignupMode ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            }`}
          >
            <div className="overflow-hidden">
              <div className="space-y-2 pb-1">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat your password"
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full h-10 rounded-lg bg-gradient-to-r from-[#1f565f] to-[#173f46] text-white font-semibold hover:from-[#173f46] hover:to-[#0f2b31] shadow-[0_4px_12px_rgba(31,86,95,0.15)] transition-all duration-300" disabled={isSubmitting}>
            {isSubmitting
              ? isSignupMode
                ? "Creating account..."
                : "Signing in..."
              : isSignupMode
                ? "Create account"
                : "Sign in"}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#1f565f]/15"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-[#5f8187]">
                {isSignupMode ? "Or sign up with" : "Or continue with"}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full h-10 border-[#1f565f]/20 hover:bg-[#f8f5f0] text-[#1f3c41]"
            onClick={googleLogin}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {isSignupMode ? "Sign up with Google" : "Sign in with Google"}
          </Button>
        </form>
      </div>
    </div>
  );
}
