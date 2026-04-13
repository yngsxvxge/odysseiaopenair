import type { DJ, TicketTier, GalleryEdition, Excursion } from './data';

export const DEFAULT_LINEUP: DJ[] = [
  {
    id: 'macedo',
    name: 'MACEDO',
    genre: 'PROGRESSIVE / PSYTECHNO',
    time: '',
    img: 'https://instagram.fval1-1.fna.fbcdn.net/v/t51.82787-15/587277690_18067024754528362_4754021684688367976_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=100&ig_cache_key=Mzc3ODIxNzA0NzY3NTcwMjMwMg%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6InhwaWRzLjE0NDB4MTkxOS5zZHIuQzMifQ%3D%3D&_nc_ohc=0v6EOCqOPEYQ7kNvwHhOSLJ&_nc_oc=AdoJZJV5P-mA6rqOcdzXRKh8zxzAbhC4HJ85HmtnI85GhrtSGoIHRQ28fEaKk0fKF2E&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.fval1-1.fna&_nc_gid=SWupsgmm9flEfIR9rNl_xg&_nc_ss=7a32e&oh=00_Af1DhdekV-NS0IY9NadjjESxqMZWK_0Pp3CNiXnxQFQQQw&oe=69DB9626',
    position: 'object-top',
    scUrl: 'https://soundcloud.com/macedobr/macedo-live-maze-a-delic-full-set-psytechnopsytrance',
    instagramUrl: 'https://www.instagram.com/macedobr/',
    isConfirmed: true,
  },
{
    id: 'maximum',
    name: 'MAXIMUM',
    genre: 'PROGRESSIVE / PSYTECHNO',
    time: '',
    img: 'https://instagram.fval1-1.fna.fbcdn.net/v/t51.82787-15/587277690_18067024754528362_4754021684688367976_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=100&ig_cache_key=Mzc3ODIxNzA0NzY3NTcwMjMwMg%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6InhwaWRzLjE0NDB4MTkxOS5zZHIuQzMifQ%3D%3D&_nc_ohc=0v6EOCqOPEYQ7kNvwHhOSLJ&_nc_oc=AdoJZJV5P-mA6rqOcdzXRKh8zxzAbhC4HJ85HmtnI85GhrtSGoIHRQ28fEaKk0fKF2E&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=instagram.fval1-1.fna&_nc_gid=SWupsgmm9flEfIR9rNl_xg&_nc_ss=7a32e&oh=00_Af1DhdekV-NS0IY9NadjjESxqMZWK_0Pp3CNiXnxQFQQQw&oe=69DB9626',
    position: 'object-top',
    scUrl: 'https://soundcloud.com/macedobr/macedo-live-maze-a-delic-full-set-psytechnopsytrance',
    instagramUrl: 'https://www.instagram.com/macedobr/',
    isConfirmed: true,
  },
];

export const DEFAULT_TICKETS: TicketTier[] = [
  {
    id: 'tier2',
    title: 'Lote Promocional',
    subtitle: 'Meia entrada',
    price: 'R$ 35',
    status: 'LOTE ATUAL',
    features: ['Acesso aos 2 dias de evento', 'Área de Camping Standard', 'Água free no Chillout'],
    link: 'https://app.hi.events/event/7241/odysseia-o-exilir-de-calypso',
    highlighted: true,
    isActive: true,
  },{
    id: 'tier1',
    title: 'Lote Promocional',
    subtitle: 'Inteira',
    price: 'R$ 70',
    status: 'LOTE ATUAL',
    features: [],
    link: 'https://app.hi.events/event/7241/odysseia-o-exilir-de-calypso',
    highlighted: true,
    isActive: true,
  },  
  {
    id: 'tier3',
    title: 'Combo VIP',
    subtitle: 'Divine Experience',
    price: 'R$ 320',
    status: 'DISPONÍVEL',
    features: ['Backstage Access', 'Banheiros Privativos Luxo', 'Pulseira RFID Cashless'],
    link: 'https://app.hi.events/event/7241/odysseia-o-exilir-de-calypso',
    highlighted: false,
    isActive: false,
  },
];

export const DEFAULT_GALLERY: GalleryEdition[] = [
  {
    id: 'ed1',
    title: 'Odysseia Prólogo',
    year: '2024.1',
    cover: './1.png',
    googlePhotosUrl: 'https://drive.google.com/drive/folders/1D5RBWPeQcf8zO4LYsVoINWDsqbvBK3Lq?usp=sharing',
    
  },
  {
    id: 'ed2',
    title: 'Ilha de Lotófagos ',
    year: '2024.2',
    cover: './2.png',
    googlePhotosUrl: 'https://drive.google.com/drive/folders/1pAI60rlyoFKbCyRwjbqJr5AfZPvAkzyB?usp=sharing',
   
  },
  {
    id: 'ed3',
    title: 'O Canto das Sereias',
    year: '2025.1',
    cover: './3.png',
    googlePhotosUrl: 'https://drive.google.com/drive/folders/1aolGG0NduKxTLioOds9u7G6epa0S0DgF?usp=sharing',
    
  },
  {
    id: 'ed4',
    title: 'O Guardião dos Ventos',
    year: '2025.2',
    cover: './4.png',
    googlePhotosUrl: 'https://drive.google.com/drive/folders/1rzjGpYfoFJEi3q1gFfPNUKByKpOk6kWx?usp=sharing',
   
  },
];

export const DEFAULT_EXCURSIONS: Excursion[] = [
  {
    id: '1',
    city: 'Santo Antonio de Jesus',
    state: 'BA',
    status: 'VAGAS LIMITADAS',
    departureTime: 'A definir',
    location: 'Praça Padre Matheus',
    contactName: 'Silas Yan',
    contactInstagram: 'https://www.instagram.com/itsyan_z/',
    whatsappNumber: '75988725232',
    isActive: true,
  },
  {
    id: '2',
    city: 'Cruz das Almas',
    state: 'BA',
    status: 'DISPONÍVEL',
    departureTime: 'A definir',
    location: 'Rodoviária de Cruz das Almas e Praça da Master',
    contactName: 'Viny Patrick',
    contactInstagram: 'https://www.instagram.com/vinypatrick/',
    whatsappNumber: '73991030905',
    isActive: true,
  }
];
