/*! @license Ícones Lucide v1.53.0 (ISC); o ícone "lock" deriva do Feather (MIT). Texto completo em src/data/lucide-LICENSE.txt. */
// Ícones dos polos dos 12 eixos do 2 Turno, gerados a partir do lucide-static.
// Desenhos em 24×24 com traço; a escolha de cada ícone foi revisada para não puxar para um polo.
export type PoleIconElement = ['path', { d: string }] | ['circle', { cx: string; cy: string; r: string }]
  | ['rect', { x: string; y: string; width: string; height: string; rx?: string; ry?: string }];

export const ELECTION_POLE_ICONS: Record<string, { left: PoleIconElement[]; right: PoleIconElement[] }> = {
  // factory ↔ store
  coordenacao: {
    left: [["path", {"d": "M12 16h.01"}], ["path", {"d": "M16 16h.01"}], ["path", {"d": "M3 19a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.5a.5.5 0 0 0-.769-.422l-4.462 2.844A.5.5 0 0 1 15 10.5v-2a.5.5 0 0 0-.769-.422L9.77 10.922A.5.5 0 0 1 9 10.5V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2z"}], ["path", {"d": "M8 16h.01"}]],
    right: [["path", {"d": "M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5"}], ["path", {"d": "M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244"}], ["path", {"d": "M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05"}]]
  },
  // umbrella ↔ piggy-bank
  protecao_social: {
    left: [["path", {"d": "M12 13v7a2 2 0 0 0 4 0"}], ["path", {"d": "M12 2v2"}], ["path", {"d": "M20.992 13a1 1 0 0 0 .97-1.274 10.284 10.284 0 0 0-19.923 0A1 1 0 0 0 3 13z"}]],
    right: [["path", {"d": "M11 17h3v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-3a3.16 3.16 0 0 0 2-2h1a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-1a5 5 0 0 0-2-4V3a4 4 0 0 0-3.2 1.6l-.3.4H11a6 6 0 0 0-6 6v1a5 5 0 0 0 2 4v3a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1z"}], ["path", {"d": "M16 10h.01"}], ["path", {"d": "M2 8v1a2 2 0 0 0 2 2h1"}]]
  },
  // chart-no-axes-column-increasing ↔ trending-down
  tributacao: {
    left: [["path", {"d": "M5 21v-6"}], ["path", {"d": "M12 21V9"}], ["path", {"d": "M19 21V3"}]],
    right: [["path", {"d": "M16 17h6v-6"}], ["path", {"d": "m22 17-8.5-8.5-5 5L2 7"}]]
  },
  // building-2 ↔ briefcase
  provisao_publica: {
    left: [["path", {"d": "M10 12h4"}], ["path", {"d": "M10 8h4"}], ["path", {"d": "M14 21v-3a2 2 0 0 0-4 0v3"}], ["path", {"d": "M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2"}], ["path", {"d": "M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"}]],
    right: [["path", {"d": "M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"}], ["rect", {"x": "2", "y": "6", "width": "20", "height": "14", "rx": "2"}]]
  },
  // scroll-text ↔ handshake
  trabalho: {
    left: [["path", {"d": "M15 12h-5"}], ["path", {"d": "M15 8h-5"}], ["path", {"d": "M19 17V5a2 2 0 0 0-2-2H4"}], ["path", {"d": "M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3"}]],
    right: [["path", {"d": "m11 17 2 2a1 1 0 1 0 3-3"}], ["path", {"d": "m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"}], ["path", {"d": "m21 3 1 11h-2"}], ["path", {"d": "M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"}], ["path", {"d": "M3 4h8"}]]
  },
  // users ↔ house
  direitos_sociais: {
    left: [["path", {"d": "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"}], ["path", {"d": "M16 3.128a4 4 0 0 1 0 7.744"}], ["path", {"d": "M22 21v-2a4 4 0 0 0-3-3.87"}], ["circle", {"cx": "9", "cy": "7", "r": "4"}]],
    right: [["path", {"d": "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"}], ["path", {"d": "M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"}]]
  },
  // landmark ↔ church
  laicidade: {
    left: [["path", {"d": "M10 18v-7"}], ["path", {"d": "M11.119 2.205a2 2 0 0 1 1.762 0l7.84 3.846A.5.5 0 0 1 20.5 7h-17a.5.5 0 0 1-.22-.949z"}], ["path", {"d": "M14 18v-7"}], ["path", {"d": "M18 18v-7"}], ["path", {"d": "M3 22h18"}], ["path", {"d": "M6 18v-7"}]],
    right: [["path", {"d": "M10 9h4"}], ["path", {"d": "M12 7v5"}], ["path", {"d": "M14 21v-3a2 2 0 0 0-4 0v3"}], ["path", {"d": "m18 9 3.52 2.147a1 1 0 0 1 .48.854V19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6.999a1 1 0 0 1 .48-.854L6 9"}], ["path", {"d": "M6 21V7a1 1 0 0 1 .376-.782l5-3.999a1 1 0 0 1 1.249.001l5 4A1 1 0 0 1 18 7v14"}]]
  },
  // lock ↔ lock-open
  armas: {
    left: [["rect", {"x": "3", "y": "11", "width": "18", "height": "11", "rx": "2", "ry": "2"}], ["path", {"d": "M7 11V7a5 5 0 0 1 10 0v4"}]],
    right: [["rect", {"x": "3", "y": "11", "width": "18", "height": "11", "rx": "2", "ry": "2"}], ["path", {"d": "M7 11V7a5 5 0 0 1 9.9-1"}]]
  },
  // book-open ↔ gavel
  justica_penal: {
    left: [["path", {"d": "M12 5v16"}], ["path", {"d": "M20.001 19A2 2 0 0022 17V5a2 2 0 00-1.999-2L16 3.002A5 5 0 0012 5a5 5 0 00-4-2H4a2 2 0 00-2 2v12a2 2 0 001.999 2H8a5 5 0 014 2 5 5 0 014-2z"}]],
    right: [["path", {"d": "m14 13-8.381 8.38a1 1 0 0 1-3.001-3l8.384-8.381"}], ["path", {"d": "m16 16 6-6"}], ["path", {"d": "m21.5 10.5-8-8"}], ["path", {"d": "m8 8 6-6"}], ["path", {"d": "m8.5 7.5 8 8"}]]
  },
  // trees ↔ pickaxe
  ambiente: {
    left: [["path", {"d": "M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"}], ["path", {"d": "M7 16v6"}], ["path", {"d": "M13 19v3"}], ["path", {"d": "M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5"}]],
    right: [["path", {"d": "m14 13-8.381 8.38a1 1 0 0 1-3.001-3L11 9.999"}], ["path", {"d": "M15.973 4.027A13 13 0 0 0 5.902 2.373c-1.398.342-1.092 2.158.277 2.601a19.9 19.9 0 0 1 5.822 3.024"}], ["path", {"d": "M16.001 11.999a19.9 19.9 0 0 1 3.024 5.824c.444 1.369 2.26 1.676 2.603.278A13 13 0 0 0 20 8.069"}], ["path", {"d": "M18.352 3.352a1.205 1.205 0 0 0-1.704 0l-5.296 5.296a1.205 1.205 0 0 0 0 1.704l2.296 2.296a1.205 1.205 0 0 0 1.704 0l5.296-5.296a1.205 1.205 0 0 0 0-1.704z"}]]
  },
  // globe ↔ flag
  diplomacia_eleitoral: {
    left: [["circle", {"cx": "12", "cy": "12", "r": "10"}], ["path", {"d": "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"}], ["path", {"d": "M2 12h20"}]],
    right: [["path", {"d": "M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"}]]
  },
  // scale ↔ vote
  contrapesos: {
    left: [["path", {"d": "M12 3v18"}], ["path", {"d": "m19 8 3 8a5 5 0 0 1-6 0zV7"}], ["path", {"d": "M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1"}], ["path", {"d": "m5 8 3 8a5 5 0 0 1-6 0zV7"}], ["path", {"d": "M7 21h10"}]],
    right: [["path", {"d": "m9 12 2 2 4-4"}], ["path", {"d": "M5 7c0-1.1.9-2 2-2h10a2 2 0 0 1 2 2v12H5V7Z"}], ["path", {"d": "M22 19H2"}]]
  }
};
