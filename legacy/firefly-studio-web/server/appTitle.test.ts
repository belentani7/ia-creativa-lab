import { describe, expect, it } from "vitest";

describe("application title configuration", () => {
  it("uses Belentani Studio as the managed application title", () => {
    expect(process.env.VITE_APP_TITLE).toBe("Belentani Studio");
  });
});
