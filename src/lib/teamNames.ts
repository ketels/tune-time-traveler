/**
 * List of fun Swedish team names for automatic assignment
 */
export const TEAM_NAMES = [
  'Låtjägarna',
  'Melodimästarna',
  'Rytmridarna',
  'Soundet',
  'Hitlistorna',
  'Tempots Hjältar',
  'Noterna',
  'Kompositörerna',
  'Festplattelistan',
  'Spellistan',
  'Discokungarna',
  'Groove Gang',
  'Vinylvännerna',
  'Beat Brigade',
  'Notknäckarna',
  'Melodijägarna',
  'Hitpatrullen',
  'Soloartisterna',
  'Koröarna',
  'Refrängryttarna',
  'Tempotjuvarna',
  'Taktkänslan',
  'Musikquizarna',
  'Låtgissarna',
  'Tonsättarna',
  'Harmonihotet',
  'Mixtapegänget',
  'Soundchecken',
  'Akustikerna',
  'Baslinjen',
  'Melodiminnet',
  'Hitmakarna',
  'Spelningarna',
  'Turné Truppen',
  'Encore Gänget',
];

/**
 * Returns a random team name from the list
 */
export function getRandomTeamName(): string {
  return TEAM_NAMES[Math.floor(Math.random() * TEAM_NAMES.length)];
}
