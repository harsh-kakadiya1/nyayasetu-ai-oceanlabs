import type { ApiMode } from "../contracts";
import { createHttpAdapter } from "./httpAdapter";
import { createMockAdapter } from "./mockAdapter";

const requestedMode = (import.meta.env.VITE_API_MODE || "mock").toLowerCase();
const mode: ApiMode = requestedMode === "http" ? "http" : "mock";
const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export const apiClient = mode === "http" ? createHttpAdapter(baseUrl) : createMockAdapter();
