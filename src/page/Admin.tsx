import { useState, useEffect, useCallback, useRef } from 'react';
import Cropper, { Point, Area } from 'react-easy-crop';
import { DEFAULT_DATA, OdysseiaData, DJ, Excursion, GalleryEdition } from './data';

// --- CROP HELPERS ---
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); // needed to avoid cross-origin issues on CodeSandbox
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return '';
  }

  const maxSize = Math.max(image.width, image.height);
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

  // set each dimensions to double largest dimension to allow for a safe area for the
  // image to rotate in without being clipped by canvas boundaries
  canvas.width = safeArea;
  canvas.height = safeArea;

  // translate canvas context to a central location on image to allow rotating around the center.
  ctx.translate(safeArea / 2, safeArea / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-safeArea / 2, -safeArea / 2);

  // draw rotated image and store data.
  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  );
  const data = ctx.getImageData(0, 0, safeArea, safeArea);

  // set canvas width to final desired crop size - this will clear existing context
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // paste generated rotate image with correct offsets for x,y crop values.
  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  );

  // As Base64 string
  return canvas.toDataURL('image/jpeg', 0.8);
}

// --- MODAL COMPONENT ---
function ImageCropModal({ 
  image, 
  onSave, 
  onCancel, 
  aspect = 1 
}: { 
  image: string; 
  onSave: (croppedImage: string) => void; 
  onCancel: () => void;
  aspect?: number;
}) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (croppedAreaPixels) {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      onSave(croppedImage);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-[#1a1611] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col h-[80vh]">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-xl font-headline text-primary">Recortar Imagem</h3>
          <button onClick={onCancel} className="text-white/40 hover:text-white transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div className="relative flex-1 bg-black/20">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        <div className="p-6 bg-black/40 border-t border-white/5 space-y-6">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-white/40">zoom_in</span>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-primary"
            />
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={onCancel}
              className="flex-1 py-3 rounded-xl border border-white/10 text-white font-label text-sm uppercase tracking-widest hover:bg-white/5 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              className="flex-1 py-3 rounded-xl bg-primary text-black font-label font-bold text-sm uppercase tracking-widest hover:shadow-[0_0_20px_rgba(239,159,39,0.4)] transition-all"
            >
              Salvar Recorte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const [data, setData] = useState<OdysseiaData>(() => {
    const saved = localStorage.getItem('odysseia_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migração simples para novos campos
        if (!parsed.general.aboutMedia) {
          parsed.general.aboutMedia = DEFAULT_DATA.general.aboutMedia;
        }
        
        // Migration: Remove 'Seekers of Light' legacy string
        if (parsed.tickets) {
          parsed.tickets = parsed.tickets.map((t: any) => ({
            ...t,
            subtitle: t.subtitle === 'Seekers of Light' ? '' : t.subtitle
          }));
        }
        
        return parsed;
      } catch (e) {
        return DEFAULT_DATA;
      }
    }
    return DEFAULT_DATA;
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'lineup' | 'gallery' | 'excursions' | 'tickets'>('general');
  const [cropTarget, setCropTarget] = useState<{ type: 'dj' | 'about', id?: string, image: string, aspect?: number } | null>(null);

  // Track changes to show floating button
  useEffect(() => {
    setHasChanges(true);
  }, [data]);

  const handleSync = () => {
    try {
      localStorage.setItem('odysseia_data', JSON.stringify(data));
      window.dispatchEvent(new Event('storage'));
      setHasChanges(false);
      alert('Alterações publicadas com sucesso! Verifique a landing page.');
    } catch (e) {
      console.error('Erro ao salvar no localStorage:', e);
      if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        alert('Limite de armazenamento excedido! As fotos são muito grandes. Tente usar imagens menores.');
      }
    }
  };

  // Auto-save to localStorage (syncing state with local storage for session persistence)
  useEffect(() => {
    localStorage.setItem('odysseia_data', JSON.stringify(data));
  }, [data]);

  const handleSavePermanently = () => {
    const dataStr = `import { OdysseiaData } from './data';\n\nexport const DEFAULT_DATA: OdysseiaData = ${JSON.stringify(data, null, 2)};`;
    const blob = new Blob([dataStr], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.ts';
    a.click();
    alert('Arquivo data.ts gerado. Substitua o arquivo src/pages/OdysseiLanding/data.ts para salvar permanentemente.');
  };

  const updateGeneral = (field: keyof OdysseiaData['general'], value: any) => {
    setData(prev => ({
      ...prev,
      general: { ...prev.general, [field]: value }
    }));
  };

  const compressImage = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = dataUrl;
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        callback(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropSave = (croppedImage: string) => {
    if (!cropTarget) return;

    if (cropTarget.type === 'dj') {
      const nl = [...data.lineup];
      const index = nl.findIndex(d => d.id === cropTarget.id);
      if (index !== -1) {
        nl[index].img = croppedImage;
        setData(p => ({ ...p, lineup: nl }));
      }
    } else if (cropTarget.type === 'about') {
      setData(p => ({
        ...p,
        general: {
          ...p.general,
          aboutMedia: {
            ...p.general.aboutMedia,
            type: 'image',
            url: croppedImage
          }
        }
      }));
    }
    setCropTarget(null);
  };

  return (
    <div className="min-h-screen bg-[#0d0a06] text-white font-body p-8 selection:bg-primary selection:text-background">
      {cropTarget && (
        <ImageCropModal
          image={cropTarget.image}
          aspect={cropTarget.aspect}
          onSave={handleCropSave}
          onCancel={() => setCropTarget(null)}
        />
      )}
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-center mb-12 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-background font-bold text-2xl">
                <span className="material-symbols-outlined">auto_fix_high</span>
              </div>
              <h1 className="font-headline text-4xl text-primary">ODYSSEIA ADMIN</h1>
            </div>
            <p className="text-secondary/60 uppercase tracking-[0.4em] text-[10px] font-bold">Gerenciador de Conteúdo Principal</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => window.open('/odysseia', '_blank')}
              className="px-8 py-3 rounded-xl border border-primary/20 text-primary hover:bg-primary/5 transition-all font-label text-xs uppercase tracking-widest flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">visibility</span> Ver Site
            </button>
            <button 
              onClick={handleSavePermanently}
              className="px-8 py-3 rounded-xl bg-primary text-on-primary font-label font-bold text-xs uppercase tracking-widest flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">save</span> Exportar
            </button>
          </div>
        </header>

        <nav className="flex gap-4 mb-10 overflow-x-auto pb-4 scrollbar-hide border-b border-white/5">
          {(['general', 'lineup', 'gallery', 'excursions', 'tickets'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setHasChanges(false); }}
              className={`px-8 py-4 rounded-t-2xl font-label text-xs uppercase tracking-widest transition-all whitespace-nowrap ${
                activeTab === tab ? 'bg-[#1a1611] text-primary border-b-2 border-primary' : 'text-secondary/40 hover:text-white/60'
              }`}
            >
              {tab === 'general' ? 'Geral' : tab === 'lineup' ? 'Line-up' : tab === 'gallery' ? 'Galeria' : tab === 'excursions' ? 'Excursões' : 'Ingressos'}
            </button>
          ))}
        </nav>

        <main className="bg-[#1a1611]/60 backdrop-blur-2xl rounded-3xl border border-white/5 p-8 md:p-12 shadow-2xl relative">
          
          {activeTab === 'general' && (
            <div className="space-y-10">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-primary text-3xl">settings</span>
                <h2 className="text-3xl font-headline text-primary">Informações Gerais</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-label text-secondary/60 uppercase tracking-widest">Título do Evento</label>
                  <input type="text" value={data.general.eventTitle} onChange={e => updateGeneral('eventTitle', e.target.value)} className="bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary transition-all" />
                </div>
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-label text-secondary/60 uppercase tracking-widest">Data do Countdown</label>
                  <input type="datetime-local" value={data.general.countdownDate.slice(0, 16)} onChange={e => updateGeneral('countdownDate', new Date(e.target.value).toISOString())} className="bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary transition-all" />
                </div>
                <div className="flex flex-col gap-3 md:col-span-2">
                  <label className="text-xs font-label text-secondary/60 uppercase tracking-widest">Título Seção Sobre</label>
                  <input type="text" value={data.general.aboutTitle} onChange={e => updateGeneral('aboutTitle', e.target.value)} className="bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary font-headline text-xl" />
                </div>
                <div className="flex flex-col gap-4 md:col-span-2">
                  <label className="text-xs font-label text-secondary/60 uppercase tracking-widest">Descrição (Parágrafos)</label>
                  {data.general.aboutDescription.map((p, i) => (
                    <div key={i} className="relative group">
                      <textarea value={p} onChange={e => {
                        const newAbout = [...data.general.aboutDescription];
                        newAbout[i] = e.target.value;
                        updateGeneral('aboutDescription', newAbout);
                      }} rows={2} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary text-sm" />
                      <button onClick={() => updateGeneral('aboutDescription', data.general.aboutDescription.filter((_, idx) => idx !== i))} className="absolute -right-2 -top-2 bg-error text-white h-6 w-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-xs">close</span>
                      </button>
                    </div>
                  ))}
                  <button onClick={() => updateGeneral('aboutDescription', [...data.general.aboutDescription, 'Novo parágrafo...'])} className="text-primary text-xs font-label uppercase tracking-widest hover:underline">+ Adicionar Parágrafo</button>
                </div>
              </div>
              <div className="flex items-center gap-4 pt-4 border-t border-white/5">
                <span className="material-symbols-outlined text-primary text-3xl">perm_media</span>
                <h2 className="text-3xl font-headline text-primary">Mídia Seção Sobre</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-label text-secondary/60 uppercase tracking-widest">Tipo de Mídia</label>
                  <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 w-fit">
                    <button 
                      onClick={() => updateGeneral('aboutMedia', { ...data.general.aboutMedia, type: 'video' })}
                      className={`px-6 py-2 rounded-lg font-label text-xs uppercase transition-all ${data.general.aboutMedia.type === 'video' ? 'bg-primary text-black font-bold' : 'text-white/40 hover:text-white'}`}
                    >
                      Vídeo
                    </button>
                    <button 
                      onClick={() => updateGeneral('aboutMedia', { ...data.general.aboutMedia, type: 'image' })}
                      className={`px-6 py-2 rounded-lg font-label text-xs uppercase transition-all ${data.general.aboutMedia.type === 'image' ? 'bg-primary text-black font-bold' : 'text-white/40 hover:text-white'}`}
                    >
                      Imagem
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  <label className="text-xs font-label text-secondary/60 uppercase tracking-widest">Posicionamento (Centralizar)</label>
                  <select 
                    value={data.general.aboutMedia.position} 
                    onChange={e => updateGeneral('aboutMedia', { ...data.general.aboutMedia, position: e.target.value })}
                    className="bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary transition-all appearance-none cursor-pointer"
                  >
                    <option value="center">Centro (Padrão)</option>
                    <option value="top">Topo</option>
                    <option value="bottom">Base</option>
                    <option value="left">Esquerda</option>
                    <option value="right">Direita</option>
                  </select>
                </div>

                {data.general.aboutMedia.type === 'video' ? (
                  <div className="flex flex-col gap-3 md:col-span-2">
                    <label className="text-xs font-label text-secondary/60 uppercase tracking-widest">URL do Vídeo (YouTube, Direct link, etc.)</label>
                    <input 
                      type="text" 
                      value={data.general.aboutMedia.url} 
                      onChange={e => updateGeneral('aboutMedia', { ...data.general.aboutMedia, url: e.target.value })} 
                      className="bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary transition-all" 
                      placeholder="Ex: /video.mp4"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-6 md:col-span-2">
                    <div className="flex items-center gap-6">
                      <div className="w-48 aspect-video rounded-2xl overflow-hidden bg-black/40 border border-white/10 relative group shrink-0">
                        <img src={data.general.aboutMedia.url} className={`w-full h-full object-cover object-${data.general.aboutMedia.position}`} />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity">
                          <label className="cursor-pointer hover:text-primary transition-colors flex flex-col items-center gap-1">
                            <span className="material-symbols-outlined">upload_file</span>
                            <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, url => setCropTarget({ type: 'about', image: url, aspect: 16/9 }))} />
                          </label>
                          <button onClick={() => setCropTarget({ type: 'about', image: data.general.aboutMedia.url, aspect: 16/9 })} className="hover:text-primary transition-colors">
                            <span className="material-symbols-outlined">crop</span>
                          </button>
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="text-xs font-label text-secondary/60 uppercase tracking-widest block mb-2">URL da Imagem</label>
                        <input 
                          type="text" 
                          value={data.general.aboutMedia.url} 
                          onChange={e => updateGeneral('aboutMedia', { ...data.general.aboutMedia, url: e.target.value })} 
                          className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-primary transition-all text-sm font-label" 
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'lineup' && (
            <div className="space-y-10">
              <div className="flex justify-between items-center bg-[#1a1611] p-4 rounded-2xl border border-white/5 sticky top-0 z-20">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-primary text-3xl">unfold_more_double</span>
                  <h2 className="text-3xl font-headline text-primary">Line-up</h2>
                </div>
                <button 
                  onClick={() => {
                    const newDJ: DJ = { 
                      id: `dj-${Date.now()}`, 
                      name: 'Novo Artista', 
                      genre: 'Gênero musical', 
                      time: '', 
                      img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD_YsmN-ebI7Bc97Tg60-n1pNlVhCnkUClLw7dXd7-1f1v8H7SGSv5-TFD0PbTFckj0h52-wsdCNUsM6c77-RiynKt_RJsoG93SS07-AfjiNiDC3d5UANgF-A24hn09KxnUva8oUoqz0o8e5hVdNFswcjOtutMBPJRV38GkWUvFeMwH8X42LfWDCtg-JSygzsai2uP6EK3unq225Fx9FsQHFQ1dWLeXrI1Ir2iEh9gOuK8jFPFawxmnMkgNgz-0-t6Zk3gkjnMgCvlZ', 
                      isConfirmed: true, 
                      scUrl: '',
                      instagramUrl: ''
                    };
                    setData(prev => ({ ...prev, lineup: [newDJ, ...prev.lineup] }));
                  }}
                  className="px-8 py-3 rounded-xl bg-primary text-on-primary font-label font-bold text-xs uppercase tracking-widest flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">add</span> Adicionar Artista
                </button>
              </div>
              <div className="grid grid-cols-1 gap-8">
                {data.lineup.map((dj, index) => (
                  <div key={dj.id} className="bg-black/40 border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row gap-8 items-center">
                    <div className="w-32 h-32 rounded-2xl overflow-hidden relative group shrink-0 shadow-xl border border-white/5">
                      <img src={dj.img} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-opacity">
                        <label className="cursor-pointer hover:text-primary transition-colors flex flex-col items-center gap-1">
                          <span className="material-symbols-outlined text-2xl">upload_file</span>
                          <span className="text-[10px] uppercase font-bold">Trocar</span>
                          <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, url => {
                            setCropTarget({ type: 'dj', id: dj.id, image: url, aspect: 1 });
                          })} />
                        </label>
                        <button 
                          onClick={() => setCropTarget({ type: 'dj', id: dj.id, image: dj.img, aspect: 1 })}
                          className="hover:text-primary transition-colors flex flex-col items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-2xl">crop</span>
                          <span className="text-[10px] uppercase font-bold">Recortar</span>
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-secondary/60 uppercase">Nome</label>
                        <input type="text" value={dj.name} onChange={e => { const nl = [...data.lineup]; nl[index].name = e.target.value; setData(p => ({ ...p, lineup: nl })); }} className="bg-transparent border-b border-white/10 p-1 text-xl font-headline focus:border-primary outline-none transition-all" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] text-secondary/60 uppercase">Gênero</label>
                        <input type="text" value={dj.genre} onChange={e => { const nl = [...data.lineup]; nl[index].genre = e.target.value; setData(p => ({ ...p, lineup: nl })); }} className="bg-transparent border-b border-white/10 p-1 text-sm text-primary uppercase focus:border-primary outline-none transition-all" />
                      </div>
                      <div className="flex flex-col gap-1 md:col-span-2">
                        <label className="text-[10px] text-secondary/60 uppercase">SoundCloud URL / Link MixCloud</label>
                        <input type="text" value={dj.scUrl} onChange={e => { const nl = [...data.lineup]; nl[index].scUrl = e.target.value; setData(p => ({ ...p, lineup: nl })); }} className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:border-primary outline-none transition-all" />
                      </div>
                      <div className="flex flex-col gap-1 md:col-span-2">
                        <label className="text-[10px] text-secondary/60 uppercase flex items-center gap-1">
                          <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                          Instagram URL
                        </label>
                        <input type="text" value={dj.instagramUrl || ''} onChange={e => { const nl = [...data.lineup]; nl[index].instagramUrl = e.target.value; setData(p => ({ ...p, lineup: nl })); }} className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs focus:border-primary outline-none transition-all" placeholder="https://www.instagram.com/username/" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={() => {
                          const nl = [...data.lineup];
                          nl[index].isConfirmed = !nl[index].isConfirmed;
                          setData(p => ({ ...p, lineup: nl }));
                        }} 
                        className={`h-10 w-10 flex items-center justify-center rounded-xl border transition-all ${
                          dj.isConfirmed 
                            ? 'bg-success/20 text-success border-success/40' 
                            : 'bg-white/5 text-white/40 border-white/10'
                        }`}
                        title={dj.isConfirmed ? "Artista Confirmado (Visível)" : "Artista Não Confirmado (Oculto)"}
                      >
                        <span className="material-symbols-outlined">{dj.isConfirmed ? 'check_circle' : 'pending'}</span>
                      </button>
                      <button onClick={handleSync} className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all"><span className="material-symbols-outlined">publish</span></button>
                      <button onClick={() => { if(confirm(`Excluir ${dj.name}?`)) { setData(p => ({ ...p, lineup: p.lineup.filter((_, i) => i !== index) })); } }} className="h-10 w-10 flex items-center justify-center rounded-xl bg-error/20 text-error border border-error/40 hover:bg-error/30 transition-all"><span className="material-symbols-outlined">delete</span></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'gallery' && (
            <div className="space-y-10">
              <div className="flex justify-between items-center bg-[#1a1611] p-4 rounded-2xl border border-white/5 sticky top-0 z-20">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-primary text-3xl">photo_library</span>
                  <h2 className="text-3xl font-headline text-primary">Galeria</h2>
                </div>
                <button 
                  onClick={() => {
                    const ne: GalleryEdition = { id: `ed-${Date.now()}`, title: 'Nova Edição', year: '202X', cover: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD_YsmN-ebI7Bc97Tg60-n1pNlVhCnkUClLw7dXd7-1f1v8H7SGSv5-TFD0PbTFckj0h52-wsdCNUsM6c77-RiynKt_RJsoG93SS07-AfjiNiDC3d5UANgF-A24hn09KxnUva8oUoqz0o8e5hVdNFswcjOtutMBPJRV38GkWUvFeMwH8X42LfWDCtg-JSygzsai2uP6EK3unq225Fx9FsQHFQ1dWLeXrI1Ir2iEh9gOuK8jFPFawxmnMkgNgz-0-t6Zk3gkjnMgCvlZ', photos: [] };
                    setData(prev => ({ ...prev, gallery: [ne, ...prev.gallery] }));
                  }}
                  className="px-8 py-3 rounded-xl bg-primary text-on-primary font-label font-bold text-xs uppercase tracking-widest"
                >
                  Criar Pasta
                </button>
              </div>
              <div className="grid grid-cols-1 gap-12">
                {data.gallery.map((ed, edIdx) => (
                  <div key={ed.id} className="bg-black/40 border border-white/5 rounded-3xl p-8 space-y-6">
                    <div className="flex flex-col md:flex-row gap-8 items-center">
                      <div className="w-40 h-32 rounded-2xl overflow-hidden relative group shrink-0">
                        <img src={ed.cover} className="w-full h-full object-cover" />
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                          <span className="material-symbols-outlined text-white">add_photo_alternate</span>
                          <input type="file" className="hidden" onChange={e => handleFileUpload(e, url => {
                            const ng = [...data.gallery]; ng[edIdx].cover = url; setData(p => ({ ...p, gallery: ng }));
                          })} />
                        </label>
                      </div>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" value={ed.title} onChange={e => { const ng = [...data.gallery]; ng[edIdx].title = e.target.value; setData(p => ({ ...p, gallery: ng })); }} className="bg-transparent border-b border-white/10 p-1 text-xl font-headline" placeholder="Título" />
                        <input type="text" value={ed.year} onChange={e => { const ng = [...data.gallery]; ng[edIdx].year = e.target.value; setData(p => ({ ...p, gallery: ng })); }} className="bg-transparent border-b border-white/10 p-1 text-sm text-secondary" placeholder="Ano" />
                      </div>
                      <div className="flex gap-2">
                        <label className="bg-white/10 px-4 py-2 rounded-xl text-[10px] uppercase font-bold cursor-pointer hover:bg-white/20">
                          + Fotos
                          <input type="file" className="hidden" multiple onChange={e => {
                            const files = Array.from(e.target.files || []);
                            Promise.all(files.map(f => {
                              return new Promise<string>(r => {
                                const reader = new FileReader();
                                reader.onloadend = async () => r(await compressImage(reader.result as string));
                                reader.readAsDataURL(f);
                              });
                            })).then(urls => {
                              const ng = [...data.gallery]; ng[edIdx].photos = [...ng[edIdx].photos, ...urls]; setData(p => ({ ...p, gallery: ng }));
                            });
                          }} />
                        </label>
                        <button onClick={handleSync} className="h-10 w-10 flex items-center justify-center rounded-xl bg-success/20 text-success border border-success/40"><span className="material-symbols-outlined">publish</span></button>
                        <button onClick={() => { if(confirm(`Excluir pasta ${ed.title}?`)) { setData(p => ({ ...p, gallery: p.gallery.filter((_, i) => i !== edIdx) })); } }} className="h-10 w-10 flex items-center justify-center rounded-xl bg-error/20 text-error border border-error/40"><span className="material-symbols-outlined">delete</span></button>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                      {ed.photos.map((ph, pi) => (
                        <div key={pi} className="aspect-square rounded-lg relative group overflow-hidden border border-white/5">
                          <img src={ph} className="w-full h-full object-cover" />
                          <button onClick={() => {
                            const ng = [...data.gallery]; ng[edIdx].photos = ng[edIdx].photos.filter((_, i) => i !== pi); setData(p => ({ ...p, gallery: ng }));
                          }} className="absolute inset-0 bg-error/60 opacity-0 group-hover:opacity-100 flex items-center justify-center"><span className="material-symbols-outlined text-white">close</span></button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'excursions' && (
            <div className="space-y-10">
              <div className="flex justify-between items-center bg-[#1a1611] p-4 rounded-2xl border border-white/5 sticky top-0 z-20">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-primary text-3xl">map</span>
                  <h2 className="text-3xl font-headline text-primary">Excursões</h2>
                </div>
                <button 
                  onClick={() => {
                    const ne: Excursion = { id: `ex-${Date.now()}`, city: 'Nova Cidade', state: 'XX', status: 'DISPONÍVEL', departureTime: '00:00 (Sáb)', location: 'Ponto X', price: 'R$ 00', whatsappNumber: '55...', isActive: true };
                    setData(prev => ({ ...prev, excursions: [ne, ...prev.excursions] }));
                  }}
                  className="px-8 py-3 rounded-xl bg-primary text-on-primary font-label font-bold text-xs uppercase tracking-widest"
                >
                  Nova Rota
                </button>
              </div>
              <div className="space-y-4">
                {data.excursions.map((ex, index) => (
                    <div key={ex.id} className="bg-black/40 border border-white/5 rounded-2xl p-6 grid grid-cols-1 md:grid-cols-6 gap-6 items-center">
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase text-secondary/60">Destino</label>
                        <input type="text" value={ex.city} onChange={e => { const ne = [...data.excursions]; ne[index].city = e.target.value; setData(p => ({ ...p, excursions: ne })); }} className="bg-transparent border-b border-white/10 p-1 font-headline" />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase text-secondary/60">Estado</label>
                        <input type="text" value={ex.state} onChange={e => { const ne = [...data.excursions]; ne[index].state = e.target.value; setData(p => ({ ...p, excursions: ne })); }} className="bg-transparent border-b border-white/10 p-1 text-primary font-bold uppercase" placeholder="UF" />
                      </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase text-secondary/60">Logística</label>
                      <input type="text" value={ex.departureTime} onChange={e => { const ne = [...data.excursions]; ne[index].departureTime = e.target.value; setData(p => ({ ...p, excursions: ne })); }} className="bg-transparent border-b border-white/10 p-1 text-xs" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase text-secondary/60">Investimento</label>
                      <input type="text" value={ex.price} onChange={e => { const ne = [...data.excursions]; ne[index].price = e.target.value; setData(p => ({ ...p, excursions: ne })); }} className="bg-transparent border-b border-white/10 p-1 text-primary font-bold" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase text-secondary/60">WhatsApp</label>
                      <input type="text" value={ex.whatsappNumber} onChange={e => { const ne = [...data.excursions]; ne[index].whatsappNumber = e.target.value; setData(p => ({ ...p, excursions: ne })); }} className="bg-transparent border-b border-white/10 p-1 text-xs" placeholder="55..." />
                    </div>
                    <div className="flex gap-2">
                       <button 
                         onClick={() => {
                           const ne = [...data.excursions];
                           ne[index].isActive = !ne[index].isActive;
                           setData(p => ({ ...p, excursions: ne }));
                         }} 
                         className={`h-10 w-10 flex items-center justify-center rounded-xl border transition-all ${
                           ex.isActive 
                             ? 'bg-success/20 text-success border-success/40' 
                             : 'bg-white/5 text-white/40 border-white/10'
                         }`}
                         title={ex.isActive ? "Rota Ativa (Visível)" : "Rota Inativa (Oculta)"}
                       >
                         <span className="material-symbols-outlined">{ex.isActive ? 'check_circle' : 'pending'}</span>
                       </button>
                       <button onClick={handleSync} className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all"><span className="material-symbols-outlined">publish</span></button>
                       <button onClick={() => { if(confirm(`Remover rota ${ex.city}?`)) { setData(p => ({ ...p, excursions: p.excursions.filter((_, i) => i !== index) })); } }} className="h-10 w-10 flex items-center justify-center rounded-xl bg-error/20 text-error border border-error/40 hover:bg-error/30 transition-all"><span className="material-symbols-outlined">delete</span></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="space-y-10">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-primary text-3xl">local_activity</span>
                <h2 className="text-3xl font-headline text-primary">Ingressos</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {data.tickets.map((tk, index) => (
                  <div key={tk.id} className={`bg-black/40 border rounded-3xl p-8 space-y-6 ${tk.highlighted ? 'border-primary shadow-lg shadow-primary/20' : 'border-white/5'}`}>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase text-secondary/60">Título</label>
                      <input type="text" value={tk.title} onChange={e => { const nt = [...data.tickets]; nt[index].title = e.target.value; setData(p => ({ ...p, tickets: nt })); }} className="bg-transparent border-b border-white/10 p-1 text-xl font-headline text-primary" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase text-secondary/60">Preço</label>
                      <input type="text" value={tk.price} onChange={e => { const nt = [...data.tickets]; nt[index].price = e.target.value; setData(p => ({ ...p, tickets: nt })); }} className="bg-transparent border-b border-white/10 p-1 text-2xl font-bold" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase text-secondary/60">Link Compra</label>
                      <input type="text" value={tk.link} onChange={e => { const nt = [...data.tickets]; nt[index].link = e.target.value; setData(p => ({ ...p, tickets: nt })); }} className="bg-white/5 border border-white/10 rounded p-2 text-[10px] whitespace-nowrap overflow-hidden" placeholder="https://..." />
                    </div>
                    <div className="flex items-center gap-3">
                       <input type="checkbox" checked={tk.highlighted} onChange={e => {
                         const nt = data.tickets.map((t, i) => ({ ...t, highlighted: i === index ? e.target.checked : false }));
                         setData(p => ({ ...p, tickets: nt }));
                       }} />
                       <span className="text-[10px] uppercase tracking-widest text-secondary">Destaque</span>
                    </div>
                    <div className="flex gap-2">
                       <button 
                         onClick={() => {
                           const nt = [...data.tickets];
                           nt[index].isActive = !nt[index].isActive;
                           setData(p => ({ ...p, tickets: nt }));
                         }} 
                         className={`h-12 w-12 flex items-center justify-center rounded-xl border transition-all ${
                           tk.isActive 
                             ? 'bg-success/20 text-success border-success/40' 
                             : 'bg-white/5 text-white/40 border-white/10'
                         }`}
                         title={tk.isActive ? "Ingresso Ativo (Visível)" : "Ingresso Inativo (Oculto)"}
                       >
                         <span className="material-symbols-outlined">{tk.isActive ? 'check_circle' : 'pending'}</span>
                       </button>
                       <button onClick={handleSync} className="flex-1 bg-primary/10 text-primary border border-primary/20 py-3 rounded-xl font-bold text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-primary/20 transition-all"><span className="material-symbols-outlined text-sm">publish</span> Publicar</button>
                       <button onClick={() => { if(confirm(`Excluir ingresso ${tk.title}?`)) { setData(p => ({ ...p, tickets: p.tickets.filter((_, i) => i !== index) })); } }} className="h-12 w-12 flex items-center justify-center rounded-xl bg-error/20 text-error border border-error/40"><span className="material-symbols-outlined">delete</span></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        <div className={`fixed bottom-8 right-8 z-50 transition-all transform ${hasChanges ? 'scale-100 opacity-100' : 'scale-90 opacity-0 pointer-events-none'}`}>
          <button onClick={handleSync} className="flex items-center gap-3 bg-primary text-on-primary px-8 py-4 rounded-full font-label font-bold text-sm uppercase tracking-widest shadow-2xl border border-primary/20">
            <span className="material-symbols-outlined animate-pulse">publish</span> Publicar no Site
          </button>
        </div>
      </div>
    </div>
  );
}
