#define CRIT_FAILURE -1
#define FAILURE 0
#define SUCCESS 1
#define CRIT_SUCCESS 2

// Skill sources
#define SKILL_SOURCE_COMBAT_MODE "Prepared to fight"
/// Confusion status effect.
#define SKILL_SOURCE_CONFUSION "Confused"
/// Knockdown status effect
#define SKILL_SOURCE_FLOORED "Knocked down"
/// Blind
#define SKILL_SOURCE_BLINDNESS "Blind"
/// Clumsy
#define SKILL_SOURCE_CLUMSY "Clumsy"
/// Overcome witnessing a death
#define SKILL_SOURCE_DEATH_RESOLVE "Overcome witnessing a death"
/// Witness a death
#define SKILL_SOURCE_WITNESS_DEATH "Witnessed a death"
/// Have nicotine in your blood
#define SKILL_SOURCE_NICOTINE "Nicotine"
/// Have a nicotine withdrawl
#define SKILL_SOURCE_NICOTINE_WITHDRAWL "Nicotine withdrawl"
/// Opiod Withdrawl
#define SKILL_SOURCE_OPIOD_WITHDRAWL "Opiod withdrawl"
/// Alchohol withdrawl
#define SKILL_SOURCE_ALCHOHOL_WITHDRAWL "Alchohol withdrawl"

// Shadowrun 5e-style dice pools.
// Dice pools and attribute/skill ratings use 0 as the neutral baseline.
#define STATS_BASELINE_VALUE 0
/// Soft cap used for scaling helpers. Dice pools can exceed this, but UI/scalars clamp.
#define STATS_MAXIMUM_VALUE 20
/// Minimum rating/pool.
#define STATS_MINIMUM_VALUE 0
