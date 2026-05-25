import { NextRequest, NextResponse } from 'next/server';
import { randomInt } from 'crypto';
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

    const body = (await request.json()) as { messageId?: string; content?: string };
    const messageId = body.messageId?.trim() ?? '';
    const content = body.content?.trim() ?? '';

    if (!UUID_RE.test(messageId)) {
      return NextResponse.json({ error: 'Invalid messageId' }, { status: 400 });
    }
    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }
    if (content.length > 120000) {
      return NextResponse.json({ error: 'Content too long' }, { status: 400 });
    }

    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('id, conversation_id')
      .eq('id', messageId)
      .single();
    if (messageError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', message.conversation_id)
      .eq('user_id', user.id)
      .single();
    if (conversationError || !conversation) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const admin = createAdminClient();

    const { data: existing, error: existingError } = await admin
      .from('shared_responses')
      .select('token')
      .eq('user_id', user.id)
      .eq('source_message_id', messageId)
      .maybeSingle();
    if (existingError) {
      return NextResponse.json({ error: 'Failed to prepare share link' }, { status: 500 });
    }

    if (existing?.token) {
      const { error: updateError } = await admin
        .from('shared_responses')
        .update({ content })
        .eq('user_id', user.id)
        .eq('source_message_id', messageId);
      if (updateError) {
        return NextResponse.json({ error: 'Failed to update share link' }, { status: 500 });
      }
      return NextResponse.json({ shareUrl: `/share/response/${existing.token}`, token: existing.token });
    }

    for (let attempt = 0; attempt < TOKEN_RETRY_LIMIT; attempt += 1) {
      const token = generateToken(TOKEN_LENGTH);
      const { error: insertError } = await admin.from('shared_responses').insert({
        token,
        user_id: user.id,
        source_message_id: messageId,
        content,
      });

      if (!insertError) {
        return NextResponse.json({ shareUrl: `/share/response/${token}`, token });
      }

      // 23505 unique_violation — token collision or concurrent insert for same source_message_id.
      if (insertError.code === '23505') {
        const { data: reused } = await admin
          .from('shared_responses')
          .select('token')
          .eq('user_id', user.id)
          .eq('source_message_id', messageId)
          .maybeSingle();
        if (reused?.token) {
          return NextResponse.json({ shareUrl: `/share/response/${reused.token}`, token: reused.token });
        }
        continue;
      }

      return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 });
    }

    return NextResponse.json({ error: 'Unable to create unique share token' }, { status: 500 });
  } catch (error) {
    console.error('POST /api/share/response error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
