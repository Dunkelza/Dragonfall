/**
 * Shadowrun 5e Technomancer System
 *
 * Technomancers are Emerged individuals who can interface with the Matrix
 * using only their minds. They use Resonance instead of Magic.
 *
 * Key Concepts:
 * - Resonance: The technomancer's "magic" attribute
 * - Living Persona: Mental Matrix stats (Attack, Sleaze, Data Processing, Firewall)
 * - Complex Forms: Matrix "spells" powered by Resonance
 * - Sprites: Matrix "spirits" that technomancers can compile
 * - Fading: Drain equivalent for technomancers (resisted with RES + WIL)
 */

/datum/rpg_stat/resonance
	parent_type = /datum/rpg_stat/special
	name = "Resonance"
	desc = "The technomancer's connection to the Matrix. Determines Living Persona stats and complex form power."
	value = 0
	ui_sort_order = 30

	max_value = 6
	min_value = 0

/datum/rpg_stat/resonance/get(mob/living/user, list/out_sources)
	// SR5: Essence loss reduces the maximum attainable Resonance (same as Magic).
	var/base = initial(value) + values_sum(modifiers)
	var/cap = max_value
	if(user?.stats)
		cap = min(cap, user.stats.get_stat_modifier(/datum/rpg_stat/essence))
	return clamp(base, min_value, cap)

// =============================================================================
// COMPLEX FORMS
// =============================================================================

/datum/sr_complex_form
	abstract_type = /datum/sr_complex_form

	var/name = ""
	var/desc = ""
	/// Target type: "self", "device", "persona", "file", "sprite"
	var/target = "device"
	/// Duration: "instant", "sustained", "permanent"
	var/duration = "sustained"
	/// Fading value
	var/fading = 0
	/// Category for organization
	var/category = "attack"
	/// Affects the sort order in TGUI
	var/ui_sort_order = 0

// =============================================================================
// ATTACK COMPLEX FORMS
// =============================================================================

/datum/sr_complex_form/resonance_spike
	name = "Resonance Spike"
	desc = "Direct Matrix damage attack against a persona."
	target = "persona"
	duration = "instant"
	fading = 2
	category = "attack"
	ui_sort_order = 10

/datum/sr_complex_form/derezz
	name = "Derezz"
	desc = "Attempt to crash a target's program or process."
	target = "device"
	duration = "instant"
	fading = 3
	category = "attack"
	ui_sort_order = 20

// =============================================================================
// SLEAZE COMPLEX FORMS
// =============================================================================

/datum/sr_complex_form/puppeteer
	name = "Puppeteer"
	desc = "Make a device perform a single action."
	target = "device"
	duration = "instant"
	fading = 3
	category = "sleaze"
	ui_sort_order = 100

/datum/sr_complex_form/static_veil
	name = "Static Veil"
	desc = "Hide a device's Matrix signature."
	target = "device"
	duration = "sustained"
	fading = 2
	category = "sleaze"
	ui_sort_order = 110

/datum/sr_complex_form/infusion_of_sleaze
	name = "Infusion of Sleaze"
	desc = "Temporarily boost a device's Sleaze attribute."
	target = "device"
	duration = "sustained"
	fading = 2
	category = "sleaze"
	ui_sort_order = 120

// =============================================================================
// DATA PROCESSING COMPLEX FORMS
// =============================================================================

/datum/sr_complex_form/cleaner
	name = "Cleaner"
	desc = "Remove evidence of Matrix actions."
	target = "device"
	duration = "permanent"
	fading = 2
	category = "data"
	ui_sort_order = 200

/datum/sr_complex_form/editor
	name = "Editor"
	desc = "Modify a file without leaving traces."
	target = "file"
	duration = "permanent"
	fading = 2
	category = "data"
	ui_sort_order = 210

/datum/sr_complex_form/infusion_of_data_processing
	name = "Infusion of Data Processing"
	desc = "Temporarily boost a device's Data Processing."
	target = "device"
	duration = "sustained"
	fading = 2
	category = "data"
	ui_sort_order = 220

// =============================================================================
// FIREWALL COMPLEX FORMS
// =============================================================================

/datum/sr_complex_form/diffusion_of_attack
	name = "Diffusion of Attack"
	desc = "Reduce a target's Attack attribute."
	target = "persona"
	duration = "sustained"
	fading = 2
	category = "firewall"
	ui_sort_order = 300

/datum/sr_complex_form/infusion_of_firewall
	name = "Infusion of Firewall"
	desc = "Temporarily boost a device's Firewall."
	target = "device"
	duration = "sustained"
	fading = 2
	category = "firewall"
	ui_sort_order = 310

/datum/sr_complex_form/pulse_storm
	name = "Pulse Storm"
	desc = "Area-effect that disrupts wireless connections."
	target = "self"
	duration = "instant"
	fading = 4
	category = "firewall"
	ui_sort_order = 320

// =============================================================================
// UTILITY COMPLEX FORMS
// =============================================================================

/datum/sr_complex_form/transcendent_grid
	name = "Transcendent Grid"
	desc = "Temporarily switch to a different grid without legal access."
	target = "self"
	duration = "sustained"
	fading = 2
	category = "utility"
	ui_sort_order = 400

/datum/sr_complex_form/resonance_channel
	name = "Resonance Channel"
	desc = "Create a secure, hidden connection between devices."
	target = "device"
	duration = "sustained"
	fading = 3
	category = "utility"
	ui_sort_order = 410

/datum/sr_complex_form/resonance_veil
	name = "Resonance Veil"
	desc = "Make your Living Persona appear as a normal commlink."
	target = "self"
	duration = "sustained"
	fading = 2
	category = "utility"
	ui_sort_order = 420

// =============================================================================
// SPRITES
// =============================================================================

/datum/sr_sprite
	abstract_type = /datum/sr_sprite

	var/name = ""
	var/desc = ""
	/// Specialty: what the sprite excels at
	var/specialty = ""
	/// Available powers
	var/list/powers = list()
	/// Affects the sort order in TGUI
	var/ui_sort_order = 0

/datum/sr_sprite/courier
	name = "Courier Sprite"
	desc = "Specializes in moving data quickly and securely."
	specialty = "Data transfer and encryption."
	powers = list("Cookie", "Hash")
	ui_sort_order = 10

/datum/sr_sprite/crack
	name = "Crack Sprite"
	desc = "Expert at breaking through security."
	specialty = "Bypassing encryption and firewalls."
	powers = list("Suppress", "Camouflage")
	ui_sort_order = 20

/datum/sr_sprite/data
	name = "Data Sprite"
	desc = "Master of information gathering and processing."
	specialty = "Finding and analyzing data."
	powers = list("Browse", "Analyze")
	ui_sort_order = 30

/datum/sr_sprite/fault
	name = "Fault Sprite"
	desc = "Causes glitches and malfunctions in systems."
	specialty = "Disrupting electronic devices."
	powers = list("Electron Storm", "Fault")
	ui_sort_order = 40

/datum/sr_sprite/machine
	name = "Machine Sprite"
	desc = "Interfaces with physical machines and drones."
	specialty = "Controlling devices and vehicles."
	powers = list("Diagnostics", "Gremlins")
	ui_sort_order = 50
