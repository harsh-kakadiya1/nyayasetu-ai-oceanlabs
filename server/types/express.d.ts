import type { User as AppUser } from "../schema.js";

declare global {
  namespace Express {
    interface User extends AppUser {}

    interface Request {
      user: AppUser;
      isAuthenticated(): this is Request & { user: AppUser };
    }
  }
}

export {};
