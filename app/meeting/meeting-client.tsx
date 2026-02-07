'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import DailyIframe from '@daily-co/daily-js';
import {
  DailyProvider,
  DailyAudio,
  useParticipantIds,
  useScreenShare,
  useLocalSessionId,
  useVideoTrack,
  useAudioTrack,
  useDailyEvent,
  useDaily,
  useDevices,
  useParticipantProperty,
  DailyVideo,
} from '@daily-co/daily-react';
import {
  Mic, MicOff, Camera, CameraOff, MonitorUp, PhoneOff, MessageSquare,
  Loader2, ArrowLeft, Users, X, Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type AppState = 'idle' | 'haircheck' | 'joining' | 'joined' | 'leaving' | 'error';

export default function MeetingClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomUrl = searchParams.get('roomUrl');

  const [appState, setAppState] = useState<AppState>('idle');
  const [callObject, setCallObject] = useState<ReturnType<typeof DailyIframe.createCallObject> | null>(null);
  const cancelledRef = useRef(false);

  // Start the hair check when roomUrl is available
  useEffect(() => {
    if (!roomUrl) return;
    cancelledRef.current = false;

    let localCallObject: ReturnType<typeof DailyIframe.createCallObject> | null = null;

    async function init() {
      // Destroy any existing singleton first and await it
      try {
        const existing = DailyIframe.getCallInstance();
        if (existing) await existing.destroy();
      } catch {}

      // If effect was cleaned up while we awaited, bail out
      if (cancelledRef.current) return;

      const co = DailyIframe.createCallObject();
      localCallObject = co;
      setCallObject(co);
      setAppState('haircheck');

      try {
        await co.preAuth({ url: roomUrl! });
        if (!cancelledRef.current) await co.startCamera();
      } catch {
        if (!cancelledRef.current) setAppState('error');
      }
    }

    init();

    return () => {
      cancelledRef.current = true;
      if (localCallObject) {
        localCallObject.destroy().catch(() => {});
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomUrl]);

  // Listen for meeting state changes
  useEffect(() => {
    if (!callObject) return;

    const events = ['joined-meeting', 'left-meeting', 'error', 'camera-error'] as const;

    function handleNewMeetingState() {
      if (!callObject) return;
      switch (callObject.meetingState()) {
        case 'joined-meeting':
          setAppState('joined');
          break;
        case 'left-meeting':
          callObject.destroy().then(() => {
            setCallObject(null);
            setAppState('idle');
            router.push('/my-courses');
          });
          break;
        case 'error':
          setAppState('error');
          break;
      }
    }

    handleNewMeetingState();
    events.forEach(e => callObject.on(e, handleNewMeetingState));
    return () => {
      events.forEach(e => callObject.off(e, handleNewMeetingState));
    };
  }, [callObject, router]);

  const joinCall = useCallback(
    (userName: string) => {
      if (!callObject || !roomUrl) return;
      setAppState('joining');
      callObject.join({ url: roomUrl, userName });
    },
    [callObject, roomUrl]
  );

  const leaveCall = useCallback(() => {
    if (!callObject) return;
    if (appState === 'error') {
      callObject.destroy().then(() => {
        setCallObject(null);
        setAppState('idle');
        router.push('/my-courses');
      });
    } else {
      setAppState('leaving');
      callObject.leave();
      // Also end the meeting in our DB
      if (roomUrl) {
        const urlParts = roomUrl.split('/');
        const roomName = urlParts[urlParts.length - 1];
        fetch('/api/meetings/end', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomName }),
        }).catch(() => {});
      }
    }
  }, [callObject, appState, router, roomUrl]);

  if (!roomUrl) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-xl font-bold text-white mb-2">No Room URL</h1>
          <p className="text-gray-400 mb-4">Please start a meeting from your courses page.</p>
          <button
            onClick={() => router.push('/my-courses')}
            className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary-dark transition-colors cursor-pointer"
          >
            Go to My Courses
          </button>
        </div>
      </div>
    );
  }

  const showHairCheck = appState === 'haircheck';
  const showCall = ['joining', 'joined', 'error'].includes(appState);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {callObject && (
        <DailyProvider callObject={callObject}>
          {showHairCheck && (
            <HairCheck joinCall={joinCall} cancelCall={() => router.push('/my-courses')} />
          )}
          {showCall && (
            <>
              <CallView />
              <Tray leaveCall={leaveCall} />
              <DailyAudio />
            </>
          )}
        </DailyProvider>
      )}
      {appState === 'idle' && (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}
    </div>
  );
}

