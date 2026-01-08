/**
 * Entity Theming Utilities
 * 
 * Centralized configuration for entity-specific colors and branding.
 * This allows easy addition of new entities and consistent theming across all passes.
 */

export interface EntityTheme {
  primaryColor: string
  secondaryColor: string
  headerBgColor: string
  pattern: 'agriculture' | 'water' | 'default'
  label: string
}

/**
 * Entity theme configuration
 * Add new entities here for automatic theming support
 */
export const ENTITY_THEMES: Record<string, EntityTheme> = {
  agriculture: {
    primaryColor: '#00bf63',
    secondaryColor: '#00994f',
    headerBgColor: '#00bf63',
    pattern: 'agriculture',
    label: 'Agriculture Division'
  },
  water: {
    primaryColor: '#00B0F0',
    secondaryColor: '#0099cc',
    headerBgColor: '#00B0F0',
    pattern: 'water',
    label: 'Watergeneration'
  },
  default: {
    primaryColor: '#1800ad',
    secondaryColor: '#12007d',
    headerBgColor: '#1800ad',
    pattern: 'default',
    label: 'Baynunah Group'
  }
}

/**
 * Get entity theme based on entity name
 */
export function getEntityTheme(entityName?: string | null): EntityTheme {
  if (!entityName) return ENTITY_THEMES.default
  
  const nameLower = entityName.toLowerCase()
  
  if (nameLower.includes('agriculture')) {
    return ENTITY_THEMES.agriculture
  }
  
  if (nameLower.includes('water')) {
    return ENTITY_THEMES.water
  }
  
  return ENTITY_THEMES.default
}

/**
 * Get primary color for an entity
 */
export function getEntityColor(entityName?: string | null): string {
  return getEntityTheme(entityName).primaryColor
}

/**
 * Get header background color for an entity
 */
export function getEntityHeaderColor(entityName?: string | null): string {
  return getEntityTheme(entityName).headerBgColor
}

/**
 * Get formatted entity label
 */
export function getEntityLabel(entityName?: string | null): string {
  if (!entityName) return ENTITY_THEMES.default.label
  
  const theme = getEntityTheme(entityName)
  return theme.label
}

/**
 * Get pattern type for entity background decorations
 */
export function getEntityPattern(entityName?: string | null): 'agriculture' | 'water' | 'default' {
  return getEntityTheme(entityName).pattern
}

/**
 * Generate SVG pattern URL for entity background
 */
export function getEntityPatternSvg(entityName?: string | null): string {
  const pattern = getEntityPattern(entityName)
  const color = getEntityColor(entityName)
  // Use replaceAll for complete sanitization (colors only have one #, but this satisfies security checks)
  const colorHex = color.replaceAll('#', '%23')
  
  switch (pattern) {
    case 'agriculture':
      return `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0c8.284 0 15 6.716 15 15 0 8.284-6.716 15-15 15-8.284 0-15-6.716-15-15C15 6.716 21.716 0 30 0zm0 45c8.284 0 15 6.716 15 15H15c0-8.284 6.716-15 15-15z' fill='${colorHex}' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`
    case 'water':
      return `url("data:image/svg+xml,%3Csvg width='52' height='26' viewBox='0 0 52 26' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 10c0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6h2c0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4 3.314 0 6 2.686 6 6 0 2.21 1.79 4 4 4v2c-3.314 0-6-2.686-6-6 0-2.21-1.79-4-4-4-3.314 0-6-2.686-6-6zm25.464-1.95l8.486 8.486-1.414 1.414-8.486-8.486 1.414-1.414z' fill='${colorHex}' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`
    default:
      return `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30L30 0z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`
  }
}
