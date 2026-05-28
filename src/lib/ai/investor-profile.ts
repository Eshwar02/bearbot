const EXTRACTION_PROMPT = `You are an investment profile extractor.
Given a conversation, extract signals and return ONLY valid JSON in this format:
{
  "risk_profile": "conservative | moderate | aggressive | null",
  "preferred_sectors": ["sector1", "sector2"],
  "tracked_tickers": ["TICKER1", "TICKER2"],
  "avoid_signals": ["signal1", "signal2"],
  "investment_horizon": "short-term | medium-term | long-term | null",
  "last_topics": ["topic1", "topic2"]
}
If nothing is extractable, return empty arrays and null values. No explanation, only JSON.`;

export async function extractInvestorProfile(conversation: string): Promise<object> {
  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
    },
    body: JSON.stringify({
      model: 'mistral-small-latest',
      messages: [
        { role: 'system', content: EXTRACTION_PROMPT },
        { role: 'user', content: conversation }
      ],
      temperature: 0.1
    })
  });

  const data = await response.json();
  const text = data.choices[0].message.content.trim();

  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

export function mergeProfiles(existing: any, extracted: any): object {
  return {
    risk_profile: extracted.risk_profile ?? existing.risk_profile ?? null,
    preferred_sectors: [...new Set([...(existing.preferred_sectors ?? []), ...(extracted.preferred_sectors ?? [])])],
    tracked_tickers: [...new Set([...(existing.tracked_tickers ?? []), ...(extracted.tracked_tickers ?? [])])],
    avoid_signals: [...new Set([...(existing.avoid_signals ?? []), ...(extracted.avoid_signals ?? [])])],
    investment_horizon: extracted.investment_horizon ?? existing.investment_horizon ?? null,
    last_topics: (extracted.last_topics ?? []).slice(0, 5)
  };
}