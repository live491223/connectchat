'use client';

import React, { useEffect, useRef } from 'react';
import { useCall } from '@/context/CallContext';
import { Avatar } from '@/components/ui/Avatar';
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  PhoneOff,
  Phone,
  Volume2,
  Sparkles,
  Maximize2,
  Minimize2,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function WebRTCCallModal() {
  const {
    activeCall,
    localStream,
    remoteStream,
    audioLevel,
    endCall,
    toggleMute,
    toggleVideo,
    toggleLoopback,
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, activeCall?.isVideoOff]);

  // Attach remote stream to video element
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (!activeCall) return null;

  const isVideo = activeCall.type === 'video';
  const isConnected = activeCall.status === 'connected';

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 text-white animate-fade-in select-none">
      {/* Top Bar: Call Status & Controls */}
      <div className="flex items-center justify-between z-20">
        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md py-1.5 px-4 rounded-full border border-white/10">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'w-2.5 h-2.5 rounded-full',
                isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400 animate-ping'
              )}
            />
            <span className="text-xs font-semibold uppercase tracking-wider">
              {isConnected
                ? activeCall.isLoopback
                  ? 'Self-Test Loopback Active'
                  : 'WebRTC P2P Connected'
                : 'Calling / Ringing...'}
            </span>
          </div>
          {isConnected && (
            <span className="text-xs font-mono font-bold text-white/80 border-l border-white/20 pl-3">
              {formatDuration(activeCall.duration)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Security badge */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-white/60 bg-white/5 py-1 px-3 rounded-full border border-white/10">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>End-to-End WebRTC Encrypted</span>
          </div>

          {/* Loopback Test Button */}
          <button
            type="button"
            onClick={toggleLoopback}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border transition-all',
              activeCall.isLoopback
                ? 'bg-amber-500 text-black border-amber-400 shadow-lg'
                : 'bg-white/10 text-white border-white/15 hover:bg-white/20'
            )}
            title="Test your own camera and microphone loopback"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{activeCall.isLoopback ? 'Exit Test' : 'Test Mic/Cam'}</span>
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 flex items-center justify-center relative my-4 overflow-hidden rounded-3xl bg-neutral-900 border border-white/10 shadow-2xl">
        {/* Remote Video Stream (or Voice Avatar view) */}
        {isVideo && remoteStream && !activeCall.isVideoOff ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            {/* Audio Wave Visualizer Ring around Avatar */}
            <div className="relative mb-6">
              <div
                className="absolute inset-0 rounded-full bg-primary/30 transition-all duration-75 pointer-events-none"
                style={{
                  transform: `scale(${1 + (audioLevel / 100) * 0.4})`,
                  opacity: Math.max(0.2, audioLevel / 100),
                }}
              />
              <Avatar
                src={activeCall.remoteUserAvatar || undefined}
                name={activeCall.remoteUserName}
                size="2xl"
                className="shadow-2xl border-4 border-white/20 relative z-10"
              />
            </div>

            <h3 className="text-xl sm:text-2xl font-bold tracking-tight">
              {activeCall.remoteUserName}
            </h3>
            <p className="text-sm text-white/60 mt-1 flex items-center justify-center gap-1.5">
              {isConnected ? (
                <>
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  {isVideo ? 'HD Video Call Connected' : 'HD Voice Call Connected'}
                </>
              ) : (
                'Ringing recipient device...'
              )}
            </p>

            {/* Audio level indicator meter */}
            <div className="flex items-center gap-1.5 mt-4 bg-white/10 py-1 px-3 rounded-full">
              <Volume2 className="w-3.5 h-3.5 text-white/60" />
              <div className="w-24 h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-all duration-75"
                  style={{ width: `${audioLevel}%` }}
                />
              </div>
              <span className="text-[10px] text-white/60 font-mono">{audioLevel}%</span>
            </div>
          </div>
        )}

        {/* Local Video Preview (Picture-in-Picture in corner) */}
        {isVideo && localStream && (
          <div className="absolute bottom-4 right-4 w-32 sm:w-48 aspect-video rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-neutral-800 z-10">
            {!activeCall.isVideoOff ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform -scale-x-100"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-neutral-900 text-white/50 text-[11px]">
                <VideoOff className="w-5 h-5 mb-1" />
                <span>Camera Off</span>
              </div>
            )}
            <div className="absolute bottom-1.5 left-2 text-[10px] bg-black/60 px-1.5 py-0.5 rounded text-white/80 font-medium">
              You
            </div>
          </div>
        )}
      </div>

      {/* Bottom Control Dock */}
      <div className="flex items-center justify-center gap-4 z-20 pb-2">
        {/* Mute Microphone */}
        <button
          type="button"
          onClick={toggleMute}
          className={cn(
            'w-13 h-13 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95',
            activeCall.isMuted
              ? 'bg-amber-500 text-black hover:bg-amber-400'
              : 'bg-white/15 text-white hover:bg-white/25 border border-white/15'
          )}
          title={activeCall.isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {activeCall.isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Toggle Camera (if video call) */}
        {isVideo && (
          <button
            type="button"
            onClick={toggleVideo}
            className={cn(
              'w-13 h-13 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95',
              activeCall.isVideoOff
                ? 'bg-amber-500 text-black hover:bg-amber-400'
                : 'bg-white/15 text-white hover:bg-white/25 border border-white/15'
            )}
            title={activeCall.isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {activeCall.isVideoOff ? (
              <VideoOff className="w-5 h-5" />
            ) : (
              <VideoIcon className="w-5 h-5" />
            )}
          </button>
        )}

        {/* End Call Button */}
        <button
          type="button"
          onClick={endCall}
          className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-xl shadow-rose-600/30 transition-all transform active:scale-90"
          title="End Call"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
