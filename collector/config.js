// First-pass settings, to be refined (see docs/LIVE_DATA.md).
export const CONFIG = {
  userAgent: 'PointscannerBot/0.1 (+https://github.com/zlepkowski/Point-Scanner)',
  minDelayMs: 4000,
  timeoutMs: 20000,
  daysAhead: 30,
  dateStep: 1,
  maxErrorsPerAdapter: 5,
  routes: [
    { from: 'JFK', to: 'LHR' },
    { from: 'LHR', to: 'JFK' },
    { from: 'JFK', to: 'CDG' },
    { from: 'ORD', to: 'LHR' },
    { from: 'DFW', to: 'LHR' },
    { from: 'MIA', to: 'MAD' },
    { from: 'LAX', to: 'HND' },
    { from: 'DFW', to: 'HND' },
  ],
};
