import { describe, expect, it } from "vitest";
import { shouldStickChatToBottom } from "./chatScroll";

describe("shouldStickChatToBottom", () => {
  it("sticks when the user is already at the bottom", () => {
    expect(shouldStickChatToBottom({ scrollTop: 400, scrollHeight: 500, clientHeight: 100 })).toBe(true);
  });

  it("does not stick when the user has scrolled up to read history", () => {
    expect(shouldStickChatToBottom({ scrollTop: 0, scrollHeight: 500, clientHeight: 100 })).toBe(false);
  });

  it("still sticks within a small threshold of the bottom", () => {
    expect(shouldStickChatToBottom({ scrollTop: 350, scrollHeight: 500, clientHeight: 100 }, 64)).toBe(true);
    expect(shouldStickChatToBottom({ scrollTop: 300, scrollHeight: 500, clientHeight: 100 }, 64)).toBe(false);
  });
});
