import { useRoomContext } from '@livekit/components-react';
import { useState, useEffect, useCallback } from 'react';
import { Track, RoomEvent, RemoteParticipant } from 'livekit-client';

export function AdminControls({ roomName, isHost }: { roomName: string; isHost: boolean }) {
  const room = useRoomContext();
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<{ identity: string; trackSid: string; kind: string } | null>(null);

  const updateList = useCallback(() => {
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
    if (!confirm(`Kick ${identity}?`)) return;
    const res = await fetch('/api/admin/kick', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomName, identity }),
    });
    if (res.ok) alert('Kicked'); else alert('Failed to kick');
  }, [roomName]);

  const closeRoom = useCallback(async () => {
    if (!confirm('Close this room for everyone? This cannot be undone.')) return;
    const res = await fetch('/api/admin/close-room', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomName }),
    });
    if (res.ok) {
      alert('Room closed');
      window.location.href = '/';
    } else {
      alert('Failed to close room');
    }
  }, [roomName]);

  if (!isHost) return null;

  return (
    <div className="admin-controls">
      <h4>Host Controls</h4>
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
            onClick={async () => {
              if (!selectedTrack) return;
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
              if (res.ok) alert('Track muted');
            }}
          >
            Mute
          </button>
        </div>
      ))}
    </div>
  );
}
