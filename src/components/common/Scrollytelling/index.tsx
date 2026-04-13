import React, { useEffect, useRef, useState, ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollToPlugin, ScrollTrigger);

interface ScrollytellingProps {
  totalFrames?: number;
  frameUrlTemplate?: (index: number) => string;
  zoomFactor?: number;
  children?: ReactNode;
  wrapperHeight?: string;
}

export default function Scrollytelling({
  totalFrames = 51,
  frameUrlTemplate = (index) => `/frames/ezgif-frame-${String(index).padStart(3, '0')}.webp`,
  zoomFactor = 1.35,
  wrapperHeight = "400vh",
  children
}: ScrollytellingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [loadedCount, setLoadedCount] = useState(0);
  const [images] = useState<HTMLImageElement[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Preload images
  useEffect(() => {
    let loaded = 0;
    
    // In React 18 strict mode, useEffect runs twice. We could memoize or cancel,
    // but for simplicity, we just check if it's already preloading.
    if (images.length > 0) return;

    for (let i = 0; i < totalFrames; i++) {
      const img = new Image();
      img.src = frameUrlTemplate(i + 1); // 1-indexed assuming 001 to 051

      const onLoadOrError = () => {
        loaded++;
        setLoadedCount(Math.min(loaded, totalFrames));
        if (loaded >= totalFrames) {
          setIsLoaded(true);
        }
      };

      img.onload = onLoadOrError;
      img.onerror = () => {
        console.warn(`Failed to frame: ${img.src}`);
        onLoadOrError();
      };
      
      images[i] = img;
    }
  }, [totalFrames, frameUrlTemplate, images]);

  // Object-fit: cover drawing function
  const drawFrame = (index: number) => {
    if (!canvasRef.current || !images[index] || !images[index].complete) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = images[index];
    
    // Match window size exactly
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Calculate aspect ratios
    const canvasRatio = canvas.width / canvas.height;
    const imgRatio = img.width / img.height;
    
    let drawWidth = canvas.width * zoomFactor;
    let drawHeight = canvas.height * zoomFactor;
    
    if (canvasRatio > imgRatio) {
      // Canvas is wider than the image
      drawHeight = (drawWidth / imgRatio);
    } else {
      // Canvas is taller than the image
      drawWidth = (drawHeight * imgRatio);
    }

    const startX = (canvas.width - drawWidth) / 2;
    const startY = (canvas.height - drawHeight) / 2;
    
    // Solid background
    ctx.fillStyle = '#100c00'; // Dark theme bg instead of pure black sometimes looks better
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw
    ctx.drawImage(img, startX, startY, drawWidth, drawHeight);
  };

  // Scroll mapping using GSAP ScrollTrigger
  useEffect(() => {
    if (!isLoaded || !scrollWrapperRef.current) return;
    
    // Initial draw
    drawFrame(0);

    let animationFrameId: number;

    const scrollTrigger = ScrollTrigger.create({
      trigger: scrollWrapperRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: 1.5, // 1.5 seconds of smooth catching up
      onUpdate: (self) => {
        const frameIndex = Math.min(
          totalFrames - 1, 
          Math.floor(self.progress * totalFrames)
        );
        if (animationFrameId) cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(() => drawFrame(frameIndex));
      }
    });

    const handleResize = () => {
      // Re-draw current frame to fix aspect ratio on resize
      if (scrollTrigger && scrollTrigger.progress !== undefined) {
        const frameIndex = Math.min(
          totalFrames - 1, 
          Math.floor(scrollTrigger.progress * totalFrames)
        );
        drawFrame(frameIndex);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      scrollTrigger.kill();
    };
  }, [isLoaded, totalFrames]);

  // GSAP Mouse Parallax
  useEffect(() => {
    if (!isLoaded || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      // Offset from -1 to 1 based on center of screen
      const xOffset = (e.clientX / window.innerWidth) * 2 - 1;
      const yOffset = (e.clientY / window.innerHeight) * 2 - 1;

      gsap.to(canvas, {
        x: -xOffset * 15, // shift up to 15px
        y: -yOffset * 15,
        duration: 1,
        ease: 'power2.out',
      });
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isLoaded]);

  const percentage = Math.min(100, Math.floor((loadedCount / totalFrames) * 100));

  return (
    <>
      {/* Tall wrapper to enable scrolling */}
      <div 
        ref={scrollWrapperRef} 
        style={{ height: wrapperHeight }} 
        className="w-full bg-background relative"
      >
        {/* Sticky container for the video canvas and content */}
        <div 
          ref={containerRef} 
          className="w-full h-screen sticky top-0 bg-background overflow-hidden"
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ 
              transform: 'scale(1.05)', // Hide edges during parallax and zoom
              backgroundColor: '#100c00' 
            }}
          />
          {/* Overlay content over the canvas */}
          {children && (
            <div className="relative z-10 w-full h-full pointer-events-none scrollytelling-children">
              <div className="pointer-events-auto w-full h-full">
                {children}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* GSAP Scroll To Top Utility */}
      {isLoaded && (
        <button 
          onClick={() => gsap.to(window, { scrollTo: 0, duration: 1.5, ease: 'power3.inOut' })}
          className="fixed bottom-8 right-8 z-40 bg-background border border-[#ef9f27]/30 text-on-background px-6 py-3 rounded-full transition-all pointer-events-auto shadow-2xl hover:-translate-y-2 hover:shadow-[0_0_20px_rgba(239,159,39,0.3)] hover:border-[#ef9f27]/80"
        >
          <span className="text-[10px] tracking-widest uppercase font-bold text-[#ef9f27]">Scroll to Top</span>
        </button>
      )}

      {/* Loading Overlay */}
      {!isLoaded && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background text-on-background font-body">
          <div className="mb-4 text-xs tracking-widest uppercase text-[#ef9f27] animate-pulse">
            Carregando Imersão
          </div>
          <div className="text-6xl font-light tracking-tighter text-white">
            {percentage}%
          </div>
          <div className="mt-8 w-64 h-[2px] bg-white/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#ef9f27] transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )}
    </>
  );
}
