// Program adapters. Each one is an object:
//
//   {
//     id: 'aa',                       // short name used on the command line
//     programId: 'aadvantage',        // key in assets/js/data/programs.js
//     hosts: ['www.aa.com'],          // every host it calls
//     async search({ from, to, date }, client) { return Award[] },
//   }
//
// `client` is the polite HTTP client from lib/http.js; adapters must use it for
// every request (never raw fetch) so robots.txt, rate limits and block
// handling always apply. Build records with lib/award.js `toAward`.
//
// None are enabled yet. docs/LIVE_DATA.md tracks each program's status.
export const ADAPTERS = [];
