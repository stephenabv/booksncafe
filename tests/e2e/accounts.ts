export const E2E_DATABASE_URL = process.env.E2E_DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/booksncafe_e2e";

export const E2E_ACCOUNTS = {
  admin: { email: "owner@example.test", password: "e2e-owner-password-123", role: "admin" as const },
  editor: { email: "editor@example.test", password: "e2e-editor-password-123", role: "editor" as const },
};
