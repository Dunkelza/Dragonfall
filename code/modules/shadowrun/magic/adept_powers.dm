/**
 * Shadowrun 5e Adept Powers
 *
 * Adepts channel magic internally to enhance their physical abilities.
 * Powers cost Power Points (PP), and adepts get PP equal to their Magic rating.
 *
 * Power costs are listed in quarter-PP increments (0.25, 0.5, 0.75, 1.0, etc.)
 */

/datum/sr_adept_power
	abstract_type = /datum/sr_adept_power

	var/name = ""
	var/desc = ""
	/// Cost in Power Points (can be decimal like 0.25, 0.5)
	var/pp_cost = 1.0
	/// Can this power have multiple levels?
	var/has_levels = FALSE
	/// Maximum levels if applicable
	var/max_levels = 1
	/// Category for organization
	var/category = "physical"
	/// Affects the sort order in TGUI
	var/ui_sort_order = 0

// =============================================================================
// PHYSICAL ENHANCEMENT POWERS
// =============================================================================

/datum/sr_adept_power/improved_reflexes
	name = "Improved Reflexes"
	desc = "+1 Reaction and +1 Initiative Die per level. Maximum 3 levels."
	pp_cost = 1.5
	has_levels = TRUE
	max_levels = 3
	category = "physical"
	ui_sort_order = 10

/datum/sr_adept_power/improved_physical_attribute
	name = "Improved Physical Attribute"
	desc = "+1 to a physical attribute (BOD, AGI, REA, STR). Can exceed natural max by 4."
	pp_cost = 1.0
	has_levels = TRUE
	max_levels = 4
	category = "physical"
	ui_sort_order = 20

/datum/sr_adept_power/critical_strike
	name = "Critical Strike"
	desc = "+1 DV to unarmed attacks per level."
	pp_cost = 0.5
	has_levels = TRUE
	max_levels = 4
	category = "physical"
	ui_sort_order = 30

/datum/sr_adept_power/killing_hands
	name = "Killing Hands"
	desc = "Unarmed attacks deal Physical damage instead of Stun."
	pp_cost = 0.5
	has_levels = FALSE
	max_levels = 1
	category = "physical"
	ui_sort_order = 40

/datum/sr_adept_power/mystic_armor
	name = "Mystic Armor"
	desc = "+1 armor per level. Stacks with worn armor."
	pp_cost = 0.5
	has_levels = TRUE
	max_levels = 4
	category = "physical"
	ui_sort_order = 50

/datum/sr_adept_power/pain_resistance
	name = "Pain Resistance"
	desc = "Ignore 1 box of damage wound modifiers per level."
	pp_cost = 0.5
	has_levels = TRUE
	max_levels = 6
	category = "physical"
	ui_sort_order = 60

// =============================================================================
// MOVEMENT POWERS
// =============================================================================

/datum/sr_adept_power/wall_running
	name = "Wall Running"
	desc = "Run along vertical surfaces for short distances."
	pp_cost = 0.5
	has_levels = FALSE
	max_levels = 1
	category = "movement"
	ui_sort_order = 100

/datum/sr_adept_power/light_body
	name = "Light Body"
	desc = "Reduce effective falling distance per level."
	pp_cost = 0.25
	has_levels = TRUE
	max_levels = 4
	category = "movement"
	ui_sort_order = 110

/datum/sr_adept_power/rapid_draw
	name = "Rapid Draw"
	desc = "Draw a weapon as a Free Action."
	pp_cost = 0.5
	has_levels = FALSE
	max_levels = 1
	category = "movement"
	ui_sort_order = 120

/datum/sr_adept_power/great_leap
	name = "Great Leap"
	desc = "+1m to jumping distance per level."
	pp_cost = 0.25
	has_levels = TRUE
	max_levels = 4
	category = "movement"
	ui_sort_order = 130

/datum/sr_adept_power/sprint
	name = "Sprint"
	desc = "+1m to running distance per hit on Athletics tests."
	pp_cost = 0.25
	has_levels = TRUE
	max_levels = 3
	category = "movement"
	ui_sort_order = 140

// =============================================================================
// SENSORY POWERS
// =============================================================================

/datum/sr_adept_power/improved_sense
	name = "Improved Sense"
	desc = "Gain an enhanced sense (low-light, thermographic, etc.)"
	pp_cost = 0.25
	has_levels = FALSE
	max_levels = 1
	category = "sensory"
	ui_sort_order = 200

