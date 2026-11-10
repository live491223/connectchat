'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { formatDuration } from '@/lib/utils';

interface VoicePlayerProps {
  url: string;
  duration?: number | null;
  isMe?: boolean;
}

export function VoicePlayer({ url, duration = 0, isMe = false }: VoicePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setTotalDuration(audio.duration);
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch((e) => console.error(e));
    }
  };

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  // Static waveform bar heights
  const bars = [25, 45, 70, 95, 60, 40, 80, 100, 75, 50, 65, 85, 40, 60, 90, 70, 45, 30, 60, 85, 100, 75, 40, 20];

  return (
    <div className="flex items-center gap-3 py-1 min-w-[200px] max-w-[260px] select-none">
      <audio ref={audioRef} src={url} preload="metadata" />

      <button
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all transform active:scale-95 flex-shrink-0 ${
          isMe
            ? 'bg-white text-primary hover:bg-white/90 shadow'
            : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow'
        }`}
        aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      <div className="flex-1 flex flex-col justify-center gap-1.5">
        {/* Waveform Visualization */}
        <div className="flex items-center gap-0.5 h-6">
          {bars.map((height, i) => {
            const barProgress = (i / bars.length) * 100;
            const isPlayed = barProgress <= progress;

            return (
              <span
                key={i}
                style={{ height: `${height}%` }}
                className={`w-1 rounded-full transition-all duration-100 ${
                  isPlayed
                    ? isMe
                      ? 'bg-white'
                      : 'bg-primary'
                    : isMe
                    ? 'bg-white/40'
                    : 'bg-muted-foreground/30'
                }`}
              />
            );
          })}
        </div>

        {/* Timestamps */}
        <div className="flex items-center justify-between text-[11px] leading-none opacity-80">
          <span>{formatDuration(isPlaying ? currentTime : totalDuration)}</span>
        </div>
      </div>
    </div>
  );
}
