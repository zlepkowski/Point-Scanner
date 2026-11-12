// Minimal RFC 9309 robots.txt support: groups of user-agent lines, Allow and
// Disallow with `*` wildcards and `$` end anchors, longest match wins and
// Allow wins a tie.

export function parseRobots(text) {
  const groups = [];
  let current = null;
  let lastWasAgent = false;
  for (const raw of String(text ?? '').split(/\r?\n/)) {
    const line = raw.replace(/#.*$/, '').trim();
    const colon = line.indexOf(':');
    if (!line || colon < 0) continue;
    const key = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();
    if (key === 'user-agent') {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if ((key === 'allow' || key === 'disallow') && current && value) {
      current.rules.push({ allow: key === 'allow', pattern: value, regex: toRegex(value) });
    }
  }
  return groups;
}

function toRegex(pattern) {
  const anchored = pattern.endsWith('$');
  const body = (anchored ? pattern.slice(0, -1) : pattern)
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('.*');
  return new RegExp('^' + body + (anchored ? '$' : ''));
}

export function productToken(userAgent) {
  return String(userAgent).split(/[\s/]/)[0].toLowerCase();
}

function rulesFor(groups, userAgent) {
  const token = productToken(userAgent);
  const specific = groups.filter((g) => g.agents.includes(token));
  const chosen = specific.length ? specific : groups.filter((g) => g.agents.includes('*'));
  return chosen.flatMap((g) => g.rules);
}

export function isAllowed(groups, userAgent, pathAndQuery) {
  if (pathAndQuery === '/robots.txt') return true;
  let best = null;
  for (const rule of rulesFor(groups, userAgent)) {
    if (!rule.regex.test(pathAndQuery)) continue;
    const longer = !best || rule.pattern.length > best.pattern.length;
    const tieAllow = best && rule.pattern.length === best.pattern.length && rule.allow;
    if (longer || tieAllow) best = rule;
  }
  return best ? best.allow : true;
}
