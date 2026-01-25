/**
 * Shadowrun 5e Spells
 *
 * Mages can learn spells based on their Magic priority.
 * At chargen, mages get Magic Rating × 2 free spells.
 *
 * Spells are categorized by type:
 * - Combat: Direct damage spells
 * - Detection: Sensing and awareness spells
 * - Health: Healing and body modification
 * - Illusion: Deceiving the senses
 * - Manipulation: Affecting the physical world
 */

/datum/sr_spell
	abstract_type = /datum/sr_spell

	var/name = ""
	var/desc = ""
	/// Spell category: "combat", "detection", "health", "illusion", "manipulation"
	var/category = "combat"
	/// Spell type within category
	var/type_tag = "physical"
	/// Drain value (base)
	var/drain = 0
	/// Range: "touch", "los", "los_area"
	var/range = "los"
	/// Duration: "instant", "sustained", "permanent"
	var/duration = "instant"
	/// Is this a physical spell or mana spell?
	var/is_physical = TRUE
	/// Affects the sort order in TGUI
	var/ui_sort_order = 0

// =============================================================================
// COMBAT SPELLS - Direct Damage
// =============================================================================

/datum/sr_spell/manabolt
	name = "Manabolt"
	desc = "A focused blast of mana that damages living targets only."
	category = "combat"
	type_tag = "direct"
	drain = 3
	range = "los"
	duration = "instant"
	is_physical = FALSE
	ui_sort_order = 10

/datum/sr_spell/manaball
	name = "Manaball"
	desc = "An area effect version of Manabolt."
	category = "combat"
	type_tag = "direct"
	drain = 5
	range = "los_area"
	duration = "instant"
	is_physical = FALSE
	ui_sort_order = 20

/datum/sr_spell/powerbolt
	name = "Powerbolt"
	desc = "A physical bolt of force that damages anything in its path."
	category = "combat"
	type_tag = "direct"
	drain = 4
	range = "los"
	duration = "instant"
	is_physical = TRUE
	ui_sort_order = 30

/datum/sr_spell/powerball
	name = "Powerball"
	desc = "An area effect version of Powerbolt."
	category = "combat"
	type_tag = "direct"
	drain = 6
	range = "los_area"
	duration = "instant"
	is_physical = TRUE
	ui_sort_order = 40

/datum/sr_spell/stunbolt
	name = "Stunbolt"
	desc = "Non-lethal mana attack that causes Stun damage."
	category = "combat"
	type_tag = "direct"
	drain = 3
	range = "los"
	duration = "instant"
	is_physical = FALSE
	ui_sort_order = 50

/datum/sr_spell/stunball
	name = "Stunball"
	desc = "Area effect non-lethal attack."
	category = "combat"
	type_tag = "direct"
	drain = 5
	range = "los_area"
	duration = "instant"
	is_physical = FALSE
	ui_sort_order = 60

/datum/sr_spell/flamethrower
	name = "Flamethrower"
	desc = "Projects a stream of flames at the target."
	category = "combat"
	type_tag = "indirect"
	drain = 5
	range = "los"
	duration = "instant"
	is_physical = TRUE
	ui_sort_order = 70

/datum/sr_spell/lightning_bolt
	name = "Lightning Bolt"
	desc = "Hurls a bolt of electricity at the target."
	category = "combat"
	type_tag = "indirect"
	drain = 5
	range = "los"
	duration = "instant"
	is_physical = TRUE
	ui_sort_order = 80

// =============================================================================
// DETECTION SPELLS - Sensing and Awareness
// =============================================================================

/datum/sr_spell/analyze_device
	name = "Analyze Device"
	desc = "Provides information about a device's purpose and operation."
	category = "detection"
	type_tag = "active"
	drain = 3
	range = "touch"
	duration = "sustained"
	is_physical = TRUE
	ui_sort_order = 100

/datum/sr_spell/clairvoyance
	name = "Clairvoyance"
	desc = "See through walls and obstacles at a distance."
	category = "detection"
	type_tag = "active"
	drain = 4
	range = "touch"
	duration = "sustained"
	is_physical = FALSE
	ui_sort_order = 110

/datum/sr_spell/detect_enemies
	name = "Detect Enemies"
	desc = "Sense beings with hostile intent toward you."
	category = "detection"
	type_tag = "active"
	drain = 3
	range = "touch"
	duration = "sustained"
	is_physical = FALSE
	ui_sort_order = 120

/datum/sr_spell/detect_life
	name = "Detect Life"
	desc = "Sense the presence of living beings."
	category = "detection"
	type_tag = "active"
	drain = 2
	range = "touch"
	duration = "sustained"
	is_physical = FALSE
	ui_sort_order = 130

/datum/sr_spell/detect_magic
	name = "Detect Magic"
	desc = "Sense the presence of active magic."
	category = "detection"
	type_tag = "active"
	drain = 2
	range = "touch"
	duration = "sustained"
	is_physical = FALSE
	ui_sort_order = 140

