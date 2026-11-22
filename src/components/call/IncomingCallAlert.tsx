'use client';

import React from 'react';
import { useCall } from '@/context/CallContext';
import { Avatar } from '@/components/ui/Avatar';
import { Phone, PhoneOff, Video } from 'lucide-react';

export function IncomingCallAlert() {
  const { incomingCall, acceptCall, rejectCall } = useCall();

  if (!incomingCall) return null;

  const isVideo = incomingCall.type === 'video';

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 animate-bounce-subtle">
      <div className="bg-card/95 backdrop-blur-2xl border-2 border-primary/50 rounded-3xl p-4 shadow-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative shrink-0">
            <Avatar
              src={incomingCall.callerAvatar || undefined}
              name={incomingCall.callerName}
              size="lg"
            />
            <span className="absolute -bottom-1 -right-1 p-1 rounded-full bg-primary text-white text-[10px] shadow-sm">
              {isVideo ? <Video className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
            </span>
          </div>

          <div className="min-w-0">
            <h4 className="text-sm font-bold truncate text-foreground">
              {incomingCall.callerName}
            </h4>
            <p className="text-xs text-muted-foreground animate-pulse">
              Incoming {isVideo ? 'Video' : 'Voice'} Call...
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={rejectCall}
            className="w-10 h-10 rounded-full bg-destructive/15 text-destructive hover:bg-destructive hover:text-white transition-all flex items-center justify-center"
            title="Decline Call"
          >
            <PhoneOff className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={acceptCall}
            className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center animate-pulse"
            title="Accept Call"
          >
            <Phone className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