/* ─── Hair Check Component ─── */
function HairCheck({ joinCall, cancelCall }: { joinCall: (name: string) => void; cancelCall: () => void }) {
  const localSessionId = useLocalSessionId();
  const initialUsername = useParticipantProperty(localSessionId, 'user_name');
  const { currentCam, currentMic, cameras, microphones, setCamera, setMicrophone } = useDevices();
  const callObject = useDaily();
  const [username, setUsername] = useState(initialUsername || '');

  useEffect(() => {
    if (initialUsername) setUsername(initialUsername);
  }, [initialUsername]);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    joinCall(username.trim() || 'Guest');
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-gray-900 rounded-3xl border border-gray-800 p-8 shadow-2xl">
        <h1 className="text-xl font-bold text-white mb-6 text-center">Setup your devices</h1>

        {/* Video preview */}
        <div className="relative w-full aspect-video bg-gray-800 rounded-2xl overflow-hidden mb-6">
          {localSessionId && <DailyVideo sessionId={localSessionId} mirror type="video" className="w-full h-full object-cover" />}
          {!localSessionId && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
            </div>
          )}
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Your name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={username}
              onChange={e => {
                setUsername(e.target.value);
                callObject?.setUserName(e.target.value);
              }}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50"
            />
          </div>

          {/* Camera select */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Camera</label>
            <select
              value={currentCam?.device?.deviceId}
              onChange={e => setCamera(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {cameras.map(cam => (
                <option key={cam.device.deviceId} value={cam.device.deviceId}>
                  {cam.device.label || 'Camera'}
                </option>
              ))}
            </select>
          </div>

          {/* Mic select */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Microphone</label>
            <select
              value={currentMic?.device?.deviceId}
              onChange={e => setMicrophone(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              {microphones.map(mic => (
                <option key={mic.device.deviceId} value={mic.device.deviceId}>
                  {mic.device.label || 'Microphone'}
                </option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={cancelCall}
              className="flex-1 px-4 py-3 bg-gray-800 text-gray-300 rounded-xl hover:bg-gray-700 transition-colors font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-primary text-white rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all font-semibold cursor-pointer"
            >
              Join Call
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Call View ─── */
function CallView() {
  const { screens } = useScreenShare();
  const remoteParticipantIds = useParticipantIds({ filter: 'remote' });
  const localSessionId = useLocalSessionId();
  const isAlone = remoteParticipantIds.length === 0;

  return (
    <div className="flex-1 flex items-center justify-center p-4 gap-4 overflow-hidden">
      {/* Remote participants or screen shares */}
      {remoteParticipantIds.length > 0 || screens.length > 0 ? (
        <div className="flex-1 flex items-center justify-center gap-4 max-h-full">
          {remoteParticipantIds.map(id => (
            <VideoTile key={id} id={id} isLarge />
          ))}
          {screens.map(screen => (
            <VideoTile key={screen.screenId} id={screen.session_id} isScreenShare isLarge />
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center p-8 bg-gray-900/50 rounded-3xl border border-gray-800">
            <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-500" />
            </div>
            <h2 className="text-lg font-bold text-white mb-1">Waiting for others</h2>
            <p className="text-sm text-gray-400">Share this page URL to invite someone</p>
          </div>
        </div>
      )}

      {/* Self view (smaller, bottom right) */}
      {localSessionId && (
        <div className="absolute bottom-24 right-6 w-48 aspect-video z-20">
          <VideoTile id={localSessionId} isLocal />
        </div>
      )}
    </div>
  );
}

/* ─── Video Tile ─── */
function VideoTile({
  id,
  isLocal,
  isScreenShare,
  isLarge,
}: {
  id: string;
  isLocal?: boolean;
  isScreenShare?: boolean;
  isLarge?: boolean;
}) {
  const videoState = useVideoTrack(id);
  const username = useParticipantProperty(id, 'user_name');

  return (
    <div
      className={cn(
        'relative rounded-2xl overflow-hidden bg-gray-800 border border-gray-700',
        isLarge ? 'w-full max-w-3xl aspect-video' : 'w-full h-full',
        isLocal && 'shadow-xl shadow-black/30',
        videoState.isOff && 'bg-gradient-to-br from-gray-800 to-gray-900'
      )}
    >
      {videoState.isOff ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white text-xl font-bold">
            {(username || 'G')[0].toUpperCase()}
          </div>
        </div>
      ) : (
        <DailyVideo
          automirror
          sessionId={id}
          type={isScreenShare ? 'screenVideo' : 'video'}
          className="w-full h-full object-cover"
        />
      )}
      {/* Username label */}
      <div className="absolute bottom-2 left-2 px-2.5 py-1 bg-black/60 backdrop-blur-sm rounded-lg">
        <span className="text-xs text-white font-medium">
          {username || 'Guest'} {isLocal && '(You)'}
        </span>
      </div>
    </div>
  );
}

/* ─── Tray (controls) ─── */
function Tray({ leaveCall }: { leaveCall: () => void }) {
  const callObject = useDaily();
  const { isSharingScreen, startScreenShare, stopScreenShare } = useScreenShare();
  const localSessionId = useLocalSessionId();
  const localVideo = useVideoTrack(localSessionId);
  const localAudio = useAudioTrack(localSessionId);
  const mutedVideo = localVideo.isOff;
  const mutedAudio = localAudio.isOff;

  const toggleVideo = useCallback(() => {
    callObject?.setLocalVideo(mutedVideo);
  }, [callObject, mutedVideo]);

  const toggleAudio = useCallback(() => {
    callObject?.setLocalAudio(mutedAudio);
  }, [callObject, mutedAudio]);

  const toggleScreen = () => (isSharingScreen ? stopScreenShare() : startScreenShare());

  return (
    <div className="flex-shrink-0 flex items-center justify-center gap-3 px-6 py-4 bg-gray-900 border-t border-gray-800">
      {/* Mic toggle */}
      <button
        onClick={toggleAudio}
        className={cn(
          'p-3.5 rounded-xl transition-all duration-200 cursor-pointer',
          mutedAudio
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
            : 'bg-gray-800 text-white hover:bg-gray-700'
        )}
      >
        {mutedAudio ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
      </button>

      {/* Camera toggle */}
      <button
        onClick={toggleVideo}
        className={cn(
          'p-3.5 rounded-xl transition-all duration-200 cursor-pointer',
          mutedVideo
            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
            : 'bg-gray-800 text-white hover:bg-gray-700'
        )}
      >
        {mutedVideo ? <CameraOff className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
      </button>

      {/* Screen share */}
      <button
        onClick={toggleScreen}
        className={cn(
          'p-3.5 rounded-xl transition-all duration-200 cursor-pointer',
          isSharingScreen
            ? 'bg-primary/20 text-primary hover:bg-primary/30'
            : 'bg-gray-800 text-white hover:bg-gray-700'
        )}
      >
        <MonitorUp className="w-5 h-5" />
      </button>

      {/* Leave */}
      <button
        onClick={leaveCall}
        className="px-6 py-3.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium flex items-center gap-2 cursor-pointer"
      >
        <PhoneOff className="w-5 h-5" />
        <span className="hidden sm:inline">Leave</span>
      </button>
    </div>
  );
}
