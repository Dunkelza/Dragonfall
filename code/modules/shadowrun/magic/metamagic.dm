/**
 * Shadowrun 5e Metamagic Techniques
 *
 * Metamagic represents advanced magical techniques learned through initiation.
 * Awakened characters can initiate to increase their Magic rating beyond 6
 * and learn metamagic techniques.
 *
 * At chargen, characters with Magic priority A or B may optionally start
 * as initiated (Grade 1) and select one metamagic technique.
 */

/datum/sr_metamagic
	abstract_type = /datum/sr_metamagic

	var/name = ""
	var/desc = ""
	/// Brief mechanical description
	var/effect = ""
	/// Category: "general", "adept", "spellcaster"
	var/category = "general"
	/// Which awakened types can take this: "all", "magician", "adept", "mystic_adept"
	var/available_to = "all"
	/// Sort order in UI
	var/ui_sort_order = 0

// =============================================================================
// GENERAL METAMAGIC - Available to all Awakened
// =============================================================================

/datum/sr_metamagic/centering
	name = "Centering"
	desc = "Use a centering skill to reduce penalties from wounds, sustained spells, or other modifiers."
	effect = "Add your initiate grade as dice to resist drain or offset negative modifiers when using a centering action."
	category = "general"
	available_to = "all"
	ui_sort_order = 10

/datum/sr_metamagic/shielding
	name = "Shielding"
	desc = "Protect yourself and others from hostile magic."
	effect = "Spend a Free Action to add your initiate grade to spell defense for yourself or an ally."
	category = "general"
	available_to = "all"
	ui_sort_order = 20

/datum/sr_metamagic/masking
	name = "Masking"
	desc = "Hide your magical nature from astral observation."
	effect = "Your aura appears mundane or as a lower Magic rating. Add initiate grade to disguise attempts."
	category = "general"
	available_to = "all"
	ui_sort_order = 30

/datum/sr_metamagic/flexible_signature
	name = "Flexible Signature"
	desc = "Alter your astral signature to avoid identification."
	effect = "You can modify your astral signature, making it harder to track your magical activities."
	category = "general"
	available_to = "all"
	ui_sort_order = 40

/datum/sr_metamagic/quickening
	name = "Quickening"
	desc = "Make a sustained spell permanent by binding it with Karma."
	effect = "Spend Karma to make a sustained spell permanent. The spell no longer needs concentration."
	category = "general"
	available_to = "all"
	ui_sort_order = 50

// =============================================================================
// SPELLCASTER METAMAGIC
// =============================================================================

/datum/sr_metamagic/anchoring
	name = "Anchoring"
	desc = "Attach a spell to a focus or location for later activation."
	effect = "Create spell anchors that trigger under specific conditions."
	category = "spellcaster"
	available_to = "magician"
	ui_sort_order = 100

/datum/sr_metamagic/spell_shaping
	name = "Spell Shaping"
	desc = "Modify area spells to exclude allies or specific targets."
	effect = "When casting area spells, exclude a number of targets equal to your initiate grade."
	category = "spellcaster"
	available_to = "magician"
	ui_sort_order = 110

/datum/sr_metamagic/reflection
	name = "Reflection"
	desc = "Turn hostile spells back on their casters."
	effect = "When successfully defending against a spell, you may reflect it back at the caster."
	category = "spellcaster"
	available_to = "magician"
	ui_sort_order = 120

/datum/sr_metamagic/absorption
	name = "Absorption"
	desc = "Absorb magical energy from incoming spells."
	effect = "Convert some or all of the Force of an incoming spell into healing or mana recovery."
	category = "spellcaster"
	available_to = "magician"
	ui_sort_order = 130

/datum/sr_metamagic/fixation
	name = "Fixation"
	desc = "Sustain spells without concentration."
	effect = "Lock a sustained spell in place. It continues without sustaining penalties until dispelled."
	category = "spellcaster"
	available_to = "magician"
	ui_sort_order = 140

// =============================================================================
// ADEPT METAMAGIC
// =============================================================================

/datum/sr_metamagic/adept_centering
	name = "Adept Centering"
	desc = "Channel inner focus to overcome physical penalties."
	effect = "Use a centering action to add initiate grade dice to Physical tests or offset wound modifiers."
	category = "adept"
	available_to = "adept"
	ui_sort_order = 200

/datum/sr_metamagic/power_point
	name = "Power Point"
	desc = "Gain additional Power Points through initiation."
	effect = "Gain 0.25 additional Power Points. Can be taken multiple times (once per initiation)."
	category = "adept"
	available_to = "adept"
	ui_sort_order = 210

/datum/sr_metamagic/somatic_control
	name = "Somatic Control"
	desc = "Exert extraordinary control over your body's functions."
	effect = "Control pain, heartbeat, breathing. Add initiate grade to resist toxins, diseases, and interrogation."
	category = "adept"
	available_to = "adept"
	ui_sort_order = 220

/datum/sr_metamagic/penetrating_strike
	name = "Penetrating Strike"
	desc = "Your unarmed strikes can bypass magical and physical armor."
	effect = "Ignore points of armor equal to your initiate grade on unarmed attacks."
	category = "adept"
	available_to = "adept"
	ui_sort_order = 230

/datum/sr_metamagic/iron_will
	name = "Iron Will"
	desc = "Fortify your mind against mental intrusion."
	effect = "Add initiate grade dice to resist mental manipulation, possession, and mind magic."
	category = "adept"
	available_to = "adept"
	ui_sort_order = 240

// =============================================================================
// ADVANCED METAMAGIC - Higher initiation requirements
// =============================================================================

/datum/sr_metamagic/invoking
	name = "Invoking"
	desc = "Call upon the raw power of your tradition's source."
	effect = "Invoke your tradition's source for a massive but dangerous surge of magical power."
	category = "general"
	available_to = "all"
	ui_sort_order = 300

/datum/sr_metamagic/astral_bluff
	name = "Astral Bluff"
	desc = "Project false information through your aura."
	effect = "Actively project false emotional or magical information to those assensing you."
	category = "general"
	available_to = "all"
	ui_sort_order = 310

/datum/sr_metamagic/divining
	name = "Divining"
	desc = "Read the threads of fate and possibility."
	effect = "Perform divination rituals to gain insight into future events or hidden truths."
	category = "general"
	available_to = "all"
	ui_sort_order = 320

// =============================================================================
// UTILITY PROCS
// =============================================================================

/// Global list of metamagic techniques, built lazily
GLOBAL_LIST_EMPTY(sr_metamagics)

/// Gets the metamagic list, building it on first access if needed
/proc/get_sr_metamagics()
	if(!length(GLOB.sr_metamagics))
		populate_sr_metamagics()
	return GLOB.sr_metamagics

/// Populates the metamagic list
/proc/populate_sr_metamagics()
	if(length(GLOB.sr_metamagics))
		return
	for(var/mm_path in subtypesof(/datum/sr_metamagic))
		var/datum/sr_metamagic/M = new mm_path
		if(!M.name)
			qdel(M)
			continue
		GLOB.sr_metamagics["[mm_path]"] = M
