"use client";

import { useId } from "react";

/**
 * Animated support mascot.
 *
 * Idle loop: the bot bobs, blinks, its antenna beacon pulses and it throws a
 * two-beat wave every 5s while the head leans into it. All motion is CSS
 * (keyframes live in globals.css under "Support bot mascot") so nothing
 * re-renders and it respects prefers-reduced-motion.
 *
 * Drawn on a 64×64 grid for a light shell on a dark surface — the launcher
 * button and the panel header are both near-black.
 */
export default function SupportBot({ size = 34, className = "" }) {
  // Two instances render at once (button + header), so the clip id must be unique.
  const clipId = `sm-bot-visor-${useId().replace(/:/g, "")}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="20" y="18" width="24" height="18" rx="9" />
        </clipPath>
      </defs>

      <g className="sm-bot-float">
        {/* ── Antenna ───────────────────────────────────────────────────── */}
        <circle className="sm-bot-halo" cx="32" cy="6.5" r="3" fill="#34d399" />
        <path d="M32 13V9" stroke="#a1a1aa" strokeWidth="2" strokeLinecap="round" />
        <circle className="sm-bot-beacon" cx="32" cy="6.5" r="2.6" fill="#34d399" />

        {/* ── Head ──────────────────────────────────────────────────────── */}
        <g className="sm-bot-tilt">
          {/* Ear pods */}
          <rect x="12.4" y="23" width="3.6" height="9" rx="1.8" fill="#a1a1aa" />
          <rect x="48"   y="23" width="3.6" height="9" rx="1.8" fill="#a1a1aa" />

          <rect x="16" y="12" width="32" height="31" rx="12.5" fill="#fafafa" />
          {/* Shading along the bottom edge so the shell reads as a volume */}
          <path
            d="M16 31v-.5c0 6.9 7.2 12.5 16 12.5s16-5.6 16-12.5v.5c0 6.9-7.2 12.5-16 12.5S16 37.9 16 31Z"
            fill="#d4d4d8"
            opacity="0.7"
          />

          {/* Visor */}
          <rect x="20" y="18" width="24" height="18" rx="9" fill="#18181b" />

          <g clipPath={`url(#${clipId})`}>
            {/* Eyes */}
            <g className="sm-bot-eyes">
              <ellipse cx="27" cy="26" rx="3.1" ry="3.6" fill="#34d399" />
              <ellipse cx="37" cy="26" rx="3.1" ry="3.6" fill="#34d399" />
              <circle cx="28.1" cy="24.6" r="1" fill="#ecfdf5" />
              <circle cx="38.1" cy="24.6" r="1" fill="#ecfdf5" />
            </g>
            {/* Mouth */}
            <rect
              className="sm-bot-mouth"
              x="28.5" y="32.9" width="7" height="2.2" rx="1.1"
              fill="#34d399" opacity="0.8"
            />
            {/* Glass glint sweeping left to right. The rotation lives on the
                inner rect — a CSS transform on the animated <g> would override
                a transform attribute on the same element. */}
            <g className="sm-bot-glint">
              <rect
                x="14" y="14" width="5" height="26" rx="2.5"
                fill="#ffffff" transform="rotate(18 16.5 27)"
              />
            </g>
          </g>
        </g>

        {/* ── Body ──────────────────────────────────────────────────────── */}
        <rect x="28.5" y="41" width="7" height="5" rx="2" fill="#a1a1aa" />
        <rect x="20" y="45" width="24" height="15" rx="7.5" fill="#fafafa" />
        <rect x="27.5" y="49.5" width="9" height="5" rx="2.5" fill="#34d399" opacity="0.85" />

        {/* Resting arm — gentle counter-swing to the wave */}
        <rect
          className="sm-bot-arm"
          x="14" y="46" width="4.4" height="11" rx="2.2" fill="#e4e4e7"
        />

        {/* Waving arm */}
        <g className="sm-bot-wave">
          <rect x="48.5" y="39" width="4.4" height="11" rx="2.2" fill="#fafafa" />
          <circle cx="50.7" cy="37.6" r="3.5" fill="#fafafa" />
        </g>
      </g>
    </svg>
  );
}
