/**
 * Shared types for Shadowrun character generation components
 *
 * DEPRECATED: Types are now organized in the types/ folder:
 *   - types/api.ts: Server data types (ChargenState, ChargenConstData, *Meta)
 *   - types/ui.ts: Client-only types (DashboardData, Validation*, DerivedStats)
 *
 * This file re-exports everything for backwards compatibility.
 * For new code, prefer importing from the specific file:
 *   import { ChargenState } from './types/api';
 *   import { DashboardData } from './types/ui';
 */

// Re-export all types for backwards compatibility
export * from './types/index';
