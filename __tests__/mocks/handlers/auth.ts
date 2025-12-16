import { http, HttpResponse } from "msw";

const API_BASE = "/api";

// Simulated user store for tests
const mockUsers = new Map<
  string,
  { id: string; email: string; password: string; name: string }
>();

// Pre-populate with test user
mockUsers.set("qa@test.com", {
  id: "test_user_qa",
  email: "qa@test.com",
  password: "TestPassword123!", // In real app, this would be hashed
  name: "QA Test User",
});

export const authHandlers = [
  // POST /api/auth/register - Register new user
  http.post(`${API_BASE}/auth/register`, async ({ request }) => {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      name?: string;
    };

    // Validate email
    if (!body.email || !body.email.includes("@")) {
      return HttpResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Validate password
    if (!body.password || body.password.length < 8) {
      return HttpResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Check for duplicate
    if (mockUsers.has(body.email)) {
      return HttpResponse.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    // Create user
    const newUser = {
      id: `user_${Date.now()}`,
      email: body.email,
      password: body.password,
      name: body.name || body.email.split("@")[0],
    };

    mockUsers.set(body.email, newUser);

    return HttpResponse.json(
      {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
        },
      },
      { status: 201 }
    );
  }),

  // POST /api/auth/callback/credentials - NextAuth credentials callback
  http.post(`${API_BASE}/auth/callback/credentials`, async ({ request }) => {
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const user = mockUsers.get(email);

    if (!user || user.password !== password) {
      return HttpResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  }),

  // GET /api/auth/session - Get current session
  http.get(`${API_BASE}/auth/session`, ({ request }) => {
    const isAuthenticated =
      request.headers.get("x-test-authenticated") === "true";

    if (!isAuthenticated) {
      return HttpResponse.json({});
    }

    return HttpResponse.json({
      user: {
        id: "test_user_qa",
        email: "qa@test.com",
        name: "QA Test User",
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  }),

  // GET /api/auth/csrf - Get CSRF token
  http.get(`${API_BASE}/auth/csrf`, () => {
    return HttpResponse.json({
      csrfToken: "mock-csrf-token",
    });
  }),

  // GET /api/auth/providers - Get auth providers
  http.get(`${API_BASE}/auth/providers`, () => {
    return HttpResponse.json({
      credentials: {
        id: "credentials",
        name: "Credentials",
        type: "credentials",
        signinUrl: "/api/auth/signin/credentials",
        callbackUrl: "/api/auth/callback/credentials",
      },
    });
  }),
];

// Helper to add a test user
export function addMockUser(email: string, password: string, name?: string) {
  mockUsers.set(email, {
    id: `user_${Date.now()}`,
    email,
    password,
    name: name || email.split("@")[0],
  });
}

// Helper to clear all mock users except default
export function resetMockUsers() {
  mockUsers.clear();
  mockUsers.set("qa@test.com", {
    id: "test_user_qa",
    email: "qa@test.com",
    password: "TestPassword123!",
    name: "QA Test User",
  });
}
