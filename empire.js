// Atl Escape: the career, the city and the empire. Data only; game.js runs it.
window.ATL = (function () {
  'use strict';

  const KINDS = {
    police:   { label: 'Police',          short: 'APD',       model: 'assets/models/cop_officer.glb',    height: 1.82, color: '#2E6BFF' },
    thug:     { label: 'Street thugs',    short: 'THUGS',     model: 'assets/models/thug_street.glb',    height: 1.80, color: '#E0433A' },
    dealer:   { label: 'Drug dealers',    short: 'DEALERS',   model: 'assets/models/dealer_drug.glb',    height: 1.82, color: '#3CC46A' },
    boss:     { label: "Crime boss crew", short: 'BOSS CREW', model: 'assets/models/boss_crime.glb',     height: 1.92, color: '#F2C14E' },
    promoter: { label: 'Shady promoters', short: 'PROMOTERS', model: 'assets/models/promoter_shady.glb', height: 1.80, color: '#B36BFF' }
  };

  // What happens when each crew catches you.
  const CAUGHT = {
    police:   { stamp: 'BOOKED',  line: 'APD booked you. Bail ate into the bank and the heat is off.' },
    thug:     { stamp: 'ROBBED',  line: 'Street thugs ran your pockets. Everything you picked up is gone.' },
    dealer:   { stamp: 'JUMPED',  line: 'The dealers jumped you. You lost the cash and some respect.' },
    boss:     { stamp: 'TAXED',   line: 'The boss took his cut out of your bank.' },
    promoter: { stamp: 'STIFFED', line: 'The promoter stiffed you. No pay for this gig.' }
  };

  const TRACKS = {
    HUSTLE: 'Hustle', ARTIST: 'Artist', DJ: 'DJ', PRODUCER: 'Producer', PROMOTER: 'Promoter', EXEC: 'Label exec', FINAL: 'Endgame'
  };

  const RANKS = [
    { name: 'Corner Hustler',  rep: 0,   props: 0 },
    { name: 'Mixtape Grinder', rep: 30,  props: 0 },
    { name: 'Local Buzz',      rep: 80,  props: 1 },
    { name: 'Club Headliner',  rep: 160, props: 2 },
    { name: 'Industry Player', rep: 280, props: 4 },
    { name: 'Label Boss',      rep: 420, props: 6 },
    { name: 'King of the A',   rep: 0,   props: 0, final: true }
  ];

  // x, y: position on the city map in percent.
  const DISTRICTS = [
    { id: 'westend',  name: 'West End',         tier: 1, rank: 0, x: 24, y: 70,
      blurb: 'Barbershops, wing spots and the MARTA stop. Everybody starts somewhere.',
      theme: { signs: ['WEST END', 'WINGS & FISH', 'BARBER', 'MARTA'], accent: '#ff9a3c', accent2: '#ffd28a', fog: 0x3a3440, lamp: '#E28A34', sky: 0.55 } },
    { id: 'bankhead', name: 'Bankhead',         tier: 2, rank: 0, x: 18, y: 38,
      blurb: 'The Westside block where the sound was born. Loud, proud and watched.',
      theme: { signs: ['BANKHEAD', 'CORNER STORE', 'CHECK CASHING', 'REC CENTER'], accent: '#ff4a3c', accent2: '#ffcf6a', fog: 0x3b3236, lamp: '#E2853A', sky: 0.5 } },
    { id: 'l5p',      name: 'Little Five Points', tier: 3, rank: 1, x: 82, y: 57,
      blurb: 'Record shops, tattoo parlors and dive venues full of hungry crowds.',
      theme: { signs: ['LITTLE FIVE', 'RECORD SHOP', 'TATTOO', 'VINTAGE'], accent: '#3ce0c8', accent2: '#ff7ad9', fog: 0x2f3a44, lamp: '#D8A050', sky: 0.6 } },
    { id: 'eav',      name: 'East Atlanta Village', tier: 4, rank: 2, x: 68, y: 82,
      blurb: 'Warehouse parties and late sets. The money is good if you get out.',
      theme: { signs: ['EAST ATLANTA', 'DIVE BAR', 'TACOS', 'WAREHOUSE'], accent: '#b36bff', accent2: '#ffd28a', fog: 0x332e44, lamp: '#C88A5A', sky: 0.5 } },
    { id: 'o4w',      name: 'Old Fourth Ward',  tier: 5, rank: 2, x: 75, y: 36,
      blurb: 'Studios along the BeltLine. Real producers, real sessions, real sharks.',
      theme: { signs: ['OLD FOURTH WARD', 'STUDIO', 'COFFEE', 'BELTLINE'], accent: '#ffd23c', accent2: '#7ad8ff', fog: 0x38383c, lamp: '#E8A048', sky: 0.75 } },
    { id: 'downtown', name: 'Downtown',         tier: 6, rank: 3, x: 42, y: 51,
      blurb: 'Arena shows, office towers and promoters who never pay on time.',
      theme: { signs: ['DOWNTOWN', 'PEACHTREE ST', 'PAWN', 'ARENA'], accent: '#3c9bff', accent2: '#ffe08a', fog: 0x2c3846, lamp: '#E0B070', sky: 1.0, towers: true } },
    { id: 'midtown',  name: 'Midtown',          tier: 7, rank: 4, x: 45, y: 29,
      blurb: 'Neon, nightclubs and VIP ropes. Headline here and the city knows your name.',
      theme: { signs: ['MIDTOWN', 'NIGHTCLUB', 'LOUNGE', 'THEATRE'], accent: '#ff3cac', accent2: '#7af0ff', fog: 0x342c44, lamp: '#E0A0C0', sky: 1.0, towers: true } },
    { id: 'buckhead', name: 'Buckhead',         tier: 8, rank: 5, x: 62, y: 8,
      blurb: 'Penthouses and label money. The top of the empire sits right here.',
      theme: { signs: ['BUCKHEAD', 'VIP LOUNGE', 'JEWELERS', 'PENTHOUSES'], accent: '#f2c14e', accent2: '#ffffff', fog: 0x2e3440, lamp: '#F0C878', sky: 0.85, towers: true } }
  ];

  const PAY = [0, 300, 600, 1000, 1800, 2600, 4200, 6500, 10000];
  const REP = [0, 10, 16, 22, 28, 34, 42, 52, 64];
  const BUNDLE = [0, 10, 20, 35, 55, 80, 120, 170, 240];

  // pay and rep are multipliers on the district tier.
  const GIGS = [
    { id: 'we_mixtape', d: 'westend', track: 'HUSTLE', title: 'Sell mixtapes at the MARTA stop', desc: 'Move CDs hand to hand before the block notices.', seconds: 45, crew: ['thug', 'police'], heat: 8, pay: 1.1, rep: 0.8 },
    { id: 'we_battle', d: 'westend', track: 'ARTIST', title: 'Battle rap outside the barbershop', desc: 'Win the cypher. The loser\'s crew will not take it well.', seconds: 40, crew: ['thug'], heat: 2, pay: 0.7, rep: 1.3 },
    { id: 'bh_video', d: 'bankhead', track: 'ARTIST', title: 'Shoot a music video on the block', desc: 'Film the hook on the corner. Not everybody wants a camera there.', seconds: 55, crew: ['thug', 'dealer'], heat: 4, pay: 0.9, rep: 1.3 },
    { id: 'bh_party', d: 'bankhead', track: 'DJ', title: 'Spin a block party', desc: 'Two hours of records, one speaker stack, and a lot of uninvited guests.', seconds: 50, crew: ['dealer', 'police'], heat: 10, pay: 1.1, rep: 1.0 },
    { id: 'l5_openmic', d: 'l5p', track: 'ARTIST', title: 'Open mic at a dive venue', desc: 'Steal the show, then outrun the promoter who wants you on contract.', seconds: 55, crew: ['promoter', 'thug'], heat: 3, pay: 0.9, rep: 1.3 },
    { id: 'l5_sneakers', d: 'l5p', track: 'HUSTLE', title: 'Flip limited sneakers', desc: 'Buy the drop, sell it on the sidewalk, keep moving.', seconds: 50, crew: ['police', 'thug'], heat: 10, pay: 1.3, rep: 0.7 },
    { id: 'ea_warehouse', d: 'eav', track: 'DJ', title: 'DJ a warehouse party', desc: 'Pack the floor, collect the door money, get out the back.', seconds: 60, crew: ['promoter', 'dealer'], heat: 6, pay: 1.1, rep: 1.0 },
    { id: 'ea_beats', d: 'eav', track: 'PRODUCER', title: 'Sell beats to local rappers', desc: 'Hard drive full of beats, pockets full of cash. Watch your back.', seconds: 60, crew: ['thug', 'dealer'], heat: 4, pay: 1.0, rep: 1.1 },
    { id: 'o4_session', d: 'o4w', track: 'PRODUCER', title: 'Studio session off the BeltLine', desc: 'Produce a single for a name artist. The boss behind him wants the masters.', seconds: 65, crew: ['dealer', 'boss'], heat: 5, pay: 1.0, rep: 1.2 },
    { id: 'o4_popup', d: 'o4w', track: 'PROMOTER', title: 'Promote a BeltLine pop up show', desc: 'Flyers, permits you do not have, and a rival promoter\'s muscle.', seconds: 60, crew: ['promoter', 'police'], heat: 8, pay: 1.2, rep: 0.9 },
    { id: 'dt_collect', d: 'downtown', track: 'PROMOTER', title: 'Collect what a promoter owes you', desc: 'He owes you for three shows. His friends disagree.', seconds: 70, crew: ['promoter', 'boss'], heat: 6, pay: 1.3, rep: 0.9 },
    { id: 'dt_arena', d: 'downtown', track: 'ARTIST', title: 'Open for a headliner at the arena', desc: 'Twenty thousand people. Then the street outside the loading dock.', seconds: 70, crew: ['police', 'promoter'], heat: 10, pay: 1.0, rep: 1.3 },
    { id: 'mt_headline', d: 'midtown', track: 'ARTIST', title: 'Headline a Midtown club night', desc: 'Your name on the marquee. Everybody wants a piece of it.', seconds: 75, crew: ['boss', 'promoter', 'police'], heat: 10, pay: 1.0, rep: 1.3 },
    { id: 'mt_after', d: 'midtown', track: 'PROMOTER', title: 'Throw a celebrity after party', desc: 'Velvet rope, bottle service, and a dealer who thinks it is his party.', seconds: 75, crew: ['boss', 'dealer'], heat: 8, pay: 1.3, rep: 0.9 },
    { id: 'bk_deal', d: 'buckhead', track: 'EXEC', title: 'Sign a label distribution deal', desc: 'Close the deal across town before the boss\'s people stop the ink.', seconds: 80, crew: ['boss', 'promoter'], heat: 6, pay: 1.2, rep: 1.1 },
    { id: 'bk_catalog', d: 'buckhead', track: 'EXEC', title: 'Buy out a rival\'s catalog', desc: 'Take his masters, take his money, take his block.', seconds: 85, crew: ['boss', 'thug', 'dealer'], heat: 8, pay: 1.3, rep: 1.2 },
    { id: 'bk_takeover', d: 'buckhead', track: 'FINAL', title: 'The Takeover', desc: 'You own the Empire Tower. Make it to the top of Peachtree with the whole city on your tail.', seconds: 95, crew: ['boss', 'police', 'thug', 'dealer', 'promoter'], heat: 0, pay: 2.0, rep: 2.0, needs: 'tower' }
  ];

  const PROPERTIES = [
    { id: 'studio_home', d: 'westend',  name: 'West End Home Studio',        kind: 'Studio',     price: 1200,   income: 150,  rep: 5 },
    { id: 'store',       d: 'bankhead', name: 'Bankhead Corner Store',       kind: 'Storefront', price: 3000,   income: 350,  rep: 5 },
    { id: 'records',     d: 'l5p',      name: 'Little Five Record Shop',     kind: 'Storefront', price: 6000,   income: 600,  rep: 8 },
    { id: 'warehouse',   d: 'eav',      name: 'East Atlanta Warehouse Venue', kind: 'Venue',     price: 12000,  income: 1000, rep: 10 },
    { id: 'studio_pro',  d: 'o4w',      name: 'BeltLine Recording Studio',   kind: 'Studio',     price: 20000,  income: 1600, rep: 12 },
    { id: 'office',      d: 'downtown', name: 'Downtown Office Building',    kind: 'Building',   price: 35000,  income: 2600, rep: 15 },
    { id: 'club',        d: 'midtown',  name: 'Midtown Nightclub',           kind: 'Night club', price: 55000,  income: 3800, rep: 20 },
    { id: 'lounge',      d: 'buckhead', name: 'Buckhead Penthouse Lounge',   kind: 'Night club', price: 80000,  income: 5000, rep: 25 },
    { id: 'tower',       d: 'buckhead', name: 'Empire Tower on Peachtree',   kind: 'Skyscraper', price: 120000, income: 8000, rep: 40, rank: 5 }
  ];

  return { KINDS, CAUGHT, TRACKS, RANKS, DISTRICTS, GIGS, PROPERTIES, PAY, REP, BUNDLE };
})();