/datum/sr_adept_power/astral_perception
	name = "Astral Perception"
	desc = "Perceive the astral plane at will."
	pp_cost = 1.0
	has_levels = FALSE
	max_levels = 1
	category = "sensory"
	ui_sort_order = 210

/datum/sr_adept_power/danger_sense
	name = "Danger Sense"
	desc = "+1 die to surprise tests per level."
	pp_cost = 0.5
	has_levels = TRUE
	max_levels = 4
	category = "sensory"
	ui_sort_order = 220

/datum/sr_adept_power/enhanced_perception
	name = "Enhanced Perception"
	desc = "+1 die to Perception tests per level."
	pp_cost = 0.5
	has_levels = TRUE
	max_levels = 3
	category = "sensory"
	ui_sort_order = 230

// =============================================================================
// SKILL ENHANCEMENT POWERS
// =============================================================================

/datum/sr_adept_power/improved_ability
	name = "Improved Ability"
	desc = "+1 rating to one Combat, Physical, or Social skill per level."
	pp_cost = 0.5
	has_levels = TRUE
	max_levels = 4
	category = "skill"
	ui_sort_order = 300

/datum/sr_adept_power/kinesics
	name = "Kinesics"
	desc = "+1 die to social tests and +1 to resist social attacks per level."
	pp_cost = 0.25
	has_levels = TRUE
	max_levels = 4
	category = "skill"
	ui_sort_order = 310

/datum/sr_adept_power/linguistics
	name = "Linguistics"
	desc = "Learn languages faster. +2 dice to language tests."
	pp_cost = 0.25
	has_levels = FALSE
	max_levels = 1
	category = "skill"
	ui_sort_order = 320

/datum/sr_adept_power/voice_control
	name = "Voice Control"
	desc = "Perfect control over your voice. +1 die to voice-based tests per level."
	pp_cost = 0.25
	has_levels = TRUE
	max_levels = 3
	category = "skill"
	ui_sort_order = 330

// =============================================================================
// COMBAT POWERS
// =============================================================================

/datum/sr_adept_power/combat_sense
	name = "Combat Sense"
	desc = "+1 die to defense tests per level."
	pp_cost = 0.5
	has_levels = TRUE
	max_levels = 4
	category = "combat"
	ui_sort_order = 400

/datum/sr_adept_power/counterstrike
	name = "Counterstrike"
	desc = "Gain a free melee attack after successful defense."
	pp_cost = 0.5
	has_levels = FALSE
	max_levels = 1
	category = "combat"
	ui_sort_order = 410

/datum/sr_adept_power/nerve_strike
	name = "Nerve Strike"
	desc = "Unarmed attack can temporarily disable a limb."
	pp_cost = 1.0
	has_levels = FALSE
	max_levels = 1
	category = "combat"
	ui_sort_order = 420

/datum/sr_adept_power/penetrating_strike
	name = "Penetrating Strike"
	desc = "Unarmed attacks ignore armor per level."
	pp_cost = 0.5
	has_levels = TRUE
	max_levels = 4
	category = "combat"
	ui_sort_order = 430

// =============================================================================
// MISCELLANEOUS POWERS
// =============================================================================

/datum/sr_adept_power/traceless_walk
	name = "Traceless Walk"
	desc = "Leave no footprints or physical traces when walking."
	pp_cost = 1.0
	has_levels = FALSE
	max_levels = 1
	category = "miscellaneous"
	ui_sort_order = 500

/datum/sr_adept_power/eidetic_sense_memory
	name = "Eidetic Sense Memory"
	desc = "Perfect recall of sensory information."
	pp_cost = 0.5
	has_levels = FALSE
	max_levels = 1
	category = "miscellaneous"
	ui_sort_order = 510

/datum/sr_adept_power/metabolic_control
	name = "Metabolic Control"
	desc = "Control body temperature, breathing, and heartbeat."
	pp_cost = 0.5
	has_levels = FALSE
	max_levels = 1
	category = "miscellaneous"
	ui_sort_order = 520

/datum/sr_adept_power/melanin_control
	name = "Melanin Control"
	desc = "Change skin/hair/eye color at will."
	pp_cost = 0.5
	has_levels = FALSE
	max_levels = 1
	category = "miscellaneous"
	ui_sort_order = 530
