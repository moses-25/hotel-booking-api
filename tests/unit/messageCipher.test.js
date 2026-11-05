import { describe, it, expect } from "vitest";
import {
  encryptMessage,
  decryptMessage,
} from "../../server/src/utils/crypto/messageCipher.js";

describe("messageCipher", () => {
  it("round-trips a message", () => {
    const encrypted = encryptMessage("Hello, I need help");
    expect(decryptMessage(encrypted)).toBe("Hello, I need help");
  });

  it("round-trips emoji and multi-line text", () => {
    const text = "Línea 1\nLínea 2 🏨";
    expect(decryptMessage(encryptMessage(text))).toBe(text);
  });

  it("uses the v1 format and a random IV each time", () => {
    const a = encryptMessage("same");
    const b = encryptMessage("same");
    expect(a.startsWith("v1:")).toBe(true);
    expect(a.split(":")).toHaveLength(4);
    expect(a).not.toBe(b);
  });

  it("rejects tampered cipherText (GCM auth tag)", () => {
    const parts = encryptMessage("secret").split(":");
    parts[3] = Buffer.from("tampered").toString("base64");
    expect(() => decryptMessage(parts.join(":"))).toThrow();
  });

  it("rejects malformed or unversioned payloads", () => {
    expect(() => decryptMessage("plain text")).toThrow();
    expect(() => decryptMessage("v2:a:b:c")).toThrow();
  });

  it("rejects non-string input", () => {
    expect(() => encryptMessage(123)).toThrow();
    expect(() => decryptMessage(null)).toThrow();
  });
});
