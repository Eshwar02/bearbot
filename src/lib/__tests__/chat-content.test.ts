import { normalizeChatContent } from '@/lib/chat-content';

describe('normalizeChatContent', () => {
  it('collapses duplicate assistant paragraphs', () => {
    expect(
      normalizeChatContent("Hey! How's your day going so far?\n\nHey! How's your day going so far?")
    ).toBe("Hey! How's your day going so far?");
  });

  it('keeps distinct repeated text when separated by different content', () => {
    expect(
      normalizeChatContent('First line\n\nSecond line\n\nFirst line')
    ).toBe('First line\n\nSecond line\n\nFirst line');
  });
});
