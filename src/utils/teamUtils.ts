/**
 * EPL PREDICT - Team Utilities & Dropdown Helpers
 * Centralized team sorting, filtering, and exclusion helpers
 */

import { Team } from '../types';

/**
 * Filter teams eligible for a specific season, sorted alphabetically by official name.
 * If season is 'ALL' or not specified, returns all teams sorted alphabetically.
 * If season is specified (e.g. '2026/27'), returns teams registered for that season.
 */
export function getEligibleTeamsForSeason(teams: Team[], season?: string): Team[] {
  let eligible = [...teams];
  if (season && season !== 'ALL') {
    eligible = eligible.filter((t) => {
      if (t.seasons && Array.isArray(t.seasons) && t.seasons.length > 0) {
        return t.seasons.includes(season);
      }
      if (t.season) {
        return t.season === season;
      }
      return false;
    });
  }
  return eligible.sort((a, b) => a.name.localeCompare(b.name));
}
