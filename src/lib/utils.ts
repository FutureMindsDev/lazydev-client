import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Tailwind-aware className combiner used by all UI components. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Relative time formatter ("3m ago", "2h ago", "just now"). */
export function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = Math.max(0, now - then);
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.floor(day / 30);
  return `${mo}mo ago`;
}

/** Queue depth = waiting + active (in-flight work the operator cares about). */
export function queueDepth(counts: Record<string, number>): number {
  return (counts.waiting ?? 0) + (counts.active ?? 0);
}

/** Color band for queue depth per plan §4.1. */
export function queueDepthBand(depth: number): 'green' | 'amber' | 'red' {
  if (depth >= 20) return 'red';
  if (depth >= 5) return 'amber';
  return 'green';
}
