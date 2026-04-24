/**
 * Centralized data store for Odysseia Open Air landing page.
 * This file serves as the default state. The values can be overridden via localStorage for live updates in the Admin Panel.
 */

import { DEFAULT_EXCURSIONS, DEFAULT_GALLERY, DEFAULT_LINEUP, DEFAULT_TICKETS } from './sectionData';

export interface Excursion {
  id: string;
  city: string;
  excursionName?: string;
  state: string;
  status: 'DISPONÍVEL' | 'VAGAS LIMITADAS' | 'ESGOTADO';
  departureTime: string;
  location: string;
  contactName: string;
  contactInstagram: string;
  whatsappNumber: string;
  isActive: boolean;
}

export interface DJ {
  id: string;
  name: string;
  genre: string;
  time: string;
  img: string;
  position?: 'object-top' | 'object-center' | 'object-bottom';
  scUrl: string;
  instagramUrl?: string;
  isConfirmed: boolean;
}

export interface GalleryEdition {
  id: string;
  title: string;
  year: string;
  cover: string;
  googlePhotosUrl: string;
}

export interface TicketTier {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  status: 'EM BREVE' | 'LOTE ATUAL' | 'ESGOTADO' | 'DISPONÍVEL';
  features: string[];
  link: string;
  highlighted?: boolean;
  isActive: boolean;
}

export interface OdysseiaData {
  general: {
    eventTitle: string;
    countdownDate: string; // ISO string
    aboutTitle: string;
    aboutDescription: string[];
    videoUrl: string;
    aboutMedia: {
      type: 'video' | 'image';
      url: string;
      position: string;
    };
  };
  lineup: DJ[];
  gallery: GalleryEdition[];
  excursions: Excursion[];
  tickets: TicketTier[];
}

export const DEFAULT_DATA: OdysseiaData = {
  general: {
    eventTitle: 'ODYSSEIA OPEN AIR',
    countdownDate: '2026-10-10T20:00:00Z',
    aboutTitle: 'ODYSSEIA OPEN AIR',
    aboutDescription: [
      'Em sua 5ª edição, a Odysseia reafirma sua essência como uma PVT de psytrance realizada em Cruz das Almas, no interior da Bahia, fortalecendo a cena local e valorizando DJs que constroem essa jornada com identidade e verdade. Inspirado na Odisseia de Homero, o evento transforma a rave em uma travessia sensorial: assim como na obra, a experiência é guiada por descoberta, intensidade, mistério e conexão com o desconhecido.',
      'Entre natureza, pista e atmosfera, cada edição convida o público a viver sua própria jornada como quem atravessa territórios simbólicos, enfrenta o inesperado e encontra, na música, um lugar de pertencimento.'
    ],
    videoUrl: '/Golden_symbol_of_202603262047.mp4',
    aboutMedia: {
      type: 'video',
      url: '/Golden_symbol_of_202603262047.mp4',
      position: 'center'
    }
  },
  lineup: DEFAULT_LINEUP,
  gallery: DEFAULT_GALLERY,
  excursions: DEFAULT_EXCURSIONS,
  tickets: DEFAULT_TICKETS,
};
