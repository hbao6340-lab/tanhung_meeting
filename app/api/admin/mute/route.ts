import { RoomServiceClient } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET } = process.env;
    if (!LIVEKIT_URL || !LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      return NextResponse.json(
        { error: 'Server misconfigured' },
        { status: 500 },
      );
    }

    const serverUrl = new URL(LIVEKIT_URL);
    serverUrl.protocol = 'https:';
    const roomService = new RoomServiceClient(serverUrl.origin, LIVEKIT_API_KEY, LIVEKIT_API_SECRET);

    const { roomName, identity, trackSid, muted } = await request.json();
    if (!roomName || !identity || !trackSid || typeof muted !== 'boolean') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await roomService.mutePublishedTrack(roomName, identity, trackSid, muted);
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
