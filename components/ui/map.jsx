"use client";

import { useRef, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DottedMap from "dotted-map";
import Image from "next/image";
import { useTheme } from "next-themes";

export function WorldMap({
  dots = [],
  lineColor = "#0ea5e9",
  showLabels = true,
  labelClassName = "text-sm",
  animationDuration = 2,
  loop = true,
  theme: themeProp,
}) {
  const svgRef = useRef(null);
  const [hoveredLocation, setHoveredLocation] = useState(null);
  const { theme: contextTheme } = useTheme();
  const theme = themeProp ?? contextTheme ?? "light";

  const map = useMemo(
    () => new DottedMap({ height: 100, grid: "diagonal" }),
    []
  );

  const svgMap = useMemo(
    () =>
      map.getSVG({
        radius: 0.22,
        color: theme === "dark" ? "#FFFF7F40" : "#00000040",
        shape: "circle",
        backgroundColor: theme === "dark" ? "black" : "white",
      }),
    [map, theme]
  );

  const projectPoint = (lat, lng) => {
    const x = (lng + 180) * (800 / 360);
    const y = (90 - lat) * (400 / 180);
    return { x, y };
  };

  const createCurvedPath = (start, end) => {
    const midX = (start.x + end.x) / 2;
    const midY = Math.min(start.y, end.y) - 50;
    return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
  };

  // Calculate animation timing
  const staggerDelay = 0.3;
  const totalAnimationTime = dots.length * staggerDelay + animationDuration;
  const pauseTime = 2; // Pause for 2 seconds when all paths are drawn
  const fullCycleDuration = totalAnimationTime + pauseTime;

  const isDark = theme === "dark";

  return (
    <div
      className={`w-full aspect-[2/1] md:aspect-[2.5/1] lg:aspect-[2/1] ${
        isDark ? "bg-black" : "bg-white"
      } rounded-lg relative font-sans overflow-hidden`}
    >
      <Image
        src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
        className="h-full w-full [mask-image:linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)] pointer-events-none select-none object-cover"
        alt="world map"
        height="495"
        width="1056"
        draggable={false}
        priority
        unoptimized
      />
      <svg
        ref={svgRef}
        viewBox="0 0 800 400"
        className="w-full h-full absolute inset-0 pointer-events-auto select-none"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="5%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="95%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>

          <filter id="glow">
            <feMorphology operator="dilate" radius="0.5" />
            <feGaussianBlur stdDeviation="1" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {dots.map((dot, i) => {
          const startPoint = projectPoint(dot.start.lat, dot.start.lng);
          const endPoint = projectPoint(dot.end.lat, dot.end.lng);

          // Calculate keyframe times for this specific path
          const startTime = (i * staggerDelay) / fullCycleDuration;
          const endTime =
            (i * staggerDelay + animationDuration) / fullCycleDuration;
          const resetTime = totalAnimationTime / fullCycleDuration;

          return (
            <g key={`path-group-${i}`}>
              <motion.path
                d={createCurvedPath(startPoint, endPoint)}
                fill="none"
                stroke="url(#path-gradient)"
                strokeWidth="1"
                initial={{ pathLength: 0 }}
                animate={
                  loop
                    ? {
                        pathLength: [0, 0, 1, 1, 0],
                      }
                    : {
                        pathLength: 1,
                      }
                }
                transition={
                  loop
                    ? {
                        duration: fullCycleDuration,
                        times: [0, startTime, endTime, resetTime, 1],
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatDelay: 0,
                      }
                    : {
                        duration: animationDuration,
                        delay: i * staggerDelay,
                        ease: "easeInOut",
                      }
                }
              />

              {loop && (
                <motion.circle
                  r="4"
                  fill={lineColor}
                  initial={{ offsetDistance: "0%", opacity: 0 }}
                  animate={{
                    offsetDistance: [null, "0%", "100%", "100%", "100%"],
                    opacity: [0, 0, 1, 0, 0],
                  }}
                  transition={{
                    duration: fullCycleDuration,
                    times: [0, startTime, endTime, resetTime, 1],
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatDelay: 0,
                  }}
                  style={{
                    offsetPath: `path('${createCurvedPath(startPoint, endPoint)}')`,
                  }}
                />
              )}
            </g>
          );
        })}

        {/* Render unique points and labels */}
        {(() => {
          const uniqueMap = new Map();
          dots.forEach((dot) => {
            if (dot.start?.label) {
              const key = `${dot.start.lat.toFixed(2)},${dot.start.lng.toFixed(2)}`;
              if (!uniqueMap.has(key)) uniqueMap.set(key, dot.start);
            }
            if (dot.end?.label) {
              const key = `${dot.end.lat.toFixed(2)},${dot.end.lng.toFixed(2)}`;
              if (!uniqueMap.has(key)) uniqueMap.set(key, dot.end);
            }
          });
          const uniquePoints = Array.from(uniqueMap.values());

          return uniquePoints.map((pt, i) => {
            const point = projectPoint(pt.lat, pt.lng);
            return (
              <g key={`pt-group-${i}`}>
                <motion.g
                  onHoverStart={() =>
                    setHoveredLocation(pt.label || `Location ${i}`)
                  }
                  onHoverEnd={() => setHoveredLocation(null)}
                  className="cursor-pointer"
                  whileHover={{ scale: 1.25 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="4"
                    fill={lineColor}
                    filter="url(#glow)"
                    className="drop-shadow-lg"
                  />
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="4"
                    fill={lineColor}
                    opacity="0.5"
                  >
                    <animate
                      attributeName="r"
                      from="4"
                      to="14"
                      dur="2.2s"
                      begin={`${(i % 3) * 0.4}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      from="0.7"
                      to="0"
                      dur="2.2s"
                      begin={`${(i % 3) * 0.4}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                </motion.g>

                {showLabels && pt.label && (() => {
                  const offsetX = pt.offset?.x || 0;
                  const offsetY = pt.offset?.y || 0;
                  return (
                    <motion.g
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * i + 0.1, duration: 0.4 }}
                      className="pointer-events-none"
                    >
                      <foreignObject
                        x={point.x - 70 + offsetX}
                        y={point.y - 36 + offsetY}
                        width="140"
                        height="32"
                        className="block overflow-visible"
                      >
                      <div className="flex items-center justify-center h-full">
                        <span
                          className={`text-[11px] font-bold tracking-wide whitespace-nowrap px-2.5 py-1 rounded-md border shadow-md ${
                            isDark
                              ? "bg-black/90 text-white border-white/20 backdrop-blur-md"
                              : "bg-white/95 text-black border-gray-200 backdrop-blur-md"
                          }`}
                        >
                          {pt.label}
                        </span>
                      </div>
                    </foreignObject>
                  </motion.g>
                );
              })()}
              </g>
            );
          });
        })()}
      </svg>

      {/* Mobile Tooltip */}
      <AnimatePresence>
        {hoveredLocation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`absolute bottom-4 left-4 px-3 py-2 rounded-lg text-sm font-medium backdrop-blur-sm sm:hidden border ${
              isDark
                ? "bg-black/90 text-white border-gray-700"
                : "bg-white/90 text-black border-gray-200"
            }`}
          >
            {hoveredLocation}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
