// Real logo/flag images for the two sports currently wired up
// (americanfootball_nfl, soccer_fifa_world_cup — see .env ODDS_API_SPORTS).
// No third-party API key needed: ESPN's team-logo CDN and flagcdn.com's
// flag CDN both serve images directly by a stable code, so this is just
// a name -> code lookup table. Falls back to no image (handled by the
// caller's onError) for anything not in these maps, rather than a
// broken-image icon.

const NFL_TEAM_CODES: Record<string, string> = {
  "Arizona Cardinals": "ari",
  "Atlanta Falcons": "atl",
  "Baltimore Ravens": "bal",
  "Buffalo Bills": "buf",
  "Carolina Panthers": "car",
  "Chicago Bears": "chi",
  "Cincinnati Bengals": "cin",
  "Cleveland Browns": "cle",
  "Dallas Cowboys": "dal",
  "Denver Broncos": "den",
  "Detroit Lions": "det",
  "Green Bay Packers": "gb",
  "Houston Texans": "hou",
  "Indianapolis Colts": "ind",
  "Jacksonville Jaguars": "jax",
  "Kansas City Chiefs": "kc",
  "Los Angeles Chargers": "lac",
  "Los Angeles Rams": "lar",
  "Las Vegas Raiders": "lv",
  "Miami Dolphins": "mia",
  "Minnesota Vikings": "min",
  "New England Patriots": "ne",
  "New Orleans Saints": "no",
  "New York Giants": "nyg",
  "New York Jets": "nyj",
  "Philadelphia Eagles": "phi",
  "Pittsburgh Steelers": "pit",
  "Seattle Seahawks": "sea",
  "San Francisco 49ers": "sf",
  "Tampa Bay Buccaneers": "tb",
  "Tennessee Titans": "ten",
  "Washington Commanders": "wsh",
};

// ISO 3166-1 alpha-2 codes for countries that commonly appear in FIFA
// World Cup qualifying/finals odds. Not exhaustive — anything missing
// just falls back gracefully rather than guessing wrong.
const COUNTRY_CODES: Record<string, string> = {
  Afghanistan: "af", Albania: "al", Algeria: "dz", Angola: "ao", Argentina: "ar",
  Armenia: "am", Australia: "au", Austria: "at", Azerbaijan: "az", Bahrain: "bh",
  Belgium: "be", Bolivia: "bo", "Bosnia and Herzegovina": "ba", Brazil: "br",
  Bulgaria: "bg", "Burkina Faso": "bf", Cameroon: "cm", Canada: "ca",
  "Cape Verde": "cv", Chile: "cl", China: "cn", Colombia: "co", "Costa Rica": "cr",
  Croatia: "hr", Curaçao: "cw", Cyprus: "cy", Czechia: "cz", Denmark: "dk",
  "Dominican Republic": "do", Ecuador: "ec", Egypt: "eg", "El Salvador": "sv",
  England: "gb-eng", Estonia: "ee", Finland: "fi", France: "fr", Gabon: "ga",
  Georgia: "ge", Germany: "de", Ghana: "gh", Greece: "gr", Guatemala: "gt",
  Haiti: "ht", Honduras: "hn", Hungary: "hu", Iceland: "is", Iran: "ir",
  Iraq: "iq", Ireland: "ie", Israel: "il", Italy: "it", "Ivory Coast": "ci",
  "Côte d'Ivoire": "ci", Jamaica: "jm", Japan: "jp", Jordan: "jo",
  Kazakhstan: "kz", Kenya: "ke", "South Korea": "kr", Kosovo: "xk", Kuwait: "kw",
  Latvia: "lv", Lebanon: "lb", Libya: "ly", Lithuania: "lt", Luxembourg: "lu",
  Madagascar: "mg", Mali: "ml", Malta: "mt", Mexico: "mx", Moldova: "md",
  Montenegro: "me", Morocco: "ma", Mozambique: "mz", Netherlands: "nl",
  "New Zealand": "nz", Nicaragua: "ni", Nigeria: "ng", "North Macedonia": "mk",
  "Northern Ireland": "gb-nir", Norway: "no", Oman: "om", Panama: "pa",
  Paraguay: "py", Peru: "pe", Poland: "pl", Portugal: "pt", Qatar: "qa",
  Romania: "ro", Russia: "ru", "Saudi Arabia": "sa", Scotland: "gb-sct",
  Senegal: "sn", Serbia: "rs", Slovakia: "sk", Slovenia: "si",
  "South Africa": "za", Spain: "es", Suriname: "sr", Sweden: "se",
  Switzerland: "ch", Syria: "sy", Tanzania: "tz", Thailand: "th",
  Tunisia: "tn", Turkey: "tr", Türkiye: "tr", Uganda: "ug", Ukraine: "ua",
  "United Arab Emirates": "ae", "United States": "us", USA: "us", Uruguay: "uy",
  Uzbekistan: "uz", Venezuela: "ve", Vietnam: "vn", Wales: "gb-wls", Zambia: "zm",
};

export function getNflTeamLogoUrl(teamName: string): string | null {
  const code = NFL_TEAM_CODES[teamName];
  return code ? `https://a.espncdn.com/i/teamlogos/nfl/500/${code}.png` : null;
}

export function getCountryFlagUrl(countryName: string): string | null {
  const code = COUNTRY_CODES[countryName];
  return code ? `https://flagcdn.com/w80/${code}.png` : null;
}

export function getTeamImageUrl(outcomeName: string, sport: string): string | null {
  if (outcomeName === "Draw") return null;
  if (sport === "NFL") return getNflTeamLogoUrl(outcomeName);
  if (sport === "FIFA World Cup") return getCountryFlagUrl(outcomeName);
  return null;
}
