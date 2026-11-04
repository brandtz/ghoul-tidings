// Display name lives here, in one swappable spot.
export const APP_NAME = 'Ghoul Tidings'

export const CHARACTERS = [
  { key: 'skelly', name: 'Skelly Claus' },
  { key: 'jack', name: "Jack-o'-Scarf" },
  { key: 'twinkle', name: 'Twinkle Ghost' },
  { key: 'zomdeer', name: 'Zom-Deer' },
  { key: 'gingerbones', name: 'Gingerbones' },
  { key: 'elfbat', name: 'Elf Bat' },
  { key: 'franken', name: 'Frankensnowman' },
  { key: 'mummy', name: 'Mummy Wrap' },
  { key: 'cat', name: 'Stocking Cat' },
  { key: 'cracula', name: 'Nut-Cracula' },
  { key: 'witchelf', name: 'Witch-Elf' },
  { key: 'cocoa', name: 'Cocoa Cauldron' },
] as const
export const AVATAR_KEYS = CHARACTERS.map(c => c.key) as string[]
// Hidden avatar. Typing the phrase anywhere unlocks it; it never shows in the normal picker.
export const FROG = { key: 'wednesday', name: 'Wednesday Frog', phrase: 'itiswednesdaymydudes' }
export const JOINABLE_AVATAR_KEYS = [...AVATAR_KEYS, FROG.key]

export const TEAM_COLORS = [
  { key: 'pumpkin', name: 'Pumpkin', hex: '#FF8A2A', pattern: 'Diagonal stripes' },
  { key: 'violet', name: 'Witch violet', hex: '#A67CFF', pattern: 'Dots' },
  { key: 'slime', name: 'Slime', hex: '#8FE05A', pattern: 'Zigzag' },
  { key: 'frost', name: 'Frost', hex: '#6CC4FF', pattern: 'Snowflakes' },
  { key: 'holly', name: 'Holly red', hex: '#FF5A5F', pattern: 'Holly leaves' },
  { key: 'gold', name: 'Gold', hex: '#F5C542', pattern: 'Stars' },
  { key: 'peppermint', name: 'Peppermint', hex: '#FF8FC7', pattern: 'Candy-cane stripes' },
  { key: 'pine', name: 'Pine', hex: '#36B37E', pattern: 'Tiny trees' },
  { key: 'silver', name: 'Moon silver', hex: '#C9D2E3', pattern: 'Crescent moons' },
  { key: 'cocoa', name: 'Cocoa', hex: '#C08A5B', pattern: 'Little bones' },
] as const
export const teamHex = (key?: string | null) => TEAM_COLORS.find(c => c.key === key)?.hex ?? '#9AA3B2'

export const REACTIONS = ['pumpkin', 'snowflake', 'ghost', 'bell', 'skelly', 'heart'] as const
export const REACTION_ICON: Record<string, string> = {
  pumpkin: '🎃', snowflake: '❄️', ghost: '👻', bell: '🔔', skelly: '💀', heart: '❤️',
}
export const ANSWER_IDS = [
  { letter: 'A', name: 'Moon', color: '#A67CFF', ink: '#140A24' },
  { letter: 'B', name: 'Pumpkin', color: '#FF9A3D', ink: '#140A05' },
  { letter: 'C', name: 'Snowflake', color: '#7FB7E8', ink: '#0B1020' },
  { letter: 'D', name: 'Bell', color: '#F2C14E', ink: '#1A1204' },
] as const
export const KONAMI = ['↑', '↑', '↓', '↓', '←', '→', '←', '→', 'B', 'A']
