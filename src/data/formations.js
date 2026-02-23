import { v4 as uuidv4 } from 'uuid'

// All positions are normalized 0-1 for the home team (bottom half, y=0.94 is near home goal).
// Away team mirrors vertically: y_away = 1.0 - y_home
// x=0 is left, x=1 is right, y=0 is top, y=1 is bottom

// Roles use commonly accepted football terms:
//   GK  = Goalkeeper
//   DEF = Defender
//   MID = Midfielder
//   FWD = Forward

const FORMATIONS = {
  '4-4-2': {
    label: '4-4-2',
    positions: [
      { role: 'GK',  position: 'GK',  number: 1,  x: 0.50, y: 0.94 },
      { role: 'DEF', position: 'RB',  number: 2,  x: 0.18, y: 0.78 },
      { role: 'DEF', position: 'CB',  number: 5,  x: 0.38, y: 0.78 },
      { role: 'DEF', position: 'CB',  number: 6,  x: 0.62, y: 0.78 },
      { role: 'DEF', position: 'LB',  number: 3,  x: 0.82, y: 0.78 },
      { role: 'MID', position: 'RM',  number: 7,  x: 0.18, y: 0.61 },
      { role: 'MID', position: 'CM',  number: 8,  x: 0.38, y: 0.61 },
      { role: 'MID', position: 'CM',  number: 4,  x: 0.62, y: 0.61 },
      { role: 'MID', position: 'LM',  number: 11, x: 0.82, y: 0.61 },
      { role: 'FWD', position: 'ST',  number: 9,  x: 0.37, y: 0.44 },
      { role: 'FWD', position: 'ST',  number: 10, x: 0.63, y: 0.44 },
    ],
  },
  '4-3-3': {
    label: '4-3-3',
    positions: [
      { role: 'GK',  position: 'GK',  number: 1,  x: 0.50, y: 0.94 },
      { role: 'DEF', position: 'RB',  number: 2,  x: 0.18, y: 0.78 },
      { role: 'DEF', position: 'CB',  number: 5,  x: 0.38, y: 0.78 },
      { role: 'DEF', position: 'CB',  number: 6,  x: 0.62, y: 0.78 },
      { role: 'DEF', position: 'LB',  number: 3,  x: 0.82, y: 0.78 },
      { role: 'MID', position: 'CM',  number: 8,  x: 0.25, y: 0.60 },
      { role: 'MID', position: 'CDM', number: 4,  x: 0.50, y: 0.60 },
      { role: 'MID', position: 'CM',  number: 10, x: 0.75, y: 0.60 },
      { role: 'FWD', position: 'LW',  number: 11, x: 0.18, y: 0.43 },
      { role: 'FWD', position: 'ST',  number: 9,  x: 0.50, y: 0.43 },
      { role: 'FWD', position: 'RW',  number: 7,  x: 0.82, y: 0.43 },
    ],
  },
  '4-2-3-1': {
    label: '4-2-3-1',
    positions: [
      { role: 'GK',  position: 'GK',  number: 1,  x: 0.50, y: 0.94 },
      { role: 'DEF', position: 'RB',  number: 2,  x: 0.18, y: 0.80 },
      { role: 'DEF', position: 'CB',  number: 5,  x: 0.38, y: 0.80 },
      { role: 'DEF', position: 'CB',  number: 6,  x: 0.62, y: 0.80 },
      { role: 'DEF', position: 'LB',  number: 3,  x: 0.82, y: 0.80 },
      { role: 'MID', position: 'CDM', number: 4,  x: 0.38, y: 0.66 },
      { role: 'MID', position: 'CDM', number: 8,  x: 0.62, y: 0.66 },
      { role: 'MID', position: 'RW',  number: 7,  x: 0.18, y: 0.52 },
      { role: 'MID', position: 'CAM', number: 10, x: 0.50, y: 0.52 },
      { role: 'MID', position: 'LW',  number: 11, x: 0.82, y: 0.52 },
      { role: 'FWD', position: 'ST',  number: 9,  x: 0.50, y: 0.38 },
    ],
  },
  '3-5-2': {
    label: '3-5-2',
    positions: [
      { role: 'GK',  position: 'GK',  number: 1,  x: 0.50, y: 0.94 },
      { role: 'DEF', position: 'CB',  number: 5,  x: 0.27, y: 0.79 },
      { role: 'DEF', position: 'CB',  number: 6,  x: 0.50, y: 0.79 },
      { role: 'DEF', position: 'CB',  number: 4,  x: 0.73, y: 0.79 },
      { role: 'MID', position: 'RWB', number: 3,  x: 0.06, y: 0.63 },
      { role: 'MID', position: 'CM',  number: 8,  x: 0.28, y: 0.62 },
      { role: 'MID', position: 'CM',  number: 10, x: 0.50, y: 0.62 },
      { role: 'MID', position: 'CM',  number: 7,  x: 0.72, y: 0.62 },
      { role: 'MID', position: 'LWB', number: 2,  x: 0.94, y: 0.63 },
      { role: 'FWD', position: 'ST',  number: 9,  x: 0.37, y: 0.44 },
      { role: 'FWD', position: 'ST',  number: 11, x: 0.63, y: 0.44 },
    ],
  },
  '5-3-2': {
    label: '5-3-2',
    positions: [
      { role: 'GK',  position: 'GK',  number: 1,  x: 0.50, y: 0.94 },
      { role: 'DEF', position: 'RB',  number: 3,  x: 0.06, y: 0.79 },
      { role: 'DEF', position: 'CB',  number: 5,  x: 0.27, y: 0.79 },
      { role: 'DEF', position: 'CB',  number: 6,  x: 0.50, y: 0.79 },
      { role: 'DEF', position: 'CB',  number: 4,  x: 0.73, y: 0.79 },
      { role: 'DEF', position: 'LB',  number: 2,  x: 0.94, y: 0.79 },
      { role: 'MID', position: 'CM',  number: 8,  x: 0.25, y: 0.62 },
      { role: 'MID', position: 'CM',  number: 10, x: 0.50, y: 0.62 },
      { role: 'MID', position: 'CM',  number: 7,  x: 0.75, y: 0.62 },
      { role: 'FWD', position: 'ST',  number: 9,  x: 0.37, y: 0.44 },
      { role: 'FWD', position: 'ST',  number: 11, x: 0.63, y: 0.44 },
    ],
  },
}

