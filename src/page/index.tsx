/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { LoginModal } from '../components/auth/LoginModal';

import { DEFAULT_DATA, OdysseiaData } from './data';

declare global {
  interface Window {
    SC: any;
  }
}

interface DJSoundCloudPlayerProps {
  url: string;
  artistId: string;
  activeAudioId: string | null;
  setActiveAudioId: (id: string) => void;
}

function DJSoundCloudPlayer({ url, artistId, activeAudioId, setActiveAudioId }: DJSoundCloudPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<any>(null);
  const [volume, setVolume] = useState(50);

  useEffect(() => {
    const initWidget = () => {
      if (iframeRef.current && window.SC && !widgetRef.current) {
        widgetRef.current = window.SC.Widget(iframeRef.current);

        widgetRef.current.bind(window.SC.Widget.Events.PLAY, () => {
          setActiveAudioId(artistId);
        });
      }
    };

    // Timeout ensures iframe has loaded SC library globally before binding
    const timeoutId = setTimeout(initWidget, 1000);

    return () => {
      clearTimeout(timeoutId);
      if (widgetRef.current) {
        try {
          widgetRef.current.unbind(window.SC.Widget.Events.PLAY);
        } catch (e) {
          console.warn("SoundCloud widget unbind failed (safe to ignore during unmount)", e);
        }
        widgetRef.current = null;
      }
    }
  }, [artistId, setActiveAudioId, url]);

  useEffect(() => {
    if (activeAudioId !== artistId && widgetRef.current) {
      try {
        widgetRef.current.pause();
      } catch (e) {
        console.warn("SoundCloud widget pause failed", e);
      }
    }
  }, [activeAudioId, artistId]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value, 10);
    setVolume(newVolume);
    if (widgetRef.current) {
      try {
        widgetRef.current.setVolume(newVolume);
      } catch (e) {
        console.warn("SoundCloud widget setVolume failed", e);
      }
    }
  };

  if (!url) {
    return (
      <div className="w-full mt-4 p-4 rounded-xl border border-white/5 bg-white/5 text-center">
        <span className="material-symbols-outlined text-primary/30 text-2xl mb-1">music_off</span>
        <p className="font-label text-[10px] text-white/30 uppercase tracking-widest">Set em breve</p>
      </div>
    );
  }

  return (
    <div className="w-full mt-4 flex flex-col gap-2">
      <div className="rounded-lg overflow-hidden border border-outline-variant/10">
        <iframe
          ref={iframeRef}
          width="100%"
          height="120"
          scrolling="no"
          frameBorder="no"
          allow="autoplay"
          src={`https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&color=%23ef9f27&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false`}
        ></iframe>
      </div>
      <div className="flex items-center gap-2 w-full px-2">
        <span className="material-symbols-outlined text-secondary/60 text-xs">volume_down</span>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={volume}
          onChange={handleVolumeChange}
          className="w-full h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
        />
        <span className="material-symbols-outlined text-secondary/60 text-xs">volume_up</span>
      </div>
    </div>
  );
}

