import { RoomServiceClient } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

const serverUrl = process.env.LIVEKIT_URL;
const apiKey = process.env.LIVEKIT_API_KEY;
const apiSecret = process.env.LIVEKIT_API_SECRET;

if (!serverUrl || !apiKey || !apiSecret) {
  throw new Error(
    `LIVEKIT_URL: ${!!serverUrl}, LIVEKIT_API_KEY: ${!!apiKey}, LIVEKIT_API_SECRET: ${!!apiSecret}`,
  );
}

const roomService = new RoomServiceClient(serverUrl, apiKey, apiSecret);

export async function POST(request: NextRequest) {
  try {
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
