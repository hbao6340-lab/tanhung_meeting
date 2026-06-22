'use client';

import { useRoomContext } from '@livekit/components-react';
import { useState, useEffect, useCallback } from 'react';
import { Track, RoomEvent, RemoteParticipant } from 'livekit-client';

export function AdminControls({ roomName, isHost }: { roomName: string; isHost: boolean }) {
  const room = useRoomContext();
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<{ identity: string; trackSid: string; kind: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateList = useCallback(() => {
    if (!room) return;
    setParticipants(Array.from(room.remoteParticipants.values()));
  }, [room]);

  useEffect(() => {
    if (!room) return;
    updateList();
    room.on(RoomEvent.ParticipantConnected, updateList);
    room.on(RoomEvent.ParticipantDisconnected, updateList);
    return () => {
      room.off(RoomEvent.ParticipantConnected, updateList);
      room.off(RoomEvent.ParticipantDisconnected, updateList);
    };
  }, [room, updateList]);

  const handleApiError = useCallback((err: unknown) => {
    const message = err instanceof Error ? err.message : 'Unknown error';
    setError(message);
    console.error('Admin action failed:', err);
  }, []);

  const kick = useCallback(async (identity: string) => {
    if (!confirm(`Kick ${identity} from the room?`)) return;
    setError(null);
    try {
      const res = await fetch('/api/admin/kick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName, identity }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      alert('Participant has been kicked');
      setSelectedTrack(null);
      updateList();
    } catch (e) {
      handleApiError(e);
      alert('Failed to kick participant');
    }
  }, [roomName, updateList, handleApiError]);

  const muteTrack = useCallback(async () => {
    if (!selectedTrack) return;
    setError(null);
    try {
      const res = await fetch('/api/admin/mute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName,
          identity: selectedTrack.identity,
          trackSid: selectedTrack.trackSid,
          muted: selectedTrack.kind === Track.Kind.Audio,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      alert('Track muted');
    } catch (e) {
      handleApiError(e);
      alert('Failed to mute track');
    }
  }, [roomName, selectedTrack, handleApiError]);

  const closeRoom = useCallback(async () => {
    if (!confirm('Close this room for everyone? This cannot be undone.')) return;
    setError(null);
    try {
      const res = await fetch('/api/admin/close-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomName }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      alert('Room closed for everyone');
      window.location.href = '/';
    } catch (e) {
      handleApiError(e);
      alert('Failed to close room');
    }
  }, [roomName, handleApiError]);

  if (!isHost) return null;

  return (
    <div className="admin-controls">
      <h4>Host Controls</h4>
      {error && (
        <div style={{ marginBottom: '0.5rem', padding: '0.5rem', background: '#7f1d1d', borderRadius: '0.375rem', fontSize: '0.75rem' }}>
          {error}
          <button onClick={() => setError(null)} style={{ marginLeft: '0.5rem' }}>Dismiss</button>
        </div>
      )}
      <button
        className="lk-button"
        onClick={closeRoom}
        style={{ marginBottom: '1rem', background: '#dc2626' }}
      >
        Close Room
      </button>
      {participants.length === 0 && <p className="empty">No other participants</p>}
      {participants.map((p) => (
        <div key={p.identity} className="participant-row">
          <span className="identity">{p.identity}</span>
          <select
            value={selectedTrack?.trackSid ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              if (!val) return;
              const [iden, sid, kind] = val.split('|');
              setSelectedTrack({ identity: iden, trackSid: sid, kind });
            }}
          >
            <option value="">Select track...</option>
            {Array.from(p.trackPublications.values()).map((pub) => (
              <option key={pub.trackSid} value={`${p.identity}|${pub.trackSid}|${pub.kind}`}>
                {pub.kind} - {pub.trackName}
              </option>
            ))}
          </select>
          <button
            className="lk-button"
            onClick={() => kick(p.identity)}
          >
            Kick
          </button>
          <button
            className="lk-button"
            disabled={!selectedTrack}
            onClick={muteTrack}
          >
            Mute
          </button>
        </div>
      ))}
    </div>
  );
}
