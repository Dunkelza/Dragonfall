/**
 * Shadowrun 5e Nanoware
 *
 * Nanoware consists of nanite-based augmentations that provide various
 * enhancements through microscopic machines operating within the body.
 *
 * Key characteristics:
 * - Moderate essence costs (between cyberware and bioware)
 * - Many require a nanohive system to maintain
 * - Some have ongoing effects
 * - Cannot use cyberware grades
 */

/obj/item/organ/nanoware
	name = "nanoware system"
	desc = "A nanite-based augmentation system."
	organ_flags = ORGAN_SYNTHETIC
	/// Whether this requires a nanohive to function
	var/requires_nanohive = TRUE
	/// Rating level (some nanoware has ratings)
	var/rating = 0
	/// Maximum rating for this nanoware
	var/max_rating = 0

// =============================================================================
// NANOHIVE SYSTEMS - Required for most nanoware
// =============================================================================

/obj/item/organ/nanoware/nanohive
	name = "Nanohive System (Rating 1)"
	desc = "A colony of self-replicating nanites that maintain and power other nanoware systems. Required for most nanoware to function."
	essence_base_cost = 0.5
	nuyen_base_cost = 10000
	requires_nanohive = FALSE // It IS the nanohive
	rating = 1
	max_rating = 4

/obj/item/organ/nanoware/nanohive/r2
	name = "Nanohive System (Rating 2)"
	desc = "An enhanced nanohive colony capable of supporting more nanoware systems simultaneously."
	essence_base_cost = 0.5
	nuyen_base_cost = 20000
	rating = 2

/obj/item/organ/nanoware/nanohive/r3
	name = "Nanohive System (Rating 3)"
	desc = "An advanced nanohive with rapid replication and efficient power management."
	essence_base_cost = 0.5
	nuyen_base_cost = 40000
	rating = 3

/obj/item/organ/nanoware/nanohive/r4
	name = "Nanohive System (Rating 4)"
	desc = "Military-grade nanohive system with cutting-edge nanite technology."
	essence_base_cost = 0.5
	nuyen_base_cost = 80000
	rating = 4

// =============================================================================
// BLOOD NANITES - Healing and trauma response
// =============================================================================

/obj/item/organ/nanoware/blood_nanites
	name = "Platelet Nanites"
	desc = "Nanites that rapidly respond to wounds, accelerating clotting and reducing blood loss."
	essence_base_cost = 0.25
	nuyen_base_cost = 15000
	rating = 1
	max_rating = 3

/obj/item/organ/nanoware/blood_nanites/on_life(seconds_per_tick, times_fired)
	. = ..()
	if(!owner)
		return
	// Reduce bleeding severity
	if(owner.blood_volume < BLOOD_VOLUME_NORMAL && prob(30))
		owner.blood_volume = min(owner.blood_volume + 1, BLOOD_VOLUME_NORMAL)

/obj/item/organ/nanoware/blood_nanites/r2
	name = "Platelet Nanites (Rating 2)"
	desc = "Enhanced platelet nanites with improved wound response and minor regeneration."
	essence_base_cost = 0.35
	nuyen_base_cost = 30000
	rating = 2

/obj/item/organ/nanoware/blood_nanites/r3
	name = "Platelet Nanites (Rating 3)"
	desc = "Advanced trauma response nanites that can repair minor organ damage."
	essence_base_cost = 0.45
	nuyen_base_cost = 60000
	rating = 3

/obj/item/organ/nanoware/blood_nanites/r3/on_life(seconds_per_tick, times_fired)
	. = ..()
	if(!owner)
		return
	// Enhanced healing
	if(prob(15))
		owner.adjustBruteLoss(-0.5, updating_health = FALSE)
		owner.adjustFireLoss(-0.5, updating_health = FALSE)

// =============================================================================
// BONE NANITES - Structural reinforcement
// =============================================================================

/obj/item/organ/nanoware/bone_lacing
	name = "Bone Lacing Nanites"
	desc = "Nanites that reinforce bone structure, increasing durability and resistance to fractures."
	essence_base_cost = 0.3
	nuyen_base_cost = 20000
	rating = 1
	max_rating = 3

/obj/item/organ/nanoware/bone_lacing/r2
	name = "Bone Lacing Nanites (Rating 2)"
	desc = "Enhanced bone reinforcement with embedded metallic lattice structures."
	essence_base_cost = 0.4
	nuyen_base_cost = 40000
	rating = 2

/obj/item/organ/nanoware/bone_lacing/r3
	name = "Bone Lacing Nanites (Rating 3)"
	desc = "Advanced bone reinforcement approaching cyberlimb durability."
	essence_base_cost = 0.5
	nuyen_base_cost = 80000
	rating = 3

// =============================================================================
// NEURAL NANITES - Mental enhancement
// =============================================================================

