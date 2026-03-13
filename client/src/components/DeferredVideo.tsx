"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type DeferredVideoProps = Omit<
  ComponentPropsWithoutRef<"video">,
  "children" | "poster" | "src"
> & {
  alt: string;
  className?: string;
  imageClassName?: string;
  imageSizes: string;
  overlay?: boolean;
  overlayClassName?: string;
  poster: string;
  priority?: boolean;
  rootMargin?: string;
  src: string;
  videoClassName?: string;
};

export function DeferredVideo({
  alt,
  autoPlay = true,
  className,
  imageClassName,
  imageSizes,
  muted = true,
  overlay = false,
  overlayClassName,
  playsInline = true,
  poster,
  preload = "none",
  priority = false,
  rootMargin = "200px",
  src,
  videoClassName,
  ...videoProps
}: DeferredVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isNearViewport, setIsNearViewport] = useState(priority);
  const [isVisible, setIsVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);
    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) {
          return;
        }

        setIsVisible(entry.isIntersecting);
        if (entry.isIntersecting) {
          setIsNearViewport(true);
        }
      },
      {
        rootMargin,
        threshold: 0.15,
      },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [rootMargin]);

  useEffect(() => {
    if (!isNearViewport || prefersReducedMotion) {
      return;
    }

    let timeoutId: ReturnType<typeof globalThis.setTimeout> | undefined;
    let idleId: number | undefined;
    const idleScheduler = globalThis as typeof globalThis & {
      cancelIdleCallback?: (handle: number) => void;
      requestIdleCallback?: (
        callback: () => void,
        options?: { timeout: number },
      ) => number;
    };

    const loadWhenIdle = () => setShouldLoadVideo(true);

    if (typeof idleScheduler.requestIdleCallback === "function") {
      idleId = idleScheduler.requestIdleCallback(loadWhenIdle, {
        timeout: 1200,
      });
    } else {
      timeoutId = globalThis.setTimeout(loadWhenIdle, 180);
    }

    return () => {
      if (
        idleId !== undefined &&
        typeof idleScheduler.cancelIdleCallback === "function"
      ) {
        idleScheduler.cancelIdleCallback(idleId);
      }

      if (timeoutId !== undefined) {
        globalThis.clearTimeout(timeoutId);
      }
    };
  }, [isNearViewport, prefersReducedMotion]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldLoadVideo || prefersReducedMotion) {
      return;
    }

    if (!isVisible || !autoPlay) {
      video.pause();
      return;
    }

    video.play().catch(() => undefined);
  }, [autoPlay, isVisible, prefersReducedMotion, shouldLoadVideo]);

  return (
    <div ref={containerRef} className={cn("relative overflow-hidden", className)}>
      <Image
        src={poster}
        alt={alt}
        fill
        sizes={imageSizes}
        priority={priority}
        className={cn(
          "object-cover transition-opacity duration-500",
          isReady && shouldLoadVideo && !prefersReducedMotion
            ? "opacity-0"
            : "opacity-100",
          imageClassName,
        )}
      />

      {shouldLoadVideo && !prefersReducedMotion ? (
        <video
          ref={videoRef}
          src={src}
          autoPlay={autoPlay}
          muted={muted}
          playsInline={playsInline}
          preload={preload}
          poster={poster}
          className={cn("absolute inset-0 h-full w-full", videoClassName)}
          onLoadedData={() => setIsReady(true)}
          {...videoProps}
        />
      ) : null}

      {overlay ? (
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-[#020a18]/45 via-transparent to-white/5",
            overlayClassName,
          )}
        />
      ) : null}
    </div>
  );
}
