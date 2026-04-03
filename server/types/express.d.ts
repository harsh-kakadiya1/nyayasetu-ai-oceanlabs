import { User } from '../shared/schema.js';

declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
    }
  }
}