/obj/item/organ/nanoware/neural_amplifier
	name = "Neural Amplifier Nanites"
	desc = "Nanites that enhance neural transmission speed and cognitive processing."
	essence_base_cost = 0.3
	nuyen_base_cost = 25000
	rating = 1
	max_rating = 3

/obj/item/organ/nanoware/neural_amplifier/r2
	name = "Neural Amplifier Nanites (Rating 2)"
	desc = "Enhanced neural nanites providing improved reaction time and mental clarity."
	essence_base_cost = 0.4
	nuyen_base_cost = 50000
	rating = 2

/obj/item/organ/nanoware/neural_amplifier/r3
	name = "Neural Amplifier Nanites (Rating 3)"
	desc = "Military-grade neural enhancement for lightning-fast reflexes."
	essence_base_cost = 0.5
	nuyen_base_cost = 100000
	rating = 3

/obj/item/organ/nanoware/memory_enhancement
	name = "Memory Enhancement Nanites"
	desc = "Nanites that improve memory formation and recall through neural pattern reinforcement."
	essence_base_cost = 0.2
	nuyen_base_cost = 20000

// =============================================================================
// DERMAL NANITES - Skin enhancement
// =============================================================================

/obj/item/organ/nanoware/dermal_armor
	name = "Dermal Armor Nanites"
	desc = "Nanites that reinforce skin tissue, providing subtle armor protection."
	essence_base_cost = 0.3
	nuyen_base_cost = 25000
	rating = 1
	max_rating = 3

/obj/item/organ/nanoware/dermal_armor/r2
	name = "Dermal Armor Nanites (Rating 2)"
	desc = "Enhanced dermal reinforcement with improved damage absorption."
	essence_base_cost = 0.4
	nuyen_base_cost = 50000
	rating = 2

/obj/item/organ/nanoware/dermal_armor/r3
	name = "Dermal Armor Nanites (Rating 3)"
	desc = "Advanced dermal protection approaching light body armor."
	essence_base_cost = 0.5
	nuyen_base_cost = 100000
	rating = 3

/obj/item/organ/nanoware/chameleon_skin
	name = "Chameleon Skin Nanites"
	desc = "Nanites that can alter skin pigmentation for camouflage or cosmetic effects."
	essence_base_cost = 0.25
	nuyen_base_cost = 30000

// =============================================================================
// SOFT NANITES - Utility and specialty
// =============================================================================

/obj/item/organ/nanoware/toxin_filter
	name = "Toxin Filter Nanites"
	desc = "Nanites that neutralize toxins and drugs in the bloodstream."
	essence_base_cost = 0.2
	nuyen_base_cost = 15000
	rating = 1
	max_rating = 3

/obj/item/organ/nanoware/toxin_filter/Insert(mob/living/carbon/receiver, special, movement_flags)
	. = ..()
	if(.)
		ADD_TRAIT(receiver, TRAIT_DWARF_TOXIN_RESIST, type)

/obj/item/organ/nanoware/toxin_filter/Remove(mob/living/carbon/organ_owner, special, movement_flags)
	. = ..()
	REMOVE_TRAIT(organ_owner, TRAIT_DWARF_TOXIN_RESIST, type)

/obj/item/organ/nanoware/toxin_filter/r2
	name = "Toxin Filter Nanites (Rating 2)"
	desc = "Enhanced toxin neutralization with faster processing."
	essence_base_cost = 0.3
	nuyen_base_cost = 30000
	rating = 2

/obj/item/organ/nanoware/toxin_filter/r3
	name = "Toxin Filter Nanites (Rating 3)"
	desc = "Military-grade toxin filtration effective against most chemical agents."
	essence_base_cost = 0.4
	nuyen_base_cost = 60000
	rating = 3

/obj/item/organ/nanoware/oxygen_reserve
	name = "Oxygen Reserve Nanites"
	desc = "Nanites that store and release oxygen, extending breath-holding capability."
	essence_base_cost = 0.15
	nuyen_base_cost = 10000

/obj/item/organ/nanoware/metabolic_optimizer
	name = "Metabolic Optimizer Nanites"
	desc = "Nanites that regulate metabolism, reducing need for food and improving energy efficiency."
	essence_base_cost = 0.2
	nuyen_base_cost = 15000

/obj/item/organ/nanoware/pain_editor
	name = "Pain Editor Nanites"
	desc = "Nanites that block pain signals, allowing continued function despite injury."
	essence_base_cost = 0.3
	nuyen_base_cost = 35000

/obj/item/organ/nanoware/reflex_recorder
	name = "Reflex Recorder Nanites"
	desc = "Nanites that record and optimize motor patterns, improving physical skill performance."
	essence_base_cost = 0.25
	nuyen_base_cost = 25000
