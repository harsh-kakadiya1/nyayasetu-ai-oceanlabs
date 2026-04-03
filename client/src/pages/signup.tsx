import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Signup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!username.trim() || !password.trim() || !confirmPassword.trim()) {
      toast({
        title: "Missing fields",
        description: "Please fill all fields.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Weak password",
        description: "Password must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please confirm your password again.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    const ok = await signup(username.trim(), password);
    setIsSubmitting(false);

    if (ok) {
      toast({
        title: "Account created",
        description: "Welcome to Nyayasetu AI.",
      });
      setLocation("/dashboard");
    } else {
      toast({
        title: "Signup failed",
        description: "Username may already exist.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f4ea] via-[#edf4f1] to-[#f4f8f7] px-4 py-10">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-[#2d575e]/15 bg-white/90 p-6 shadow-lg sm:p-8">
        <h1 className="font-display text-3xl font-semibold text-[#1d3b40]">Sign up</h1>
        <p className="mt-2 text-sm text-[#547980]">Create your account to save analysis history securely.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Choose a username"
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
              placeholder="Create a password"
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
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

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-5 text-sm text-[#547980]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#1f565f] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
