'use client';

import { useRoomContext } from '@livekit/components-react';
import { useState, useEffect, useCallback } from 'react';
import { Track, RoomEvent, RemoteParticipant } from 'livekit-client';

const HOST_SESSION_KEY = 'livekit-host-flag';

function useIsHost(propIsHost: boolean): boolean {
  const [effectiveIsHost, setEffectiveIsHost] = useState(propIsHost);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(HOST_SESSION_KEY);
      if (stored === 'true') {
        setEffectiveIsHost(true);
      }
    } catch {
      // sessionStorage not available
    }
  }, []);

  useEffect(() => {
    try {
      if (propIsHost) {
        sessionStorage.setItem(HOST_SESSION_KEY, 'true');
      }
    } catch {
      // sessionStorage not available
    }
  }, [propIsHost]);

  return effectiveIsHost || propIsHost;
}

export function AdminControls({ roomName, isHost }: { roomName: string; isHost: boolean }) {
  const room = useRoomContext();
  const [participants, setParticipants] = useState<RemoteParticipant[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<{ identity: string; trackSid: string; kind: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const effectiveIsHost = useIsHost(isHost);

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

  if (!effectiveIsHost) return null;

  return (
    <div style={{
      padding: '1rem',
      borderTop: '2px solid #dc2626',
      marginTop: '1rem',
      background: '#1a1a1a',
      color: '#fff',
      borderRadius: '0.5rem',
    }}>
      <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 'bold', color: '#fca5a5' }}>
        Admin Controls (Host)
      </h4>
      {error && (
        <div style={{
          marginBottom: '0.75rem',
          padding: '0.75rem',
          background: '#7f1d1d',
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
          color: '#fecaca',
        }}>
          {error}
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: '0.75rem',
              padding: '0.25rem 0.5rem',
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              borderRadius: '0.25rem',
              cursor: 'pointer',
            }}
          >
            Dismiss
          </button>
        </div>
      )}
      <button
        onClick={closeRoom}
        style={{
          marginBottom: '1rem',
          padding: '0.5rem 1rem',
          background: '#dc2626',
          color: '#fff',
          border: 'none',
          borderRadius: '0.375rem',
          cursor: 'pointer',
          fontWeight: 'bold',
        }}
      >
        Close Room for Everyone
      </button>
      {participants.length === 0 ? (
        <p style={{ fontSize: '0.875rem', opacity: 0.7 }}>No other participants connected</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {participants.map((p) => (
            <div
              key={p.identity}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                background: '#262626',
                borderRadius: '0.375rem',
                gap: '0.75rem',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.identity}
                </div>
                <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.125rem' }}>
                  {p.trackPublications.size} track(s)
                </div>
              </div>
              <select
                value={selectedTrack?.trackSid ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  const [iden, sid, kind] = val.split('|');
                  setSelectedTrack({ identity: iden, trackSid: sid, kind });
                }}
                style={{
                  padding: '0.375rem',
                  background: '#404040',
                  color: '#fff',
                  border: '1px solid #525252',
                  borderRadius: '0.25rem',
                  fontSize: '0.75rem',
                  minWidth: '140px',
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
                onClick={() => kick(p.identity)}
                style={{
                  padding: '0.375rem 0.75rem',
                  background: '#dc2626',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                }}
              >
                Kick
              </button>
              <button
                disabled={!selectedTrack}
                onClick={muteTrack}
                style={{
                  padding: '0.375rem 0.75rem',
                  background: selectedTrack ? '#ca8a04' : '#525252',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '0.25rem',
                  cursor: selectedTrack ? 'pointer' : 'not-allowed',
                  fontWeight: 'bold',
                  fontSize: '0.75rem',
                }}
              >
                Mute
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