function FloatingRadioPlayer({ activeAudioId, setActiveAudioId }: { activeAudioId: string | null, setActiveAudioId: (id: string) => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle external pauses
  useEffect(() => {
    if (activeAudioId !== 'main-radio' && activeAudioId !== null) {
      if (audioRef.current && isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [activeAudioId, isPlaying]);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().catch(e => console.error("Error playing audio", e));
        setIsPlaying(true);
        setActiveAudioId('main-radio');
      }
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-[#1a1200]/90 backdrop-blur-md p-4 rounded-xl border border-[#ef9f27]/30 shadow-[0_0_30px_rgba(239,159,39,0.2)] flex flex-col gap-3 min-w-[240px] hover:border-[#ef9f27]/60 transition-colors">
      <audio ref={audioRef} src="https://esoterica.servemp3.com:444/listen/psytrance_progressivepsytrance/radio.mp3" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#ef9f27] text-xl animate-pulse">sensors</span>
          <div className="flex flex-col">
            <span className="font-label text-xs font-bold uppercase tracking-widest text-[#ef9f27]">Esoterica Rádio</span>
            <span className="font-label text-[9px] uppercase tracking-wider text-[#ffb869]/60">{isPlaying ? 'Tocando agora' : 'Pausado'}</span>
          </div>
        </div>
        {isPlaying && (
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ef9f27] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ef9f27]"></span>
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 mt-2">
        <button
          onClick={togglePlay}
          className="h-10 w-10 shrink-0 flex items-center justify-center rounded-full bg-[#ef9f27] text-[#462a00] hover:scale-105 transition-transform"
        >
          <span className="material-symbols-outlined text-xl">
            {isPlaying ? 'pause' : 'play_arrow'}
          </span>
        </button>

        <div className="flex items-center gap-2 w-full">
          <span className="material-symbols-outlined text-[#ffb869]/60 text-sm">volume_down</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-full h-1 bg-[#281f06] rounded-lg appearance-none cursor-pointer accent-[#ef9f27]"
          />
          <span className="material-symbols-outlined text-[#ffb869]/60 text-sm">volume_up</span>
        </div>
      </div>
    </div>
  );
}

// Data constants moved to data.ts

const CountdownItem = ({ value, label }: { value: number, label: string }) => (
  <div className="flex flex-col items-center justify-center group cursor-default">
    <span
      className="block font-headline text-7xl md:text-[8rem] lg:text-[9.5rem] leading-none text-primary transition-all duration-700 ease-out group-hover:-translate-y-6 group-hover:scale-110 group-hover:text-[#ffca80]"
      style={{
        textShadow: "1px 1px 0px #b06f15, 2px 2px 0px #b06f15, 3px 3px 0px #82500c, 4px 4px 0px #82500c, 8px 8px 15px rgba(239,159,39,0.4), 15px 15px 40px rgba(0,0,0,1)"
      }}
    >
      {String(value).padStart(2, '0')}
    </span>
    <span className="font-label text-[10px] md:text-sm tracking-[0.4em] font-bold mt-6 md:mt-10 uppercase text-background bg-primary px-5 py-2 rounded-full shadow-[0_0_15px_rgba(239,159,39,0.5)] group-hover:bg-[#ffca80] group-hover:shadow-[0_0_25px_rgba(239,159,39,0.8)] transition-all duration-500">
      {label}
    </span>
  </div>
);

import Scrollytelling from '../components/common/Scrollytelling';

export default function App() {
  const [data, setData] = useState<OdysseiaData>(() => {
    const saved = localStorage.getItem('odysseia_data');
    let finalData = DEFAULT_DATA;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration: Remove 'Seekers of Light' legacy string
        if (parsed.tickets) {
          parsed.tickets = parsed.tickets.map((t: any) => ({
            ...t,
            subtitle: t.subtitle === 'Seekers of Light' ? '' : t.subtitle
          }));
        }
        finalData = parsed;
      } catch (e) {
        finalData = DEFAULT_DATA;
      }
    }
    return finalData;
  });

  const calculateTimeLeft = () => {
    const targetDate = new Date(data.general.countdownDate).getTime();
    const difference = targetDate - new Date().getTime();
    if (difference > 0) {
      return {
        months: Math.floor(difference / (1000 * 60 * 60 * 24 * 30.44)),
        days: Math.floor((difference % (1000 * 60 * 60 * 24 * 30.44)) / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
      };
    }
    return { months: 0, days: 0, hours: 0, minutes: 0 };
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isLineupModalOpen, setIsLineupModalOpen] = useState(false);
  const lineupRef = useRef<HTMLDivElement>(null);

  const scrollLineup = (direction: 'left' | 'right') => {
    if (lineupRef.current) {
      const scrollAmount = 400;
      lineupRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const [filterCity, setFilterCity] = useState('');
  const [filterState, setFilterState] = useState('');

  const filteredExcursions = data.excursions.filter(exc => exc.isActive).filter(exc => {
    return (filterCity === '' || exc.city === filterCity) &&
      (filterState === '' || exc.state === filterState);
  });

  const uniqueCities = Array.from(new Set(data.excursions.filter(e => e.isActive).map(e => e.city)));
  const uniqueStates = Array.from(new Set(data.excursions.filter(e => e.isActive).map(e => e.state)));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 10000); // Check every 10 seconds since we don't display seconds

    const handleStorage = (e: StorageEvent | CustomEvent) => {
      // If it's a native StorageEvent from another tab
      if ('key' in e && e.key === 'odysseia_data' && (e as StorageEvent).newValue) {
        setData(JSON.parse((e as StorageEvent).newValue!));
      } else {
        // If it's a manual dispatch (Event/CustomEvent) or internal update
        const currentData = localStorage.getItem('odysseia_data');
        if (currentData) {
          try {
            setData(JSON.parse(currentData));
          } catch (err) {
            console.error("Error parsing manual sync data", err);
          }
        }
      }
    };
    window.addEventListener('storage', handleStorage as any);


    return () => {
      clearInterval(timer);
      window.removeEventListener('storage', handleStorage);
    };
  }, [data.general.countdownDate]);

  const location = useLocation();

  // Removing auto-login trigger based on location state as per user request
  // useEffect(() => {
  //   if ((location.state as any)?.openLogin) {
  //     setIsLoginOpen(true);
  //   }
  // }, [location.state]);

  useEffect(() => {
    setTimeout(() => {
      if (lineupRef.current) {
        const activeDJs = data.lineup.filter(dj => dj.isConfirmed);
        if (activeDJs.length > 0) {
          const itemWidth = 332;
          lineupRef.current.scrollLeft = activeDJs.length * itemWidth;
        }
      }
    }, 500);
  }, []);

  return (
    <div
      className="text-on-background font-body selection:bg-primary-container selection:text-on-primary-container min-h-screen"
      style={{
        backgroundImage: 'url("/bg2.png")',
        backgroundAttachment: 'fixed',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '#0d0a06'
      }}
    >
      <style>{`
        /* Personalização da Barra de Rolagem */
        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        ::-webkit-scrollbar-track {
          background: #0d0a06;
        }
        ::-webkit-scrollbar-thumb {
          background: #ef9f27;
          border-radius: 5px;
          border: 2px solid #0d0a06;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #ffb869;
        }
        
        /* Firefox */
        * {
          scrollbar-width: thin;
          scrollbar-color: #ef9f27 #0d0a06;
        }
      `}</style>
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 border-b border-[#ef9f27]/30 bg-transparent dark:bg-[#1a1200]/90 backdrop-blur-md shadow-[0_4px_30px_rgba(239,159,39,0.05)]">
        <div className="flex justify-between items-center px-8 py-4 max-w-full">
          <div className="flex items-center">
            <img src="/LOGOODY.png" alt="ODYSSEIA OPEN AIR" className="h-10 md:h-12 w-auto object-contain" />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a className="text-[#ffb869]/80 font-medium hover:text-[#ef9f27] transition-colors font-label uppercase text-xs tracking-widest" href="#sobre">Sobre</a>
            <a className="text-[#ffb869]/80 font-medium hover:text-[#ef9f27] transition-colors font-label uppercase text-xs tracking-widest" href="#lineup">Line Up</a>
            <a className="text-[#ffb869]/80 font-medium hover:text-[#ef9f27] transition-colors font-label uppercase text-xs tracking-widest" href="#galeria">Galeria</a>
            <a className="text-[#ffb869]/80 font-medium hover:text-[#ef9f27] transition-colors font-label uppercase text-xs tracking-widest" href="#ingressos">Ingressos</a>
            <a className="text-[#ffb869]/80 font-medium hover:text-[#ef9f27] transition-colors font-label uppercase text-xs tracking-widest" href="#excursao">Excursão</a>
            <a className="text-[#ffb869]/80 font-medium hover:text-[#ef9f27] transition-colors font-label uppercase text-xs tracking-widest" href="#localizacao">Localização</a>
          </div>
          <a
            className="bg-primary-container text-on-primary-container px-6 py-2 rounded-lg font-label font-bold text-sm hover:scale-105 transition-transform duration-300 active:scale-95"
            href={data.tickets.find(t => t.isActive && (t.status === 'LOTE ATUAL' || t.status === 'DISPONÍVEL'))?.link || "#ingressos"}
            target={data.tickets.find(t => t.isActive && (t.status === 'LOTE ATUAL' || t.status === 'DISPONÍVEL'))?.link.startsWith('http') ? '_blank' : undefined}
          >
            Garantir Ingresso
          </a>
        </div>
      </nav>

      <Scrollytelling
        totalFrames={51}
        zoomFactor={1.35}
        wrapperHeight="350vh"
        frameUrlTemplate={(index) => `/frames/ezgif-frame-${String(index).padStart(3, '0')}.webp`}
      >
        {/* Hero Section Content over the Canvas */}
        <section id="home" className="relative w-full h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background z-10 pointer-events-none"></div>
          </div>
          <div className="relative z-20 text-center w-full px-4 max-w-5xl">
            <div className="flex flex-col items-center gap-16 scale-90 md:scale-100">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 lg:gap-20 w-full justify-center">
                <CountdownItem value={timeLeft.months} label="Meses" />
                <CountdownItem value={timeLeft.days} label="Dias" />
                <CountdownItem value={timeLeft.hours} label="Horas" />
                <CountdownItem value={timeLeft.minutes} label="Minutos" />
              </div>

              <a className="inline-flex items-center gap-4 bg-primary text-on-primary px-12 py-5 rounded-xl font-label font-bold text-lg hover:shadow-[0_0_50px_rgba(239,159,39,0.4)] transition-all group pointer-events-auto border border-primary hover:scale-105" href="#ingressos">
                GARANTIR MEU INGRESSO
                <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform">arrow_forward</span>
              </a>
            </div>
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 animate-bounce pointer-events-auto">
            <span className="material-symbols-outlined text-primary opacity-50">keyboard_double_arrow_down</span>
          </div>
        </section>
      </Scrollytelling>

      <div className="max-w-7xl mx-auto px-4 md:px-8 mb-32 -mt-4 md:-mt-8 relative z-30">
        <div className="bg-[#1a1611]/60 backdrop-blur-2xl rounded-3xl border border-white/5 shadow-[0_30px_60px_rgba(0,0,0,0.6)] overflow-hidden">

          {/* SOBRE Section */}
          <div className="p-8 md:p-16 lg:p-20" id="sobre">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">
              <div className="w-full lg:w-[55%] text-center lg:text-left">
                <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl mb-10 text-primary leading-tight drop-shadow-[0_0_20px_rgba(239,159,39,0.2)]">
                  {data.general.aboutTitle.toUpperCase()}
                </h2>
                <div className="space-y-6 text-white/80 leading-relaxed text-base md:text-lg font-light">
                  {data.general.aboutDescription.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </div>

              <div className="w-full lg:w-[40%] max-w-xl">
                <div className="relative group p-1 bg-white/5 rounded-[32px] border border-white/10 overflow-hidden shadow-2xl">
                  <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full opacity-30 group-hover:opacity-50 transition-opacity"></div>
                  <div className="relative rounded-[28px] overflow-hidden aspect-video lg:aspect-[4/5] border border-white/10">
                    {data.general.aboutMedia?.type === 'video' ? (
                      <video
                        key={data.general.aboutMedia.url}
                        className={`w-full h-full object-cover transition-all duration-1000 scale-105 group-hover:scale-100 object-${data.general.aboutMedia.position || 'center'}`}
                        src={data.general.aboutMedia.url}
                        autoPlay
                        loop
                        muted
                        playsInline
                      />
                    ) : (
                      <img
                        src={data.general.aboutMedia?.url || '/bg2.png'}
                        className={`w-full h-full object-cover transition-all duration-1000 scale-105 group-hover:scale-100 object-${data.general.aboutMedia?.position || 'center'}`}
                        alt="Odysseia"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
          {/* PARTE DO LINUP COMENTADA */}
           {/* LINE UP Section 
          <div className="p-8 md:p-16 lg:px-20 py-24 flex flex-col items-center" id="lineup">
            <div className="flex flex-col items-center text-center mb-16">
              <h2 className="font-headline text-5xl md:text-6xl text-primary mb-6 drop-shadow-[0_0_20px_rgba(239,159,39,0.2)]">LINE-UP</h2>
              <p className="font-label tracking-[0.4em] text-white/50 text-[10px] md:text-xs uppercase mb-10">Conexão Sonora com a Natureza</p>
              <button
                onClick={() => setIsLineupModalOpen(true)}
                className="font-label text-primary uppercase text-[10px] tracking-[0.2em] border border-primary/30 px-10 py-4 rounded-full hover:bg-primary/10 transition-all hover:scale-105 active:scale-95 font-bold"
              >
                Ver Todos os Confirmados
              </button>
            </div>

            {/* Carousel Container 
            <div className="w-full max-w-[1240px] mx-auto relative group/lineup">
              {/* Navigation Buttons 
              <button
                onClick={() => scrollLineup('left')}
                className="absolute -left-4 md:-left-12 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-primary/20 backdrop-blur-xl border border-primary/30 text-primary flex items-center justify-center opacity-0 group-hover/lineup:opacity-100 transition-all hover:bg-primary/40 shadow-xl"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button
                onClick={() => scrollLineup('right')}
                className="absolute -right-4 md:-right-12 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-primary/20 backdrop-blur-xl border border-primary/30 text-primary flex items-center justify-center opacity-0 group-hover/lineup:opacity-100 transition-all hover:bg-primary/40 shadow-xl"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>

              <div
                ref={lineupRef}
                onScroll={(e) => {
                  const el = e.currentTarget;
                  const activeDJs = data.lineup.filter(dj => dj.isConfirmed);
                  if (activeDJs.length === 0) return;

                  const itemWidth = 332; // 300px + 32px gap
                  const totalWidth = activeDJs.length * itemWidth;

                  // Infinite scroll stabilization
                  if (el.scrollLeft < itemWidth) {
                    el.scrollLeft += totalWidth;
                  } else if (el.scrollLeft > totalWidth * 2 - itemWidth) {
                    el.scrollLeft -= totalWidth;
                  }
                }}
                className="flex overflow-x-auto snap-x snap-mandatory gap-8 pb-12 pt-4 px-4 scrollbar-hide w-full"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {(() => {
                  const activeDJs = data.lineup.filter(dj => dj.isConfirmed);
                  if (activeDJs.length === 0) return null;

                  // Triplicamos o array para permitir rolagem infinita fluida
                  const infiniteDJs = [...activeDJs, ...activeDJs, ...activeDJs];

                  return infiniteDJs.map((artist, idx) => (
                    <div id={`dj-${artist.id}-${idx}`} key={`${artist.id}-${idx}`} className="group bg-[#0d0a06]/40 p-6 rounded-2xl hover:bg-[#0d0a06]/60 transition-all duration-500 hover:-translate-y-2 border border-white/5 flex flex-col min-w-[260px] md:min-w-[300px] w-[300px] snap-center shrink-0 relative overflow-hidden items-center text-center shadow-xl">
                      <div className="mb-5 overflow-hidden rounded-lg aspect-square w-full">
                        <img className={`w-full h-full object-cover grayscale group-hover:scale-110 group-hover:grayscale-0 transition-all duration-700 ${artist.position || 'object-center'}`} src={artist.img} alt={artist.name} referrerPolicy="no-referrer" />
                      </div>
                      <h3 className="font-headline text-3xl text-on-surface mb-1">{artist.name}</h3>
                      <p className="font-label text-primary text-[10px] md:text-xs uppercase tracking-widest mb-2">{artist.genre}</p>
                      {artist.instagramUrl && (
                        <a
                          href={artist.instagramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-white/30 hover:text-[#E1306C] transition-colors duration-300 mb-4 group/ig"
                          title={`Instagram de ${artist.name}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current drop-shadow-[0_0_4px_rgba(225,48,108,0)] group-hover/ig:drop-shadow-[0_0_6px_rgba(225,48,108,0.8)] transition-all duration-300" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                          <span className="font-label text-[9px] uppercase tracking-widest">Instagram</span>
                        </a>
                      )}
                      <div className="mt-auto w-full">
                        <DJSoundCloudPlayer url={artist.scUrl} artistId={artist.id} activeAudioId={activeAudioId} setActiveAudioId={setActiveAudioId} />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>*/}

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

          {/* GALERIA Section */}
          <div className="p-8 md:p-16 lg:p-20 py-24" id="galeria">
            <div className="text-center mb-16">
              <h2 className="font-headline text-5xl md:text-6xl text-primary mb-6 drop-shadow-[0_0_20px_rgba(239,159,39,0.2)]">GALERIA</h2>
              <p className="text-white/40 font-label tracking-[0.4em] uppercase text-[10px] md:text-xs">Fragmentos de Realidade Primordial</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {data.gallery.map((edition) => (
                <div key={edition.id} className="group relative bg-[#0d0a06]/40 rounded-2xl overflow-hidden border border-white/5 hover:-translate-y-2 flex flex-col h-full shadow-lg transition-all duration-500">
                  <div className="aspect-[4/3] w-full overflow-hidden relative">
                    <img className="w-full h-full object-cover  group-hover:scale-105 transition-all duration-700" src={edition.cover} alt={edition.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d0a06] via-transparent to-transparent opacity-60"></div>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-headline text-xl text-primary">{edition.title}</h3>
                      <span className="font-label text-secondary/60 text-[10px] tracking-widest uppercase">{edition.year}</span>
                    </div>
                    <a href={edition.googlePhotosUrl} target="_blank" rel="noopener noreferrer" className="mt-auto flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary/10 border border-primary/30 text-primary font-label text-[10px] uppercase tracking-widest hover:bg-primary/20 transition-colors">
                      <span className="material-symbols-outlined text-sm">folder_open</span>
                      Abrir Pasta
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

          {/* INGRESSOS Section */}
          <div className="p-8 md:p-16 lg:p-20 py-24" id="ingressos">
            <div className="text-center mb-20">
              <h2 className="font-headline text-5xl md:text-6xl text-primary mb-6 drop-shadow-[0_0_20px_rgba(239,159,39,0.2)]">INGRESSOS</h2>
              <p className="text-white/40 font-label tracking-[0.4em] uppercase text-[10px] md:text-xs">Portais para a sua jornada</p>
            </div>
            <div className={`flex flex-wrap justify-center gap-16 ${data.tickets.filter(tier => tier.isActive).length === 2 ? 'md:grid md:grid-cols-2' : ''}`}>
              {data.tickets.filter(tier => tier.isActive).map(tier => (
                <div key={tier.id} className={`relative p-10 bg-[#0d0a06]/40 rounded-3xl border transition-all duration-500 shadow-xl ${tier.status === 'ESGOTADO' ? 'opacity-40 grayscale' : ''} ${tier.highlighted ? 'border-primary/50 shadow-[0_0_50px_rgba(239,159,39,0.1)] scale-105 z-10' : 'border-white/5'}`}>
                  {tier.status === 'ESGOTADO' && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-outline-variant px-4 py-1 rounded text-[10px] font-bold text-on-surface-variant uppercase">ESGOTADO</div>}
                  {tier.status === 'LOTE ATUAL' && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary px-4 py-1 rounded text-[10px] font-bold text-on-primary">LOTE ATUAL</div>}
                  <h3 className="font-headline text-3xl mb-2">{tier.title}</h3>
                  <p className="font-label text-sm text-secondary mb-8">{tier.subtitle}</p>
                  <div className={`text-4xl font-headline text-primary mb-12 ${tier.status === 'ESGOTADO' ? 'line-through opacity-50' : ''}`}>
                    {tier.price}{tier.price.includes('R$') && tier.price.length > 3 && <span className="text-sm font-label opacity-60">,00</span>}{tier.subtitle.toLowerCase().includes('meia') && <span className="text-2xl font-headline text-primary mb-12"> + 1 kg de alimento </span>}
                  </div>

                  {tier.status === 'ESGOTADO' ? (
                    <button className="w-full py-4 rounded-lg bg-outline-variant text-on-surface-variant cursor-not-allowed font-label uppercase text-xs tracking-widest" disabled>Encerrado</button>
                  ) : (
                    <a href={tier.link} target="_blank" className={`block text-center w-full py-4 rounded-lg font-bold font-label uppercase text-sm tracking-widest transition-all ${tier.highlighted ? 'bg-primary text-on-primary hover:shadow-[0_0_20px_rgba(239,159,39,0.4)]' : 'border border-primary text-primary hover:bg-primary hover:text-on-primary'}`}>
                      {tier.status === 'EM BREVE' ? 'Em Breve' : 'Comprar Agora'}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

          {/* EXCURSAO Section */}
          <div className="p-8 md:p-16 lg:p-20 py-24" id="excursao">
            <div className="text-center mb-16">
              <h2 className="font-headline text-5xl md:text-6xl text-primary mb-6 drop-shadow-[0_0_20px_rgba(239,159,39,0.2)]">EXCURSÕES</h2>
              <p className="text-white/40 font-label tracking-[0.4em] uppercase text-[10px] md:text-xs">O Caminho para a Odysseia</p>
            </div>

            <div className="w-full bg-[#1a1611]/60 backdrop-blur-md p-8 rounded-2xl border border-white/5 flex flex-col md:flex-row items-end gap-6 shadow-xl mb-12">
              <label className="flex flex-col flex-1 w-full gap-2">
                <span className="text-[10px] font-label font-bold text-primary uppercase tracking-widest pl-1">Cidade</span>
                <div className="relative w-full">
                  <select value={filterCity} onChange={(e) => setFilterCity(e.target.value)} className="flex w-full appearance-none rounded-xl border border-white/10 bg-[#0d0a06]/40 text-white h-14 px-6 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-all font-body text-sm">
                    <option value="">Todas as cidades</option>
                    {uniqueCities.map(city => (<option key={city} value={city}>{city}</option>))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary/40">expand_more</span>
                </div>
              </label>
              <label className="flex flex-col flex-1 w-full gap-2">
                <span className="text-[10px] font-label font-bold text-primary uppercase tracking-widest pl-1">Estado</span>
                <div className="relative w-full">
                  <select value={filterState} onChange={(e) => setFilterState(e.target.value)} className="flex w-full appearance-none rounded-xl border border-white/10 bg-[#0d0a06]/40 text-white h-14 px-6 focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-all font-body text-sm">
                    <option value="">Todos os estados</option>
                    {uniqueStates.map(state => (<option key={state} value={state}>{state}</option>))}
                  </select>
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-primary/40">expand_more</span>
                </div>
              </label>
              <button onClick={() => { setFilterCity(''); setFilterState(''); }} className="flex min-w-[160px] w-full md:w-auto items-center justify-center gap-2 rounded-xl h-14 px-8 bg-primary text-on-primary font-label font-bold hover:shadow-[0_0_30px_rgba(239,159,39,0.3)] transition-all active:scale-95 text-xs uppercase tracking-widest">
                <span className="material-symbols-outlined text-sm">{filterCity || filterState ? 'close' : 'search'}</span>
                <span>{filterCity || filterState ? 'Limpar Filtro' : 'Buscar Rota'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredExcursions.length > 0 ? filteredExcursions.map(excursion => (
                <div key={excursion.id} className="bg-[#1a1611]/80 backdrop-blur-xl rounded-3xl p-8 flex flex-col gap-6 border border-white/5 hover:border-primary/40 transition-all duration-500 group shadow-2xl">
                  <div className="flex flex-col gap-1">
                    <h4 className="font-headline text-xl md:text-2xl text-on-surface leading-tight">{excursion.city}</h4>
                    <p className="text-sm text-secondary font-label">{excursion.city} ({excursion.state})</p>
                  </div>
                  <div className="flex flex-col gap-3 py-4 border-y border-outline-variant/10">
                    <div className="flex items-center gap-3 text-on-surface-variant"><span className="material-symbols-outlined text-primary/70 text-[20px]">schedule</span><span className="text-sm font-light">{excursion.departureTime}</span></div>
                    <div className="flex items-center gap-3 text-on-surface-variant"><span className="material-symbols-outlined text-primary/70 text-[20px]">location_on</span><span className="text-sm font-light">{excursion.location}</span></div>
                    <div className="flex items-center gap-3 text-on-surface-variant"><span className="material-symbols-outlined text-primary/70 text-[20px]">payments</span><span className="text-sm font-bold text-primary">{excursion.price}</span></div>
                  </div>
                  <a href={`https://wa.me/${excursion.whatsappNumber}?text=${encodeURIComponent(`Olá! Gostaria de saber mais sobre a excursão saindo de ${excursion.city} para o Odysseia Open Air.`)}`} target="_blank" className="mt-auto flex w-full items-center justify-center gap-2 rounded-lg h-12 px-4 bg-surface-container border border-primary/30 text-primary font-label font-bold hover:bg-primary hover:text-on-primary transition-all">
                    <span className="material-symbols-outlined text-[20px]">forum</span><span>WhatsApp</span>
                  </a>
                </div>
              )) : (
                <div className="col-span-full py-12 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-4xl mb-2 opacity-50">directions_bus</span>
                  <p>Nenhuma excursão encontrada.</p>
                </div>
              )}
            </div>
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

          {/* LOCALIZACAO Section */}
          <div className="p-8 md:p-16 lg:px-20 py-24" id="localizacao">
            <div className="text-center mb-16">
              <h2 className="font-headline text-5xl md:text-6xl text-primary mb-6 drop-shadow-[0_0_20px_rgba(239,159,39,0.2)]">LOCALIZAÇÃO</h2>
              <p className="text-white/40 font-label tracking-[0.4em] uppercase text-[10px] md:text-xs">Fazenda Vilas Boas • Cruz das Almas - BA</p>
            </div>

            <div className="h-[350px] md:h-[400px] w-full relative group rounded-3xl overflow-hidden border border-white/5 group shadow-2xl">
              <iframe
                src="https://maps.google.com/maps?q=-12.6456155,-39.1739132&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="grayscale group-hover:grayscale-0 transition-all duration-1000"
              ></iframe>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"></div>
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 bg-[#0d0a06]/90 backdrop-blur-xl p-8 rounded-2xl border border-primary/30 w-[90%] max-w-sm text-center shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <h4 className="font-headline text-2xl text-primary mb-2">Fazenda Vilas Boas</h4>
                <p className="text-sm text-white/50 font-light mb-8 italic">O santuário onde a frequência primordial será emanada.</p>
                <a href="https://maps.app.goo.gl/n3K4aNMoVNqd2vKH7" target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-center gap-3 rounded-xl h-14 px-8 bg-primary text-on-primary font-label font-bold hover:scale-105 transition-transform active:scale-95 shadow-[0_10px_20px_rgba(239,159,39,0.3)]">
                  <span className="material-symbols-outlined">directions</span>
                  <span>Traçar Rota</span>
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>


      {/* Modals & Overlays */}
      {isLineupModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-background/95 transition-opacity" onClick={() => setIsLineupModalOpen(false)}></div>
          <div className="relative bg-[#1a1611] border border-white/10 rounded-2xl w-full max-w-5xl max-h-[85vh] overflow-hidden flex flex-col z-10 transform transition-all shadow-[0_0_100px_rgba(0,0,0,0.8)]">
            <div className="px-8 py-6 border-b border-white/5 flex justify-between items-center bg-[#0d0a06]/80 sticky top-0 z-20">
              <h3 className="text-3xl font-headline text-primary" id="modal-title">DJS CONFIRMADOS</h3>
              <button onClick={() => setIsLineupModalOpen(false)} className="text-white/40 hover:text-primary transition-all p-2 rounded-full hover:bg-primary/10">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-8 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.lineup.filter(dj => dj.isConfirmed).map(artist => (
                  <div key={artist.id} className="bg-[#0d0a06]/40 p-6 rounded-2xl border border-white/5 flex flex-col">
                    <div className="mb-4 overflow-hidden rounded-lg aspect-square">
                      <img className={`w-full h-full object-cover grayscale transition-all duration-500 ${artist.position || 'object-center'}`} src={artist.img} alt={artist.name} referrerPolicy="no-referrer" />
                    </div>
                    <h3 className="font-headline text-2xl text-on-surface mb-1">{artist.name}</h3>
                    <p className="font-label text-primary text-[10px] uppercase tracking-widest mb-2">{artist.genre}</p>
                    {artist.instagramUrl && (
                      <a
                        href={artist.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-white/30 hover:text-[#E1306C] transition-colors duration-300 mt-1 group/ig"
                        title={`Instagram de ${artist.name}`}
                      >
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current drop-shadow-[0_0_4px_rgba(225,48,108,0)] group-hover/ig:drop-shadow-[0_0_6px_rgba(225,48,108,0.8)] transition-all duration-300" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                        <span className="font-label text-[9px] uppercase tracking-widest">Instagram</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-[#1a1200]/90 border-t border-[#ef9f27]/10">
        <div className="w-full py-16 px-8 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center">
              <img src="/LOGOODY.png" alt="ODYSSEIA" className="h-12 w-auto object-contain" />
            </div>
            <p className="font-label text-xs text-[#ffb869]/60 max-w-xs text-center md:text-left">A celebração mística que une a natureza e o som primordial em uma experiência de imersão total.</p>
          </div>
        
        
          <div className="flex flex-col items-center md:items-end gap-2">
            <div className="flex gap-6 mb-4">
              <a className="text-xs font-label uppercase tracking-widest text-[#ffb869]/60 hover:text-[#ef9f27] transition-colors" href="https://www.instagram.com/odysseiaopenair/">Instagram</a>
              <a className="text-xs font-label uppercase tracking-widest text-[#ffb869]/60 hover:text-[#ef9f27] transition-colors" href="https://wa.me/5575991279385">Contato</a>
              
            </div>
            <p className="text-[10px] font-label text-[#ffb869]/40">© 2026 Odysseia Open Air. Powered by <span className="text-primary font-bold">ODY Ticket</span>.</p>
          </div>
        </div>
      </footer>
      <FloatingRadioPlayer activeAudioId={activeAudioId} setActiveAudioId={setActiveAudioId} />
    </div>
  );
}
