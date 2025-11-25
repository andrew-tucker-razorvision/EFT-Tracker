import { setupServer } from "msw/node";
import { questHandlers } from "../mocks/handlers/quests";
import { progressHandlers } from "../mocks/handlers/progress";
import { authHandlers } from "../mocks/handlers/auth";

// Combine all handlers
export const handlers = [...questHandlers, ...progressHandlers, ...authHandlers];

// Setup MSW server for Node.js environment
export const server = setupServer(...handlers);
