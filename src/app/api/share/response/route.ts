import { NextRequest, NextResponse } from 'next/server';
import { randomInt, createHash } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const TOKEN_ALPHABET = 'abcdefghijklmnopqrstuvwxyz';
const TOKEN_LENGTH = 16;
const TOKEN_RETRY_LIMIT = 6;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function generateToken(length: number) {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += TOKEN_ALPHABET[randomInt(0, TOKEN_ALPHABET.length)];
  }
  return out;
}

function hashContent(content: string) {
  return createHash('sha256').update(content).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as {
      messageId?: string;
      conversationId?: string;
      content?: string;
    };
    const messageId = body.messageId?.trim() ?? '';
    const conversationId = body.conversationId?.trim() ?? '';
    const content = body.content?.trim() ?? '';

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }
    if (content.length > 120000) {
      return NextResponse.json({ error: 'Content too long' }, { status: 400 });
    }

    // conversationId is optional — when present, verify the caller owns it.
    // Client message ids are generated locally and may not match the db row,
    // so we never require them to exist; we only persist them for analytics.
    let verifiedConversationId: string | null = null;
    if (conversationId && UUID_RE.test(conversationId)) {
      const { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (conversation?.id) {
        verifiedConversationId = conversation.id;
      }
    }

    const admin = createAdminClient();
    const contentHash = hashContent(content);

    // Dedupe per-user by exact content hash so repeated clicks on the same
    // response reuse the same share token instead of piling up rows.
    const { data: existing } = await admin
      .from('shared_responses')
      .select('token, content')
      .eq('user_id', user.id)
      .eq('content', content)
      .limit(1)
      .maybeSingle();
    if (existing?.token) {
      return NextResponse.json({
        shareUrl: `/share/response/${existing.token}`,
        token: existing.token,
      });
    }

    const sourceMessageId = UUID_RE.test(messageId) ? messageId : null;

    for (let attempt = 0; attempt < TOKEN_RETRY_LIMIT; attempt += 1) {
      const token = generateToken(TOKEN_LENGTH);
      const insertPayload: Record<string, unknown> = {
        token,
        user_id: user.id,
        content,
      };
      if (sourceMessageId) insertPayload.source_message_id = sourceMessageId;
      if (verifiedConversationId) insertPayload.source_conversation_id = verifiedConversationId;

      const { error: insertError } = await admin
        .from('shared_responses')
        .insert(insertPayload);

      if (!insertError) {
        return NextResponse.json({ shareUrl: `/share/response/${token}`, token });
      }

      // 23505 unique_violation — token collision, retry.
      if (insertError.code === '23505') {
        continue;
      }

      console.error('POST /api/share/response insert failed:', insertError, {
        hash: contentHash,
      });
      return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 });
    }

    return NextResponse.json({ error: 'Unable to create unique share token' }, { status: 500 });
  } catch (error) {
    console.error('POST /api/share/response error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
