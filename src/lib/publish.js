import { supabase } from './supabase'
import { generateSlug } from '../utils/slug'

const LINKS_KEY = 'startingxi_published_links'
const MAX_STORED = 20

/**
 * Publish a board state to Supabase as a shareable game day tactic.
 * Returns the slug on success, throws on error.
 */
export async function publishTactic(board) {
  // Strip selection state before saving — viewers shouldn't see selection highlights
  const snapshot = {
    ...board,
    players: board.players.map((p) => ({ ...p, selected: false })),
  }

  // Warn if state is unusually large (>100KB)
  const stateSize = JSON.stringify(snapshot).length
  if (stateSize > 100_000) {
    console.warn(`[publish] Board state is large: ${(stateSize / 1024).toFixed(1)}KB`)
  }

  let slug = generateSlug()

  // Collision check — retry once if slug already exists
  const { data: existing } = await supabase
    .from('game_day_tactics')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (existing) slug = generateSlug()

  const publishedAt = new Date()
  const expiresAt   = new Date(publishedAt)
  expiresAt.setDate(expiresAt.getDate() + 90)

  const { data, error } = await supabase
    .from('game_day_tactics')
    .insert({
      slug,
      name:         board.name,
      match_date:   board.gameDayMeta?.matchDate || null,
      board_state:  snapshot,
      published_at: publishedAt.toISOString(),
      expires_at:   expiresAt.toISOString(),
      is_active:    true,
    })
    .select('slug, name, expires_at')
    .single()

  if (error) throw error

  // Persist to localStorage so owner can manage their links
  saveToLocalStorage({ slug: data.slug, name: data.name, expiresAt: data.expires_at, publishedAt: publishedAt.toISOString() })

  return data.slug
}

/**
 * Deactivate a published link by slug.
 */
export async function deactivateTactic(slug) {
  const { error } = await supabase
    .from('game_day_tactics')
    .update({ is_active: false })
    .eq('slug', slug)

  if (error) throw error
}

/**
 * Fetch current status of a list of slugs (for My Links panel).
 */
export async function fetchTacticStatuses(slugs) {
  if (!slugs.length) return []
  const { data, error } = await supabase
    .from('game_day_tactics')
    .select('slug, name, is_active, expires_at, view_count, published_at')
    .in('slug', slugs)

  if (error) throw error
  return data ?? []
}

// ── localStorage helpers ───────────────────────────────────────────────────

function saveToLocalStorage(entry) {
  try {
    const existing = getStoredLinks()
    const updated  = [entry, ...existing.filter((e) => e.slug !== entry.slug)]
    localStorage.setItem(LINKS_KEY, JSON.stringify(updated.slice(0, MAX_STORED)))
  } catch (_) { /* storage full or unavailable */ }
}

export function getStoredLinks() {
  try {
    return JSON.parse(localStorage.getItem(LINKS_KEY) ?? '[]')
  } catch { return [] }
}
