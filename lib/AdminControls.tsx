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
    updateList();
    room.on(RoomEvent.ParticipantConnected, updateList);
    room.on(RoomEvent.ParticipantDisconnected, updateList);
    return () => {
      room.off(RoomEvent.ParticipantConnected, updateList);
      room.off(RoomEvent.ParticipantDisconnected, updateList);
    };
  }, [room, updateList]);

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
      const message = e instanceof Error ? e.message : 'Unknown error';
      setError(message);
      alert('Failed to kick participant');
    }
  }, [roomName, updateList]);

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
      const message = e instanceof Error ? e.message : 'Unknown error';
      setError(message);
      alert('Failed to mute track');
    }
  }, [roomName, selectedTrack]);

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
      const message = e instanceof Error ? e.message : 'Unknown error';
      setError(message);
      alert('Failed to close room');
    }
  }, [roomName]);

  if (!isHost) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '80px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      gap: '0.5rem',
      alignItems: 'center',
      padding: '0.5rem 0.75rem',
      background: '#1a1a1a',
      border: '1px solid #dc2626',
      borderRadius: '9999px',
      zIndex: 9999,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.5)',
    }}>
      {error && (
        <span style={{
          fontSize: '0.75rem',
          color: '#fca5a5',
          marginRight: '0.5rem',
          maxWidth: '200px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {error}
        </span>
      )}
      <button
        onClick={closeRoom}
        title="Close Room"
        style={{
          padding: '0.5rem 0.75rem',
          background: '#dc2626',
          color: '#fff',
          border: 'none',
          borderRadius: '9999px',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '0.875rem',
        }}
      >
        Close Room
      </button>
      <select
        value={selectedTrack?.trackSid ?? ''}
        onChange={(e) => {
          const val = e.target.value;
          if (!val) return;
          const [iden, sid, kind] = val.split('|');
          setSelectedTrack({ identity: iden, trackSid: sid, kind });
        }}
        style={{
          padding: '0.5rem 0.5rem',
          background: '#262626',
          color: '#fff',
          border: '1px solid #525252',
          borderRadius: '9999px',
          fontSize: '0.875rem',
        }}
      >
        <option value="">Select participant...</option>
        {participants.map((p) => {
          const tracks = Array.from(p.trackPublications.values());
          return tracks.map((pub) => (
            <option key={pub.trackSid} value={`${p.identity}|${pub.trackSid}|${pub.kind}`}>
              {p.identity} - {pub.kind}
            </option>
          ));
        })}
      </select>
      <button
        onClick={() => participants.forEach(p => kick(p.identity))}
        title="Kick selected"
        style={{
          padding: '0.5rem 0.75rem',
          background: '#dc2626',
          color: '#fff',
          border: 'none',
          borderRadius: '9999px',
          cursor: 'pointer',
          fontWeight: 600,
          fontSize: '0.875rem',
        }}
      >
        Kick
      </button>
      <button
        disabled={!selectedTrack}
        onClick={muteTrack}
        title="Mute selected track"
        style={{
          padding: '0.5rem 0.75rem',
          background: selectedTrack ? '#ca8a04' : '#525252',
          color: '#fff',
          border: 'none',
          borderRadius: '9999px',
          cursor: selectedTrack ? 'pointer' : 'not-allowed',
          fontWeight: 600,
          fontSize: '0.875rem',
        }}
      >
        Mute
      </button>
    </div>
  );
}
