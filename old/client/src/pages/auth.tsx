import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Lock, User, Eye, EyeOff, Sparkles } from "lucide-react";

export default function Auth() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({ 
    username: "", 
    password: "", 
    confirmPassword: "" 
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { login, register } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginData.username.trim() || !loginData.password.trim()) {
      toast({
        title: "Missing fields",
        description: "Please enter both username and password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const success = await login(loginData.username, loginData.password);
    setIsLoading(false);

    if (success) {
      toast({
        title: "Welcome back! 👋",
        description: "You're logged in successfully",
      });
      setLocation("/dashboard");
    } else {
      toast({
        title: "Login failed",
        description: "Invalid username or password",
        variant: "destructive",
      });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!registerData.username.trim() || !registerData.password.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (registerData.password.length < 6) {
      toast({
        title: "Weak password",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const success = await register(registerData.username, registerData.password);
    setIsLoading(false);

    if (success) {
      toast({
        title: "Account created! 🎉",
        description: "Welcome to NyayaSetu AI",
      });
      setLocation("/dashboard");
    } else {
      toast({
        title: "Registration failed",
        description: "Username already exists or invalid data",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen w-full flex overflow-hidden bg-gradient-to-br from-[#f3ece0] via-[#eef5f2] to-[#faf7f0]">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-[#1f565f] via-[#1e4c54] to-[#153f47] text-white">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-[#f6b26b] rounded-lg flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#1f565f]" />
            </div>
            <span className="text-2xl font-bold">NyayaSetu AI</span>
          </div>
          <p className="text-[#d0f4ea] text-sm">Legal document analysis redefined</p>
        </div>

        <div className="space-y-10">
          {/* Features */}
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-[#f6b26b]/20 text-[#f6b26b]">
                <span className="text-lg">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-white">Instant Analysis</h3>
                <p className="text-sm text-[#d0f4ea]">Get comprehensive legal insights in seconds</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-[#f6b26b]/20 text-[#f6b26b]">
                <span className="text-lg">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-white">Privacy First</h3>
                <p className="text-sm text-[#d0f4ea]">Your documents stay secure and encrypted</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-[#f6b26b]/20 text-[#f6b26b]">
                <span className="text-lg">✓</span>
              </div>
              <div>
                <h3 className="font-semibold text-white">Expert Insights</h3>
                <p className="text-sm text-[#d0f4ea]">AI-powered analysis built for legal professionals</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-white/10 p-4 border border-white/20">
              <p className="text-2xl font-bold text-[#f6b26b]">12K+</p>
              <p className="text-xs text-[#d0f4ea] mt-1">Documents Analyzed</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 border border-white/20">
              <p className="text-2xl font-bold text-[#f6b26b]">94%</p>
              <p className="text-xs text-[#d0f4ea] mt-1">Risk Detection Rate</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 border border-white/20">
              <p className="text-2xl font-bold text-[#f6b26b]">35s</p>
              <p className="text-xs text-[#d0f4ea] mt-1">Average Speed</p>
            </div>
            <div className="rounded-xl bg-white/10 p-4 border border-white/20">
              <p className="text-2xl font-bold text-[#f6b26b]">99%</p>
              <p className="text-xs text-[#d0f4ea] mt-1">Uptime SLA</p>
            </div>
          </div>

          {/* Testimonials */}
          <div className="space-y-3 border-t border-white/20 pt-8">
            <p className="text-xs uppercase tracking-widest text-[#bdf2e0] font-semibold">Trusted by professionals</p>
            <div className="space-y-3">
              <div className="rounded-lg bg-white/5 p-3 border border-white/10">
                <p className="text-[#d0f4ea] text-sm italic">"Saved us 40+ hours on contract review. This is a game changer!"</p>
                <p className="text-xs text-[#bdf2e0] mt-2">— Sarah Chen, Legal Director</p>
              </div>
              <div className="rounded-lg bg-white/5 p-3 border border-white/10">
                <p className="text-[#d0f4ea] text-sm italic">"Finally, a tool that understands legal nuance. Highly recommend."</p>
                <p className="text-xs text-[#bdf2e0] mt-2">— Marcus Johnson, Founder</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-8">
            <button 
              onClick={() => setLocation("/")}
              className="inline-flex items-center gap-2 text-sm text-[#4d7076] hover:text-[#23484e] mb-6 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </button>
            <h1 className="text-3xl font-bold text-[#1f383c] mb-2">
              {mode === "login" ? "Welcome back" : "Join NyayaSetu"}
            </h1>
            <p className="text-[#4d7076]">
              {mode === "login" 
                ? "Enter your credentials to analyze your contracts" 
                : "Create an account to get started"}
            </p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl border border-[#1f383c]/10 shadow-lg p-8 mb-6">
            {mode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-5">
                {/* Username */}
                <div>
                  <Label htmlFor="login-username" className="text-sm font-semibold text-[#1f383c] mb-2 block">
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#8a9e9f]" />
                    <Input
                      id="login-username"
                      type="text"
                      placeholder="Enter your username"
                      value={loginData.username}
                      onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                      className="pl-10 h-11 border border-[#1f383c]/15 rounded-xl focus:ring-2 focus:ring-[#1f565f] focus:border-transparent bg-[#f7fffc]"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <Label htmlFor="login-password" className="text-sm font-semibold text-[#1f383c] mb-2 block">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#8a9e9f]" />
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      className="pl-10 pr-10 h-11 border border-[#1f383c]/15 rounded-xl focus:ring-2 focus:ring-[#1f565f] focus:border-transparent bg-[#f7fffc]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8a9e9f] hover:text-[#1f383c]"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full h-11 rounded-xl bg-[#1f565f] hover:bg-[#173f46] text-white font-semibold mt-6 transition"
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-5">
                {/* Username */}
                <div>
                  <Label htmlFor="register-username" className="text-sm font-semibold text-[#1f383c] mb-2 block">
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#8a9e9f]" />
                    <Input
                      id="register-username"
                      type="text"
                      placeholder="Choose a username"
                      value={registerData.username}
                      onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                      className="pl-10 h-11 border border-[#1f383c]/15 rounded-xl focus:ring-2 focus:ring-[#1f565f] focus:border-transparent bg-[#f7fffc]"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <Label htmlFor="register-password" className="text-sm font-semibold text-[#1f383c] mb-2 block">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#8a9e9f]" />
                    <Input
                      id="register-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="At least 6 characters"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      className="pl-10 pr-10 h-11 border border-[#1f383c]/15 rounded-xl focus:ring-2 focus:ring-[#1f565f] focus:border-transparent bg-[#f7fffc]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8a9e9f] hover:text-[#1f383c]"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <Label htmlFor="register-confirm" className="text-sm font-semibold text-[#1f383c] mb-2 block">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#8a9e9f]" />
                    <Input
                      id="register-confirm"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      className="pl-10 pr-10 h-11 border border-[#1f383c]/15 rounded-xl focus:ring-2 focus:ring-[#1f565f] focus:border-transparent bg-[#f7fffc]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#8a9e9f] hover:text-[#1f383c]"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full h-11 rounded-xl bg-[#1f565f] hover:bg-[#173f46] text-white font-semibold mt-6 transition"
                >
                  {isLoading ? "Creating account..." : "Create account"}
                </Button>
              </form>
            )}
          </div>

          {/* Toggle Mode */}
          <div className="text-center">
            <p className="text-sm text-[#4d7076] mb-4">
              {mode === "login" 
                ? "Don't have an account?" 
                : "Already have an account?"}
            </p>
            <Button
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              variant="ghost"
              className="text-[#1f565f] hover:text-[#173f46] font-semibold text-sm"
            >
              {mode === "login" ? "Create account" : "Sign in"}
            </Button>
          </div>

          {/* Security Info */}
          <div className="mt-8 p-4 bg-[#f0faf8] border border-[#1f565f]/10 rounded-xl">
            <div className="flex gap-3">
              <Lock className="w-4 h-4 text-[#1f565f] flex-shrink-0 mt-0.5" />
              <div className="text-xs text-[#4d7076]">
                <p className="font-semibold text-[#1f383c] mb-1">Your data is secure</p>
                <p>We use industry-standard encryption to protect your information</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}