export type PillStatus = 'pit_open' | 'watch' | 'critical' | 'none';

export const TEAM_COLOR: Record<string, string> = {
  VER: '#3671c6', PER: '#3671c6',
  LEC: '#e8002d', SAI: '#e8002d', BEA: '#e8002d',
  HAM: '#27f4d2', RUS: '#27f4d2',
  NOR: '#ff8000', PIA: '#ff8000',
  ALO: '#229971', STR: '#229971',
  GAS: '#ff87bc', OCO: '#ff87bc',
  ALB: '#64c4ff', SAR: '#64c4ff', COL: '#64c4ff',
  MAG: '#b6babd', HUL: '#b6babd',
  TSU: '#6692ff', RIC: '#6692ff', LAW: '#6692ff', HAD: '#6692ff',
  BOT: '#52e252', ZHO: '#52e252',
};

export const TYRE_CFG: Record<string, { color: string; label: string; text: string }> = {
  S: { color: '#e8002d', label: 'S', text: '#e8002d' },
  M: { color: '#ffd600', label: 'M', text: '#ffd600' },
  H: { color: '#ffffff', label: 'H', text: '#ffffff' },
  I: { color: '#39b54a', label: 'I', text: '#39b54a' },
  W: { color: '#0067ff', label: 'W', text: '#0067ff' },
};

export const MOCK_DRIVERS = [
  { pos: 1,  code: 'VER', gap: 'LEADER',  tyre: 'M', status: 'none'     as PillStatus },
  { pos: 2,  code: 'HAM', gap: '-0.60s',  tyre: 'M', status: 'pit_open' as PillStatus },
  { pos: 3,  code: 'NOR', gap: '-0.70s',  tyre: 'S', status: 'pit_open' as PillStatus },
  { pos: 4,  code: 'PIA', gap: '-0.45s',  tyre: 'M', status: 'pit_open' as PillStatus },
  { pos: 5,  code: 'LEC', gap: '-0.30s',  tyre: 'M', status: 'pit_open' as PillStatus },
  { pos: 6,  code: 'RUS', gap: '-0.36s',  tyre: 'S', status: 'pit_open' as PillStatus },
  { pos: 7,  code: 'ALO', gap: '-0.53s',  tyre: 'S', status: 'pit_open' as PillStatus },
  { pos: 8,  code: 'STR', gap: '-0.30s',  tyre: 'S', status: 'pit_open' as PillStatus },
  { pos: 9,  code: 'TSU', gap: '-0.55s',  tyre: 'S', status: 'pit_open' as PillStatus },
  { pos: 10, code: 'SAI', gap: '-0.90s',  tyre: 'S', status: 'pit_open' as PillStatus },
  { pos: 11, code: 'GAS', gap: '-1.50s',  tyre: 'S', status: 'pit_open' as PillStatus },
  { pos: 12, code: 'OCO', gap: '-0.50s',  tyre: 'M', status: 'pit_open' as PillStatus },
  { pos: 13, code: 'ALB', gap: '-0.35s',  tyre: 'M', status: 'pit_open' as PillStatus },
  { pos: 14, code: 'HUL', gap: '-0.25s',  tyre: 'M', status: 'pit_open' as PillStatus },
  { pos: 15, code: 'MAG', gap: '-0.85s',  tyre: 'M', status: 'pit_open' as PillStatus },
  { pos: 16, code: 'BOT', gap: '-0.50s',  tyre: 'S', status: 'pit_open' as PillStatus },
];

export const CHART_SERIES = [
  { key: 'Verstappen', color: '#00d2be' },
  { key: 'Hamilton',   color: '#27f4d2' },
  { key: 'Norris',     color: '#ff8000' },
  { key: 'Pérez',      color: '#9b59b6' },
  { key: 'Leclerc',    color: '#e8002d' },
  { key: 'Others',     color: '#ffffff' },
];

export const GAP_DATA = (() => {
  const data: any[] = [];
  for (let lap = 0; lap <= 52; lap++) {
    const pt: any = { lap };
    const t = lap / 52;
    pt.Verstappen = parseFloat((Math.sin(t * Math.PI * 1.5) * 1.2 - t * 0.5).toFixed(2));
    pt.Hamilton = parseFloat((-0.5 - t * 2.0 + (lap > 18 && lap < 22 ? 0.8 : 0)).toFixed(2));
    pt.Norris = parseFloat((-0.8 - t * 2.5 + Math.sin(t * Math.PI) * 0.5).toFixed(2));
    pt.Pérez = parseFloat((-1.0 - t * 5.0 + Math.sin(t * Math.PI * 1.2) * 1.5).toFixed(2));
    pt.Leclerc = parseFloat((-1.2 - t * 8.0 + Math.sin(t * Math.PI) * 2).toFixed(2));
    pt.Others = parseFloat((-2.0 - t * 18.0 + Math.cos(t * Math.PI * 0.5) * 3).toFixed(2));
    data.push(pt);
  }
  return data;
})();

export const TYRE_DEG_DATA = (() => {
  const data: any[] = [];
  for (let i = 0; i <= 52; i++) {
    data.push({
      lap: i,
      'SOFT C3':   i <= 32 ? parseFloat(Math.max(0, i * 2.5 - Math.pow(i / 15, 1.8)).toFixed(1)) : null,
      'MEDIUM C2': parseFloat(Math.max(0, i * 1.2 + Math.pow(i / 20, 1.4)).toFixed(1)),
    });
  }
  return data;
})();

export const PIT_OPTIONS = [
  { label: 'Opt 1', laps: [25, 34], tyres: ['M', 'S'] as const, result: '1st', resultColor: '#00d2be', delta: '—',      deltaColor: 'var(--txt-dim)' },
  { label: 'Opt 2', laps: [23, 34], tyres: ['M', 'S'] as const, result: '3rd', resultColor: '#6692ff', delta: '+4.82s', deltaColor: '#6692ff' },
  { label: 'Alt',   laps: [25, 34], parseInt: ['M', 'S'] as const, tyres: ['M', 'S'] as const, result: '5th', resultColor: '#9b59b6', delta: '+8.15s', deltaColor: '#9b59b6' },
];

export const PIT_WALL = [
  { time: '18:50', msg: 'PIT WALL: Leclerc in this lap',           hi: false, hlRed: true },
  { time: '18:50', msg: 'PIT WALL: Strategy window open (L22–28)', hi: false },
  { time: '19:50', msg: 'Ocon: New medium tyres',                   hi: false },
  { time: '13:00', msg: 'PIT WALL: Stroll box this lap',            hi: false },
  { time: '17:30', msg: 'PIT WALL: DRS disabled (Zone 2)',          hi: false },
  { time: '17:20', msg: 'PIT WALL: VSC Deployed',                   hi: true  },
  { time: '17:38', msg: 'PIT WALL: Track clear',                    hi: false },
  { time: '17:30', msg: 'PIT WALL: Green flag',                     hi: false },
  { time: '16:38', msg: 'PIT WALL: Hamilton fastest S1',            hi: false },
  { time: '16:55', msg: 'PIT WALL: Next window L35–41',             hi: false },
];
