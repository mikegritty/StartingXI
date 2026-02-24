import { v4 as uuidv4 } from 'uuid'

// All positions are normalized 0-1 for the home team (bottom half, y=0.93 is near home goal).
// Away team mirrors vertically: y_away = 1.0 - y_home
// x=0 is left, x=1 is right, y=0 is top, y=1 is bottom

const FORMATIONS = {
  '4-3-3': {
    label: '4-3-3',
    instructions: `Press high as a unit. Wingers cut inside to overload the half-spaces. CDM screens the back four. Full-backs overlap when wingers tuck in. Win the ball high and transition quickly.`,
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
    instructions: `Double pivot protects the back four. No. 10 links play between the lines. Wide players hug the touchline to stretch the opposition. Striker holds the ball up and draws defenders. Compact in defence, quick to press triggers.`,
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
    instructions: `Two banks of four — stay compact and force opponents wide. Midfield pair cover ground; wide midfielders track back. Strikers press in tandem and look to combine in tight spaces. Win second balls in midfield and hit quickly.`,
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
    instructions: `Diamond midfield controls the centre of the pitch. CDM breaks up play; CAM links to the strikers. Full-backs provide width as the diamond is narrow. Overload central areas and use strikers to exploit space in behind.`,
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
    instructions: `Double pivot provides defensive cover. Two CAMs link play in the half-spaces between lines. Paired strikers offer combination play and rotation. Press aggressively from the front as a compact unit.`,
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
    instructions: `Three-man midfield covers wide and central areas. CAM threads passes between lines and connects with the two strikers. Striker partnership offers variety — one holds, one runs. Midfield must press and recover quickly after turnovers.`,
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
    instructions: `Five-man midfield dominates possession and space. Wide midfielders work hard tracking back and forward. Lone striker presses the opposition CBs and holds play up. Overload midfield; release wide men on the break.`,
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
    instructions: `Attacking formation with four forwards causing chaos in the final third. Double pivot must stay disciplined as cover. Full-backs push high. Four forwards rotate positions to confuse markers and exploit space.`,
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
    instructions: `Three centre-backs build from the back with confidence. Wing-backs provide width and overlap for the wingers. Three forwards press aggressively. Compact defensive shape when out of possession — wing-backs drop to form a five.`,
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
    instructions: `Wing-backs are key — they provide width and support both attack and defence. Two attacking midfielders float behind the striker in the half-spaces. Three-back build-up recycles possession patiently. Lone striker presses and holds.`,
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
    instructions: `Wing-backs bomb forward to support two strikers, creating width. Central midfield trio controls the engine room. CBs build patiently out from the back. Two strikers combine — one holds, one makes runs. Defensively, wing-backs tuck in to make a five.`,
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
    instructions: `Solid defensive base with five across the back. Wing-backs push forward when in possession to support the two strikers. Three midfielders cover ground and press quickly. Defend deep as a unit and hit on the counter.`,
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
    instructions: `Ultra-defensive shape with five defenders and four midfielders. Stay extremely compact and deny space. Wing-backs only advance when there is a clear opportunity. Lone striker must be a tireless worker pressing and holding. Counter-attack is the primary threat.`,
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
  // ── New formations ────────────────────────────────────────────────────────
  '4-1-4-1': {
    label: '4-1-4-1',
    instructions: `Single CDM screens the back four. Four midfielders work hard in two pairs. Lone striker presses and holds. Midfield must stay disciplined — no one pushes too far forward without CDM cover. Transition fast when winning the ball.`,
    positions: [
      { role: 'GK',  position: 'GK',  number: 1,  x: 0.50, y: 0.93 },
      { role: 'DEF', position: 'RB',  number: 2,  x: 0.15, y: 0.76 },
      { role: 'DEF', position: 'CB',  number: 5,  x: 0.38, y: 0.79 },
      { role: 'DEF', position: 'CB',  number: 6,  x: 0.62, y: 0.79 },
      { role: 'DEF', position: 'LB',  number: 3,  x: 0.85, y: 0.76 },
      { role: 'MID', position: 'CDM', number: 4,  x: 0.50, y: 0.66 },
      { role: 'MID', position: 'RM',  number: 7,  x: 0.12, y: 0.53 },
      { role: 'MID', position: 'CM',  number: 8,  x: 0.36, y: 0.53 },
      { role: 'MID', position: 'CM',  number: 10, x: 0.64, y: 0.53 },
      { role: 'MID', position: 'LM',  number: 11, x: 0.88, y: 0.53 },
      { role: 'FWD', position: 'ST',  number: 9,  x: 0.50, y: 0.22 },
    ],
  },
  '4-1-3-2': {
    label: '4-1-3-2',
    instructions: `Defensive midfielder shields the back four. Three-man midfield plays with creativity and energy. Two strikers provide combination play and press together. Full-backs join attacks when the CDM holds position.`,
    positions: [
      { role: 'GK',  position: 'GK',  number: 1,  x: 0.50, y: 0.93 },
      { role: 'DEF', position: 'RB',  number: 2,  x: 0.15, y: 0.76 },
      { role: 'DEF', position: 'CB',  number: 5,  x: 0.38, y: 0.79 },
      { role: 'DEF', position: 'CB',  number: 6,  x: 0.62, y: 0.79 },
      { role: 'DEF', position: 'LB',  number: 3,  x: 0.85, y: 0.76 },
      { role: 'MID', position: 'CDM', number: 4,  x: 0.50, y: 0.66 },
      { role: 'MID', position: 'CM',  number: 8,  x: 0.25, y: 0.53 },
      { role: 'MID', position: 'CAM', number: 10, x: 0.50, y: 0.50 },
      { role: 'MID', position: 'CM',  number: 7,  x: 0.75, y: 0.53 },
      { role: 'FWD', position: 'ST',  number: 9,  x: 0.35, y: 0.28 },
      { role: 'FWD', position: 'ST',  number: 11, x: 0.65, y: 0.28 },
    ],
  },
  '4-3-2-1': {
    label: '4-3-2-1',
    instructions: `"Christmas tree" — narrow and compact. Three midfielders win possession; two shadow strikers find pockets of space to combine with the No. 9. Full-backs must overlap to provide width. Overload through the centre and exploit spaces in behind.`,
    positions: [
      { role: 'GK',  position: 'GK',  number: 1,  x: 0.50, y: 0.93 },
      { role: 'DEF', position: 'RB',  number: 2,  x: 0.15, y: 0.76 },
      { role: 'DEF', position: 'CB',  number: 5,  x: 0.38, y: 0.79 },
      { role: 'DEF', position: 'CB',  number: 6,  x: 0.62, y: 0.79 },
      { role: 'DEF', position: 'LB',  number: 3,  x: 0.85, y: 0.76 },
      { role: 'MID', position: 'CM',  number: 4,  x: 0.25, y: 0.64 },
      { role: 'MID', position: 'CM',  number: 8,  x: 0.50, y: 0.64 },
      { role: 'MID', position: 'CM',  number: 7,  x: 0.75, y: 0.64 },
      { role: 'MID', position: 'CAM', number: 10, x: 0.35, y: 0.48 },
      { role: 'MID', position: 'CAM', number: 11, x: 0.65, y: 0.48 },
      { role: 'FWD', position: 'ST',  number: 9,  x: 0.50, y: 0.22 },
    ],
  },
  '3-6-1': {
    label: '3-6-1',
    instructions: `Extremely attacking six-man midfield covers every zone. Three defenders must be comfortable in possession. Wing-midfielders provide width and goals. Lone striker is the focal point — hold play up and feed runners from midfield.`,
    positions: [
      { role: 'GK',  position: 'GK',  number: 1,  x: 0.50, y: 0.93 },
      { role: 'DEF', position: 'CB',  number: 5,  x: 0.27, y: 0.79 },
      { role: 'DEF', position: 'CB',  number: 6,  x: 0.50, y: 0.80 },
      { role: 'DEF', position: 'CB',  number: 4,  x: 0.73, y: 0.79 },
      { role: 'MID', position: 'RWB', number: 2,  x: 0.10, y: 0.60 },
      { role: 'MID', position: 'CM',  number: 8,  x: 0.30, y: 0.57 },
      { role: 'MID', position: 'CDM', number: 14, x: 0.50, y: 0.60 },
      { role: 'MID', position: 'CM',  number: 7,  x: 0.70, y: 0.57 },
      { role: 'MID', position: 'LWB', number: 3,  x: 0.90, y: 0.60 },
      { role: 'MID', position: 'CAM', number: 10, x: 0.50, y: 0.43 },
      { role: 'FWD', position: 'ST',  number: 9,  x: 0.50, y: 0.22 },
    ],
  },
  '5-2-3': {
    label: '5-2-3',
    instructions: `Three forwards press high, disrupting opposition build-up. Two central midfielders work hard in both directions. Defensive five provides security with wing-backs ready to advance. Attack through width and quick transitions.`,
    positions: [
      { role: 'GK',  position: 'GK',  number: 1,  x: 0.50, y: 0.94 },
      { role: 'DEF', position: 'RWB', number: 2,  x: 0.07, y: 0.79 },
      { role: 'DEF', position: 'CB',  number: 5,  x: 0.27, y: 0.79 },
      { role: 'DEF', position: 'CB',  number: 6,  x: 0.50, y: 0.79 },
      { role: 'DEF', position: 'CB',  number: 4,  x: 0.73, y: 0.79 },
      { role: 'DEF', position: 'LWB', number: 3,  x: 0.93, y: 0.79 },
      { role: 'MID', position: 'CM',  number: 8,  x: 0.35, y: 0.60 },
      { role: 'MID', position: 'CM',  number: 10, x: 0.65, y: 0.60 },
      { role: 'FWD', position: 'RW',  number: 7,  x: 0.18, y: 0.35 },
      { role: 'FWD', position: 'ST',  number: 9,  x: 0.50, y: 0.28 },
      { role: 'FWD', position: 'LW',  number: 11, x: 0.82, y: 0.35 },
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