/**
 * Infers a role from jersey number using common football conventions.
 * Number 1 = GK, 2-6 = DEF, 7-11 = MID/FWD heuristic.
 * For formation-placed players the role comes from the formation data directly.
 * This is a fallback for manually added players.
 *
 * @param {number} number
 * @returns {'GK'|'DEF'|'MID'|'FWD'}
 */
export function roleFromNumber(number) {
  if (number === 1) return 'GK'
  if (number >= 2 && number <= 5) return 'DEF'
  if (number === 6) return 'DEF'
  if (number >= 7 && number <= 8) return 'MID'
  if (number === 9) return 'FWD'
  if (number === 10) return 'MID'
  if (number === 11) return 'FWD'
  // Squad numbers 12+: heuristic by range
  if (number >= 12 && number <= 20) return 'DEF'
  if (number >= 21 && number <= 25) return 'MID'
  return 'FWD'
}

/**
 * Builds an array of 11 player objects for a given formation and team.
 * Roles and position labels come directly from the formation data.
 *
 * @param {string} formationKey - e.g. '4-4-2'
 * @param {'home'|'away'} team
 * @returns {Array} array of player objects ready for applyFormation
 */
export function buildFormationPlayers(formationKey, team) {
  const formation = FORMATIONS[formationKey]
  if (!formation) throw new Error(`Unknown formation: ${formationKey}`)

  return formation.positions.map((pos) => ({
    id: uuidv4(),
    team,
    x: pos.x,
    y: team === 'away' ? 1.0 - pos.y : pos.y,
    number: pos.number,
    name: '',
    role: pos.role,
    position: pos.position,
    isStarter: true,
    selected: false,
  }))
}

export default FORMATIONS
