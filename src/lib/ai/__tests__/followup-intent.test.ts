import {
  isLikelyAffirmativeFollowup,
  looksLikeAssistantActionPrompt,
  normalizeNoisyEnglish,
} from "@/lib/ai/followup-intent";

describe("followup intent helpers", () => {
  it("normalizes common noisy English tokens", () => {
    expect(normalizeNoisyEnglish("u pls do that qn")).toBe("you please do that question");
    expect(normalizeNoisyEnglish("wht abt ur msg")).toBe("what about your message");
    expect(normalizeNoisyEnglish("yeeesss")).toBe("yeess");
  });

  it("accepts broad affirmative follow-up variants", () => {
    const yesPhrases = [
      "yes",
      "yeah do it",
      "yup go ahead",
      "ok continue",
      "okay proceed",
      "sure do that",
      "please do",
      "that works",
      "sounds good",
      "lets do it",
      "make it happen",
      "alright keep going",
      "fine continue",
      "great go for it",
      "yes do this",
      "yes do that",
      "proceed",
      "carry on",
      "go ahead bro",
      "okok do it",
      "u pls do that",
    ];

    for (const phrase of yesPhrases) {
      expect(isLikelyAffirmativeFollowup(phrase)).toBe(true);
    }
  });

  it("rejects negatives and unrelated short text", () => {
    const noPhrases = [
      "no",
      "don't do that",
      "stop",
      "wait",
      "cancel this",
      "why is this happening",
      "what is pe ratio",
      "tell me about apple stock",
      "hmm not sure",
    ];

    for (const phrase of noPhrases) {
      expect(isLikelyAffirmativeFollowup(phrase)).toBe(false);
    }
  });

  it("detects assistant action prompts", () => {
    expect(looksLikeAssistantActionPrompt("Do you want me to run a deep risk check?")).toBe(true);
    expect(looksLikeAssistantActionPrompt("If you want, I can also compare peers.")).toBe(true);
    expect(looksLikeAssistantActionPrompt("Here is the answer.")).toBe(false);
  });
});
