import { v4 as uuidv4 } from 'uuid'

// All positions are normalized 0-1 for the home team (bottom half, y=0.93 is near home goal).
// Away team mirrors vertically: y_away = 1.0 - y_home
// x=0 is left, x=1 is right, y=0 is top, y=1 is bottom

const FORMATIONS = {
  '4-3-3': {
    label: '4-3-3',
    positions: [
      { role: 'GK',  position: 'GK',  number: 1,  x: 0.50, y: 0.93 },
      { role: 'DEF', position: 'RB',  number: 2,  x: 0.15, y: 0.75 },
      { role: 'DEF', position: 'CB',  number: 5,  x: 0.38, y: 0.78 },
      { role: 'DEF', position: 'CB',  number: 6,  x: 0.62, y: 0.78 },
      { role: 'DEF', position: 'LB',  number: 3,  x: 0.85, y: 0.75 },
      { role: 'MID', position: 'CM',  number: 8,  x: 0.25, y: 0.55 },
      { role: 'MID', position: 'CDM', number: 4,  x: 0.50, y: 0.52 },
      { role: 'MID', position: 'CM',  number: 10, x: 0.75, y: 0.55 },
      { role: 'FWD', position: 'LW',  number: 11, x: 0.20, y: 0.25 },
      { role: 'FWD', position: 'ST',  number: 9,  x: 0.50, y: 0.20 },
      { role: 'FWD', position: 'RW',  number: 7,  x: 0.80, y: 0.25 },
    ],
  },
  '4-2-3-1': {
    label: '4-2-3-1',
    positions: [
      { role: 'GK',  position: 'GK',  number: 1,  x: 0.50, y: 0.93 },
      { role: 'DEF', position: 'RB',  number: 2,  x: 0.15, y: 0.75 },
      { role: 'DEF', position: 'CB',  number: 5,  x: 0.38, y: 0.78 },
      { role: 'DEF', position: 'CB',  number: 6,  x: 0.62, y: 0.78 },
      { role: 'DEF', position: 'LB',  number: 3,  x: 0.85, y: 0.75 },
      { role: 'MID', position: 'CDM', number: 4,  x: 0.35, y: 0.60 },
      { role: 'MID', position: 'CDM', number: 8,  x: 0.65, y: 0.60 },
      { role: 'MID', position: 'RW',  number: 7,  x: 0.18, y: 0.42 },
      { role: 'MID', position: 'CAM', number: 10, x: 0.50, y: 0.40 },
      { role: 'MID', position: 'LW',  number: 11, x: 0.82, y: 0.42 },
      { role: 'FWD', position: 'ST',  number: 9,  x: 0.50, y: 0.20 },
    ],
  },
  '4-4-2': {
    label: '4-4-2',
    positions: [
      { role: 'GK',  position: 'GK',  number: 1,  x: 0.50, y: 0.93 },
      { role: 'DEF', position: 'RB',  number: 2,  x: 0.15, y: 0.75 },
      { role: 'DEF', position: 'CB',  number: 5,  x: 0.38, y: 0.78 },
      { role: 'DEF', position: 'CB',  number: 6,  x: 0.62, y: 0.78 },
      { role: 'DEF', position: 'LB',  number: 3,  x: 0.85, y: 0.75 },
      { role: 'MID', position: 'RM',  number: 7,  x: 0.15, y: 0.55 },
      { role: 'MID', position: 'CM',  number: 8,  x: 0.38, y: 0.55 },
      { role: 'MID', position: 'CM',  number: 4,  x: 0.62, y: 0.55 },
      { role: 'MID', position: 'LM',  number: 11, x: 0.85, y: 0.55 },
      { role: 'FWD', position: 'ST',  number: 9,  x: 0.35, y: 0.25 },
      { role: 'FWD', position: 'ST',  number: 10, x: 0.65, y: 0.25 },
    ],
  },
  '4-4-2-diamond': {
    label: '4-4-2 Diamond',
    positions: [
      { role: 'GK',  position: 'GK',  number: 1,  x: 0.50, y: 0.94 },
      { role: 'DEF', position: 'RB',  number: 2,  x: 0.18, y: 0.78 },
      { role: 'DEF', position: 'CB',  number: 5,  x: 0.38, y: 0.78 },
      { role: 'DEF', position: 'CB',  number: 6,  x: 0.62, y: 0.78 },
      { role: 'DEF', position: 'LB',  number: 3,  x: 0.82, y: 0.78 },
      { role: 'MID', position: 'CDM', number: 4,  x: 0.50, y: 0.65 },
      { role: 'MID', position: 'CM',  number: 8,  x: 0.25, y: 0.54 },
      { role: 'MID', position: 'CM',  number: 7,  x: 0.75, y: 0.54 },
      { role: 'MID', position: 'CAM', number: 10, x: 0.50, y: 0.44 },
      { role: 'FWD', position: 'ST',  number: 9,  x: 0.37, y: 0.33 },
      { role: 'FWD', position: 'ST',  number: 11, x: 0.63, y: 0.33 },
    ],
  },
  '4-2-2-2': {
    label: '4-2-2-2',
    positions: [
      { role: 'GK',  position: 'GK',  number: 1,  x: 0.50, y: 0.94 },
      { role: 'DEF', position: 'RB',  number: 2,  x: 0.18, y: 0.79 },
      { role: 'DEF', position: 'CB',  number: 5,  x: 0.38, y: 0.79 },
      { role: 'DEF', position: 'CB',  number: 6,  x: 0.62, y: 0.79 },
      { role: 'DEF', position: 'LB',  number: 3,  x: 0.82, y: 0.79 },
      { role: 'MID', position: 'CDM', number: 4,  x: 0.38, y: 0.65 },
      { role: 'MID', position: 'CDM', number: 8,  x: 0.62, y: 0.65 },
      { role: 'MID', position: 'CAM', number: 10, x: 0.30, y: 0.51 },
      { role: 'MID', position: 'CAM', number: 7,  x: 0.70, y: 0.51 },
      { role: 'FWD', position: 'ST',  number: 9,  x: 0.37, y: 0.37 },
      { role: 'FWD', position: 'ST',  number: 11, x: 0.63, y: 0.37 },
    ],
  },
  '4-3-1-2': {
    label: '4-3-1-2',
    positions: [
      { role: 'GK',  position: 'GK',  number: 1,  x: 0.50, y: 0.94 },
      { role: 'DEF', position: 'RB',  number: 2,  x: 0.18, y: 0.79 },
      { role: 'DEF', position: 'CB',  number: 5,  x: 0.38, y: 0.79 },
      { role: 'DEF', position: 'CB',  number: 6,  x: 0.62, y: 0.79 },
      { role: 'DEF', position: 'LB',  number: 3,  x: 0.82, y: 0.79 },
      { role: 'MID', position: 'CM',  number: 4,  x: 0.25, y: 0.64 },
      { role: 'MID', position: 'CM',  number: 8,  x: 0.50, y: 0.64 },
      { role: 'MID', position: 'CM',  number: 7,  x: 0.75, y: 0.64 },
      { role: 'MID', position: 'CAM', number: 10, x: 0.50, y: 0.50 },
      { role: 'FWD', position: 'ST',  number: 9,  x: 0.37, y: 0.36 },
      { role: 'FWD', position: 'ST',  number: 11, x: 0.63, y: 0.36 },
    ],
  },
  '4-5-1': {
    label: '4-5-1',
    positions: [
      { role: 'GK',  position: 'GK',  number: 1,  x: 0.50, y: 0.93 },
      { role: 'DEF', position: 'RB',  number: 2,  x: 0.15, y: 0.75 },
      { role: 'DEF', position: 'CB',  number: 5,  x: 0.38, y: 0.78 },
      { role: 'DEF', position: 'CB',  number: 6,  x: 0.62, y: 0.78 },
      { role: 'DEF', position: 'LB',  number: 3,  x: 0.85, y: 0.75 },
      { role: 'MID', position: 'RM',  number: 7,  x: 0.10, y: 0.55 },
      { role: 'MID', position: 'CM',  number: 8,  x: 0.30, y: 0.52 },
      { role: 'MID', position: 'CDM', number: 4,  x: 0.50, y: 0.50 },
      { role: 'MID', position: 'CM',  number: 10, x: 0.70, y: 0.52 },
      { role: 'MID', position: 'LM',  number: 11, x: 0.90, y: 0.55 },
      { role: 'FWD', position: 'ST',  number: 9,  x: 0.50, y: 0.22 },
    ],
  },
  '4-2-4': {
    label: '4-2-4',
    positions: [
      { role: 'GK',  position: 'GK',  number: 1,  x: 0.50, y: 0.94 },
      { role: 'DEF', position: 'RB',  number: 2,  x: 0.18, y: 0.79 },
      { role: 'DEF', position: 'CB',  number: 5,  x: 0.38, y: 0.79 },
      { role: 'DEF', position: 'CB',  number: 6,  x: 0.62, y: 0.79 },
      { role: 'DEF', position: 'LB',  number: 3,  x: 0.82, y: 0.79 },
      { role: 'MID', position: 'CDM', number: 4,  x: 0.38, y: 0.63 },
      { role: 'MID', position: 'CDM', number: 8,  x: 0.62, y: 0.63 },
      { role: 'FWD', position: 'RW',  number: 7,  x: 0.12, y: 0.44 },
      { role: 'FWD', position: 'ST',  number: 9,  x: 0.37, y: 0.44 },
      { role: 'FWD', position: 'ST',  number: 10, x: 0.63, y: 0.44 },
      { role: 'FWD', position: 'LW',  number: 11, x: 0.88, y: 0.44 },
    ],
  },
  '3-4-3': {
    label: '3-4-3',
    positions: [
      { role: 'GK',  position: 'GK',  number: 1,  x: 0.50, y: 0.93 },
      { role: 'DEF', position: 'CB',  number: 5,  x: 0.28, y: 0.78 },
      { role: 'DEF', position: 'CB',  number: 6,  x: 0.50, y: 0.80 },
      { role: 'DEF', position: 'CB',  number: 4,  x: 0.72, y: 0.78 },
      { role: 'MID', position: 'RM',  number: 2,  x: 0.15, y: 0.55 },
      { role: 'MID', position: 'CM',  number: 8,  x: 0.38, y: 0.55 },
      { role: 'MID', position: 'CM',  number: 10, x: 0.62, y: 0.55 },
      { role: 'MID', position: 'LM',  number: 3,  x: 0.85, y: 0.55 },
      { role: 'FWD', position: 'RW',  number: 7,  x: 0.20, y: 0.25 },
      { role: 'FWD', position: 'ST',  number: 9,  x: 0.50, y: 0.20 },
      { role: 'FWD', position: 'LW',  number: 11, x: 0.80, y: 0.25 },
    ],
  },
  '3-4-2-1': {
    label: '3-4-2-1',
    positions: [
      { role: 'GK',  position: 'GK',  number: 1,  x: 0.50, y: 0.94 },
      { role: 'DEF', position: 'CB',  number: 5,  x: 0.27, y: 0.79 },
      { role: 'DEF', position: 'CB',  number: 6,  x: 0.50, y: 0.79 },
      { role: 'DEF', position: 'CB',  number: 4,  x: 0.73, y: 0.79 },
      { role: 'MID', position: 'RWB', number: 2,  x: 0.12, y: 0.64 },
      { role: 'MID', position: 'CM',  number: 8,  x: 0.35, y: 0.64 },
      { role: 'MID', position: 'CM',  number: 10, x: 0.65, y: 0.64 },
      { role: 'MID', position: 'LWB', number: 3,  x: 0.88, y: 0.64 },
      { role: 'MID', position: 'CAM', number: 7,  x: 0.35, y: 0.50 },
      { role: 'MID', position: 'CAM', number: 11, x: 0.65, y: 0.50 },
      { role: 'FWD', position: 'ST',  number: 9,  x: 0.50, y: 0.36 },
    ],
  },
  '3-5-2': {
    label: '3-5-2',
    positions: [
      { role: 'GK',  position: 'GK',  number: 1,  x: 0.50, y: 0.93 },
      { role: 'DEF', position: 'CB',  number: 5,  x: 0.28, y: 0.78 },
      { role: 'DEF', position: 'CB',  number: 6,  x: 0.50, y: 0.80 },
      { role: 'DEF', position: 'CB',  number: 4,  x: 0.72, y: 0.78 },
      { role: 'MID', position: 'RWB', number: 2,  x: 0.10, y: 0.55 },
      { role: 'MID', position: 'CM',  number: 8,  x: 0.30, y: 0.52 },
      { role: 'MID', position: 'CM',  number: 10, x: 0.50, y: 0.50 },
      { role: 'MID', position: 'CM',  number: 7,  x: 0.70, y: 0.52 },
      { role: 'MID', position: 'LWB', number: 3,  x: 0.90, y: 0.55 },
      { role: 'FWD', position: 'ST',  number: 9,  x: 0.35, y: 0.25 },
      { role: 'FWD', position: 'ST',  number: 11, x: 0.65, y: 0.25 },
    ],
  },
  '5-3-2': {
    label: '5-3-2',
    positions: [
      { role: 'GK',  position: 'GK',  number: 1,  x: 0.50, y: 0.94 },
      { role: 'DEF', position: 'RWB', number: 2,  x: 0.06, y: 0.79 },
      { role: 'DEF', position: 'CB',  number: 5,  x: 0.27, y: 0.79 },
      { role: 'DEF', position: 'CB',  number: 6,  x: 0.50, y: 0.79 },
      { role: 'DEF', position: 'CB',  number: 4,  x: 0.73, y: 0.79 },
      { role: 'DEF', position: 'LWB', number: 3,  x: 0.94, y: 0.79 },
      { role: 'MID', position: 'CM',  number: 8,  x: 0.25, y: 0.62 },
      { role: 'MID', position: 'CM',  number: 10, x: 0.50, y: 0.62 },
      { role: 'MID', position: 'CM',  number: 7,  x: 0.75, y: 0.62 },
      { role: 'FWD', position: 'ST',  number: 9,  x: 0.37, y: 0.44 },
      { role: 'FWD', position: 'ST',  number: 11, x: 0.63, y: 0.44 },
    ],
  },
  '5-4-1': {
    label: '5-4-1',
    positions: [
      { role: 'GK',  position: 'GK',  number: 1,  x: 0.50, y: 0.94 },
      { role: 'DEF', position: 'RWB', number: 2,  x: 0.06, y: 0.79 },
      { role: 'DEF', position: 'CB',  number: 5,  x: 0.27, y: 0.79 },
      { role: 'DEF', position: 'CB',  number: 6,  x: 0.50, y: 0.79 },
      { role: 'DEF', position: 'CB',  number: 4,  x: 0.73, y: 0.79 },
      { role: 'DEF', position: 'LWB', number: 3,  x: 0.94, y: 0.79 },
      { role: 'MID', position: 'RM',  number: 7,  x: 0.18, y: 0.62 },
      { role: 'MID', position: 'CM',  number: 8,  x: 0.38, y: 0.62 },
      { role: 'MID', position: 'CM',  number: 10, x: 0.62, y: 0.62 },
      { role: 'MID', position: 'LM',  number: 11, x: 0.82, y: 0.62 },
      { role: 'FWD', position: 'ST',  number: 9,  x: 0.50, y: 0.44 },
    ],
  },
}

/**
 * The 6 most common formations shown as quick-pick chips.
 * The rest appear in the "More formations…" dropdown.
 */
export const QUICK_FORMATIONS = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '3-4-3', '4-5-1']

/**
 * Infers a role from jersey number using common football conventions.
 */
export function roleFromNumber(number) {
  if (number === 1) return 'GK'
  if (number >= 2 && number <= 6) return 'DEF'
  if (number >= 7 && number <= 8) return 'MID'
  if (number === 9) return 'FWD'
  if (number === 10) return 'MID'
  if (number === 11) return 'FWD'
  if (number >= 12 && number <= 20) return 'DEF'
  if (number >= 21 && number <= 25) return 'MID'
  return 'FWD'
}

/**
 * Builds an array of 11 player objects for a given formation and team.
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
