import { afterEach, describe, expect, it, vi } from "vitest";
import { speakReply } from "./speakReply";

describe("speakReply", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("skips speech when voice is disabled at call time", () => {
    const speak = vi.fn();
    const cancel = vi.fn();
    vi.stubGlobal("window", {
      speechSynthesis: { speak, cancel },
      SpeechSynthesisUtterance: class {
        text = "";
        rate = 1;
        constructor(text: string) {
          this.text = text;
        }
      },
    });

    speakReply("hello", () => false);

    expect(speak).not.toHaveBeenCalled();
    expect(cancel).not.toHaveBeenCalled();
  });

  it("reads enabled at call time so mute during an in-flight request stays silent", () => {
    const speak = vi.fn();
    const cancel = vi.fn();
    vi.stubGlobal("window", {
      speechSynthesis: { speak, cancel },
      SpeechSynthesisUtterance: class {
        text = "";
        rate = 1;
        constructor(text: string) {
          this.text = text;
        }
      },
    });
    let enabled = true;
    const getEnabled = () => enabled;
    enabled = false;

    speakReply("late reply", getEnabled);

    expect(speak).not.toHaveBeenCalled();
  });

  it("cancels prior speech and speaks when enabled", () => {
    const speak = vi.fn();
    const cancel = vi.fn();
    vi.stubGlobal("window", {
      speechSynthesis: { speak, cancel },
      SpeechSynthesisUtterance: class {
        text = "";
        rate = 1;
        constructor(text: string) {
          this.text = text;
        }
      },
    });

    speakReply("hi", () => true);

    expect(cancel).toHaveBeenCalledOnce();
    expect(speak).toHaveBeenCalledOnce();
  });
});
