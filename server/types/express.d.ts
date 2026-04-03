declare global {
  namespace Express {
    interface User {
      id: string;
      username: string;
      tokens: number;
    }
  }
}
