'use client';

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { soundEffects } from '@/lib/sound';

export interface CallState {
  callId: string;
  conversationId: string;
  type: 'voice' | 'video';
  role: 'caller' | 'recipient';
  status: 'initiating' | 'ringing' | 'connected' | 'ended';
  remoteUserName: string;
  remoteUserAvatar?: string | null;
  remoteUserId?: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isLoopback: boolean;
  duration: number;
}

export interface IncomingCallInfo {
  callId: string;
  conversationId: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string | null;
  type: 'voice' | 'video';
}

interface CallContextType {
  activeCall: CallState | null;
  incomingCall: IncomingCallInfo | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  audioLevel: number;
  startCall: (params: {
    recipientId: string;
    recipientName: string;
    recipientAvatar?: string | null;
    conversationId: string;
    type: 'voice' | 'video';
  }) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => Promise<void>;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleLoopback: () => void;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export function CallProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [activeCall, setActiveCall] = useState<CallState | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallInfo | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);

  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Setup live audio visualizer meter
  const setupAudioMeter = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const checkLevel = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(checkLevel);
      };
      checkLevel();
    } catch (e) {
      console.warn('Audio meter setup warning:', e);
    }
  };

  const cleanupAudioMeter = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {}
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  };

  // 1. Listen for Incoming Calls
  useEffect(() => {
    if (!user?.id || activeCall) return;

    const checkIncoming = async () => {
      try {
        const res = await fetch(`/api/call/signal?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.hasIncomingCall && data.call) {
            setIncomingCall(data.call);
            soundEffects.startRingtone();
          } else if (incomingCall) {
            setIncomingCall(null);
            soundEffects.stopRingtone();
          }
        }
      } catch (e) {}
    };

    const interval = setInterval(checkIncoming, 2500);
    return () => clearInterval(interval);
  }, [user?.id, activeCall, incomingCall]);

  // Clean streams & peer connections
  const cleanupStreams = useCallback(() => {
    soundEffects.stopRingtone();
    cleanupAudioMeter();

    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setRemoteStream(null);

    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
  }, []);

  // 2. Start Call (Caller side)
  const startCall = async (params: {
    recipientId: string;
    recipientName: string;
    recipientAvatar?: string | null;
    conversationId: string;
    type: 'voice' | 'video';
  }) => {
    cleanupStreams();

    try {
      // Access camera and microphone
      const isVideo = params.type === 'video';
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: isVideo ? { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        });
      } catch (err) {
        // Fallback to audio-only if video fails (e.g. no camera connected)
        console.warn('Video access failed, falling back to audio-only:', err);
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      }

      localStreamRef.current = stream;
      setLocalStream(stream);
      setupAudioMeter(stream);

      // Create WebRTC Peer Connection
      const peer = new RTCPeerConnection(ICE_SERVERS);
      peerRef.current = peer;

      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream);
      });

      peer.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      // Create Call record on server
      const startRes = await fetch('/api/call/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          userId: user?.id,
          callerName: user?.name || 'User',
          callerAvatar: user?.avatar,
          recipientId: params.recipientId,
          conversationId: params.conversationId,
          type: params.type,
        }),
      });

      const startData = await startRes.json();
      const callId = startData.callId;

      // Handle ICE candidates
      peer.onicecandidate = (event) => {
        if (event.candidate) {
          fetch('/api/call/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'ice-candidate',
              callId,
              candidate: event.candidate,
              senderRole: 'caller',
            }),
          }).catch(() => {});
        }
      };

      // Create SDP Offer
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);

      // Dispatch Offer to server
      await fetch('/api/call/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'offer',
          callId,
          sdp: offer,
        }),
      });

      setActiveCall({
        callId,
        conversationId: params.conversationId,
        type: params.type,
        role: 'caller',
        status: 'ringing',
        remoteUserName: params.recipientName,
        remoteUserAvatar: params.recipientAvatar,
        remoteUserId: params.recipientId,
        isMuted: false,
        isVideoOff: !isVideo,
        isLoopback: false,
        duration: 0,
      });

      // Poll for answer
      let answerSet = false;
      pollTimerRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/call/signal?callId=${callId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.call) {
              if (data.call.status === 'ended' || data.call.status === 'rejected') {
                endCall();
                return;
              }

              if (data.call.answer && !answerSet) {
                answerSet = true;
                await peer.setRemoteDescription(new RTCSessionDescription(data.call.answer));

                // Add remote ICE candidates
                if (data.call.recipientIce) {
                  for (const candidate of data.call.recipientIce) {
                    try {
                      await peer.addIceCandidate(new RTCIceCandidate(candidate));
                    } catch (e) {}
                  }
                }

                setActiveCall((prev) => (prev ? { ...prev, status: 'connected' } : null));

                // Start duration counter
                if (!durationTimerRef.current) {
                  durationTimerRef.current = setInterval(() => {
                    setActiveCall((prev) => (prev ? { ...prev, duration: prev.duration + 1 } : null));
                  }, 1000);
                }
              }
            }
          }
        } catch (e) {}
      }, 1500);
    } catch (error: any) {
      console.error('Call initialization failed:', error);
      alert('Could not access microphone/camera. Please check browser permissions.');
      cleanupStreams();
      setActiveCall(null);
    }
  };

  // 3. Accept Incoming Call (Recipient side)
  const acceptCall = async () => {
    if (!incomingCall) return;
    soundEffects.stopRingtone();

    const callInfo = { ...incomingCall };
    setIncomingCall(null);

    try {
      const isVideo = callInfo.type === 'video';
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: isVideo ? { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        });
      } catch (err) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      }

      localStreamRef.current = stream;
      setLocalStream(stream);
      setupAudioMeter(stream);

      const peer = new RTCPeerConnection(ICE_SERVERS);
      peerRef.current = peer;

      stream.getTracks().forEach((track) => {
        peer.addTrack(track, stream);
      });

      peer.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          fetch('/api/call/signal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'ice-candidate',
              callId: callInfo.callId,
              candidate: event.candidate,
              senderRole: 'recipient',
            }),
          }).catch(() => {});
        }
      };

      // Fetch caller offer
      const callDataRes = await fetch(`/api/call/signal?callId=${callInfo.callId}`);
      const { call } = await callDataRes.json();

      if (!call?.offer) {
        throw new Error('Call offer not found or caller cancelled');
      }

      await peer.setRemoteDescription(new RTCSessionDescription(call.offer));

      // Add caller ICE candidates
      if (call.callerIce) {
        for (const candidate of call.callerIce) {
          try {
            await peer.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {}
        }
      }

      // Create & dispatch Answer
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      await fetch('/api/call/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'answer',
          callId: callInfo.callId,
          sdp: answer,
        }),
      });

      setActiveCall({
        callId: callInfo.callId,
        conversationId: callInfo.conversationId,
        type: callInfo.type,
        role: 'recipient',
        status: 'connected',
        remoteUserName: callInfo.callerName,
        remoteUserAvatar: callInfo.callerAvatar,
        remoteUserId: callInfo.callerId,
        isMuted: false,
        isVideoOff: !isVideo,
        isLoopback: false,
        duration: 0,
      });

      // Start duration counter
      durationTimerRef.current = setInterval(() => {
        setActiveCall((prev) => (prev ? { ...prev, duration: prev.duration + 1 } : null));
      }, 1000);
    } catch (error) {
      console.error('Accept call failed:', error);
      alert('Failed to connect call');
      cleanupStreams();
      setActiveCall(null);
    }
  };

  // 4. Reject Incoming Call
  const rejectCall = async () => {
    soundEffects.stopRingtone();
    if (incomingCall) {
      await fetch('/api/call/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          callId: incomingCall.callId,
          recipientId: user?.id,
        }),
      }).catch(() => {});
    }
    setIncomingCall(null);
  };

  // 5. End Ongoing Call
  const endCall = useCallback(async () => {
    if (activeCall?.callId) {
      fetch('/api/call/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'end',
          callId: activeCall.callId,
          recipientId: activeCall.remoteUserId,
        }),
      }).catch(() => {});
    }
    cleanupStreams();
    setActiveCall(null);
  }, [activeCall, cleanupStreams]);

  // 6. Mute / Unmute Microphone
  const toggleMute = () => {
    if (!localStreamRef.current) return;
    const audioTrack = localStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setActiveCall((prev) => (prev ? { ...prev, isMuted: !audioTrack.enabled } : null));
    }
  };

  // 7. Video Track Toggle (On / Off)
  const toggleVideo = () => {
    if (!localStreamRef.current) return;
    const videoTrack = localStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setActiveCall((prev) => (prev ? { ...prev, isVideoOff: !videoTrack.enabled } : null));
    }
  };

  // 8. Self-Test / Loopback Echo Mode
  const toggleLoopback = () => {
    setActiveCall((prev) => {
      if (!prev) return null;
      const nextLoop = !prev.isLoopback;
      if (nextLoop && localStreamRef.current) {
        setRemoteStream(localStreamRef.current);
      } else {
        setRemoteStream(null);
      }
      return {
        ...prev,
        isLoopback: nextLoop,
        status: nextLoop ? 'connected' : prev.status,
      };
    });
  };

  return (
    <CallContext.Provider
      value={{
        activeCall,
        incomingCall,
        localStream,
        remoteStream,
        audioLevel,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
        toggleLoopback,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}