/datum/sr_spell/mindlink
	name = "Mindlink"
	desc = "Create a telepathic link with a willing target."
	category = "detection"
	type_tag = "active"
	drain = 2
	range = "touch"
	duration = "sustained"
	is_physical = FALSE
	ui_sort_order = 150

// =============================================================================
// HEALTH SPELLS - Healing and Body Modification
// =============================================================================

/datum/sr_spell/heal
	name = "Heal"
	desc = "Heals physical damage from injuries."
	category = "health"
	type_tag = "essence"
	drain = 4
	range = "touch"
	duration = "permanent"
	is_physical = TRUE
	ui_sort_order = 200

/datum/sr_spell/antidote
	name = "Antidote"
	desc = "Neutralizes toxins in the subject's body."
	category = "health"
	type_tag = "essence"
	drain = 3
	range = "touch"
	duration = "permanent"
	is_physical = TRUE
	ui_sort_order = 210

/datum/sr_spell/cure_disease
	name = "Cure Disease"
	desc = "Fights diseases and infections."
	category = "health"
	type_tag = "essence"
	drain = 4
	range = "touch"
	duration = "permanent"
	is_physical = TRUE
	ui_sort_order = 220

/datum/sr_spell/increase_reflexes
	name = "Increase Reflexes"
	desc = "Boosts the subject's Reaction and Initiative."
	category = "health"
	type_tag = "attribute"
	drain = 3
	range = "touch"
	duration = "sustained"
	is_physical = TRUE
	ui_sort_order = 230

/datum/sr_spell/stabilize
	name = "Stabilize"
	desc = "Prevents a dying character from dying."
	category = "health"
	type_tag = "essence"
	drain = 4
	range = "touch"
	duration = "permanent"
	is_physical = TRUE
	ui_sort_order = 240

// =============================================================================
// ILLUSION SPELLS - Deceiving the Senses
// =============================================================================

/datum/sr_spell/invisibility
	name = "Invisibility"
	desc = "Makes the subject invisible to normal sight."
	category = "illusion"
	type_tag = "realistic"
	drain = 3
	range = "touch"
	duration = "sustained"
	is_physical = FALSE
	ui_sort_order = 300

/datum/sr_spell/improved_invisibility
	name = "Improved Invisibility"
	desc = "Physical invisibility that fools cameras and sensors."
	category = "illusion"
	type_tag = "realistic"
	drain = 4
	range = "touch"
	duration = "sustained"
	is_physical = TRUE
	ui_sort_order = 310

/datum/sr_spell/silence
	name = "Silence"
	desc = "Muffles all sound in an area."
	category = "illusion"
	type_tag = "realistic"
	drain = 3
	range = "los_area"
	duration = "sustained"
	is_physical = TRUE
	ui_sort_order = 320

/datum/sr_spell/physical_mask
	name = "Physical Mask"
	desc = "Changes the subject's physical appearance."
	category = "illusion"
	type_tag = "realistic"
	drain = 3
	range = "touch"
	duration = "sustained"
	is_physical = TRUE
	ui_sort_order = 330

/datum/sr_spell/trid_phantasm
	name = "Trid Phantasm"
	desc = "Creates a realistic moving illusion."
	category = "illusion"
	type_tag = "realistic"
	drain = 4
	range = "los_area"
	duration = "sustained"
	is_physical = TRUE
	ui_sort_order = 340

// =============================================================================
// MANIPULATION SPELLS - Affecting the Physical World
// =============================================================================

/datum/sr_spell/armor
	name = "Armor"
	desc = "Creates a magical barrier that provides armor."
	category = "manipulation"
	type_tag = "physical"
	drain = 3
	range = "touch"
	duration = "sustained"
	is_physical = TRUE
	ui_sort_order = 400

/datum/sr_spell/levitate
	name = "Levitate"
	desc = "Lifts and moves a subject through the air."
	category = "manipulation"
	type_tag = "physical"
	drain = 4
	range = "los"
	duration = "sustained"
	is_physical = TRUE
	ui_sort_order = 410

/datum/sr_spell/magic_fingers
	name = "Magic Fingers"
	desc = "Creates invisible hands to manipulate objects."
	category = "manipulation"
	type_tag = "physical"
	drain = 3
	range = "los"
	duration = "sustained"
	is_physical = TRUE
	ui_sort_order = 420

/datum/sr_spell/control_actions
	name = "Control Actions"
	desc = "Takes control of a target's physical actions."
	category = "manipulation"
	type_tag = "mental"
	drain = 4
	range = "los"
	duration = "sustained"
	is_physical = FALSE
	ui_sort_order = 430

/datum/sr_spell/control_thoughts
	name = "Control Thoughts"
	desc = "Implants suggestions in the target's mind."
	category = "manipulation"
	type_tag = "mental"
	drain = 5
	range = "los"
	duration = "sustained"
	is_physical = FALSE
	ui_sort_order = 440

/datum/sr_spell/shape_material
	name = "Shape Material"
	desc = "Molds and reshapes physical matter."
	category = "manipulation"
	type_tag = "transform"
	drain = 4
	range = "touch"
	duration = "sustained"
	is_physical = TRUE
	ui_sort_order = 450
