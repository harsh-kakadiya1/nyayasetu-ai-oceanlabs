declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      tokens: number;
      plan?: "starter" | "professional" | "enterprise";
      role?: "user" | "admin";
      isAdmin?: boolean;
    }
  }
}
