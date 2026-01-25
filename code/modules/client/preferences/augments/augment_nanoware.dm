/**
 * Nanoware Augment Items for Character Generation
 *
 * These augment items allow players to select nanoware during character creation.
 * Nanoware provides nanite-based enhancements with moderate essence costs.
 */

/datum/augment_item/nanoware
	category = AUGMENT_CATEGORY_NANOWARE

// =============================================================================
// NANOHIVE SYSTEMS
// =============================================================================

/datum/augment_item/nanoware/nanohive_r1
	name = "Nanohive System (Rating 1)"
	description = "Base nanohive colony required for most nanoware. Supports up to 2 nanoware systems."
	slot = AUGMENT_SLOT_NANO_HIVE
	path = /obj/item/organ/nanoware/nanohive

/datum/augment_item/nanoware/nanohive_r2
	name = "Nanohive System (Rating 2)"
	description = "Enhanced nanohive supporting up to 4 nanoware systems."
	slot = AUGMENT_SLOT_NANO_HIVE
	path = /obj/item/organ/nanoware/nanohive/r2

/datum/augment_item/nanoware/nanohive_r3
	name = "Nanohive System (Rating 3)"
	description = "Advanced nanohive with efficient power management. Supports up to 6 nanoware systems."
	slot = AUGMENT_SLOT_NANO_HIVE
	path = /obj/item/organ/nanoware/nanohive/r3

/datum/augment_item/nanoware/nanohive_r4
	name = "Nanohive System (Rating 4)"
	description = "Military-grade nanohive. Supports unlimited nanoware systems."
	slot = AUGMENT_SLOT_NANO_HIVE
	path = /obj/item/organ/nanoware/nanohive/r4

// =============================================================================
// BLOOD NANITES
// =============================================================================

/datum/augment_item/nanoware/platelet_r1
	name = "Platelet Nanites (Rating 1)"
	description = "Nanites that accelerate wound clotting and reduce blood loss."
	slot = AUGMENT_SLOT_NANO_BLOOD
	path = /obj/item/organ/nanoware/blood_nanites

/datum/augment_item/nanoware/platelet_r2
	name = "Platelet Nanites (Rating 2)"
	description = "Enhanced trauma response with minor regenerative capability."
	slot = AUGMENT_SLOT_NANO_BLOOD
	path = /obj/item/organ/nanoware/blood_nanites/r2

/datum/augment_item/nanoware/platelet_r3
	name = "Platelet Nanites (Rating 3)"
	description = "Advanced nanites capable of repairing minor organ damage."
	slot = AUGMENT_SLOT_NANO_BLOOD
	path = /obj/item/organ/nanoware/blood_nanites/r3

// =============================================================================
// BONE NANITES
// =============================================================================

/datum/augment_item/nanoware/bone_r1
	name = "Bone Lacing Nanites (Rating 1)"
	description = "Nanites that reinforce bone structure against fractures."
	slot = AUGMENT_SLOT_NANO_BONE
	path = /obj/item/organ/nanoware/bone_lacing

/datum/augment_item/nanoware/bone_r2
	name = "Bone Lacing Nanites (Rating 2)"
	description = "Enhanced bone reinforcement with metallic lattice integration."
	slot = AUGMENT_SLOT_NANO_BONE
	path = /obj/item/organ/nanoware/bone_lacing/r2

/datum/augment_item/nanoware/bone_r3
	name = "Bone Lacing Nanites (Rating 3)"
	description = "Advanced bone reinforcement approaching cyberlimb durability."
	slot = AUGMENT_SLOT_NANO_BONE
	path = /obj/item/organ/nanoware/bone_lacing/r3

// =============================================================================
// NEURAL NANITES
// =============================================================================

/datum/augment_item/nanoware/neural_r1
	name = "Neural Amplifier (Rating 1)"
	description = "Nanites that enhance neural transmission speed and cognitive processing."
	slot = AUGMENT_SLOT_NANO_NEURAL
	path = /obj/item/organ/nanoware/neural_amplifier

/datum/augment_item/nanoware/neural_r2
	name = "Neural Amplifier (Rating 2)"
	description = "Enhanced neural nanites for improved reaction time."
	slot = AUGMENT_SLOT_NANO_NEURAL
	path = /obj/item/organ/nanoware/neural_amplifier/r2

/datum/augment_item/nanoware/neural_r3
	name = "Neural Amplifier (Rating 3)"
	description = "Military-grade neural enhancement for lightning-fast reflexes."
	slot = AUGMENT_SLOT_NANO_NEURAL
	path = /obj/item/organ/nanoware/neural_amplifier/r3

/datum/augment_item/nanoware/memory
	name = "Memory Enhancement"
	description = "Nanites that improve memory formation and recall."
	slot = AUGMENT_SLOT_NANO_NEURAL
	path = /obj/item/organ/nanoware/memory_enhancement

// =============================================================================
// DERMAL NANITES
// =============================================================================

/datum/augment_item/nanoware/dermal_r1
	name = "Dermal Armor (Rating 1)"
	description = "Nanites that reinforce skin tissue for subtle armor protection."
	slot = AUGMENT_SLOT_NANO_SKIN
	path = /obj/item/organ/nanoware/dermal_armor

/datum/augment_item/nanoware/dermal_r2
	name = "Dermal Armor (Rating 2)"
	description = "Enhanced dermal reinforcement with improved damage absorption."
	slot = AUGMENT_SLOT_NANO_SKIN
	path = /obj/item/organ/nanoware/dermal_armor/r2

/datum/augment_item/nanoware/dermal_r3
	name = "Dermal Armor (Rating 3)"
	description = "Advanced dermal protection approaching light body armor."
	slot = AUGMENT_SLOT_NANO_SKIN
	path = /obj/item/organ/nanoware/dermal_armor/r3

/datum/augment_item/nanoware/chameleon
	name = "Chameleon Skin"
	description = "Nanites that can alter skin pigmentation for camouflage or cosmetic effects."
	slot = AUGMENT_SLOT_NANO_SKIN
	path = /obj/item/organ/nanoware/chameleon_skin

// =============================================================================
// SOFT NANITES
// =============================================================================

/datum/augment_item/nanoware/toxin_r1
	name = "Toxin Filter (Rating 1)"
	description = "Nanites that neutralize toxins and drugs in the bloodstream."
	slot = AUGMENT_SLOT_NANO_SOFT
	path = /obj/item/organ/nanoware/toxin_filter

/datum/augment_item/nanoware/toxin_r2
	name = "Toxin Filter (Rating 2)"
	description = "Enhanced toxin neutralization with faster processing."
	slot = AUGMENT_SLOT_NANO_SOFT
	path = /obj/item/organ/nanoware/toxin_filter/r2

/datum/augment_item/nanoware/toxin_r3
	name = "Toxin Filter (Rating 3)"
	description = "Military-grade toxin filtration effective against most chemical agents."
	slot = AUGMENT_SLOT_NANO_SOFT
	path = /obj/item/organ/nanoware/toxin_filter/r3

/datum/augment_item/nanoware/oxygen
	name = "Oxygen Reserve"
	description = "Nanites that store and release oxygen, extending breath-holding capability."
	slot = AUGMENT_SLOT_NANO_SOFT
	path = /obj/item/organ/nanoware/oxygen_reserve

/datum/augment_item/nanoware/metabolic
	name = "Metabolic Optimizer"
	description = "Nanites that regulate metabolism, reducing need for food and improving energy."
	slot = AUGMENT_SLOT_NANO_SOFT
	path = /obj/item/organ/nanoware/metabolic_optimizer

/datum/augment_item/nanoware/pain
	name = "Pain Editor"
	description = "Nanites that block pain signals, allowing continued function despite injury."
	slot = AUGMENT_SLOT_NANO_SOFT
	path = /obj/item/organ/nanoware/pain_editor

/datum/augment_item/nanoware/reflex
	name = "Reflex Recorder"
	description = "Nanites that record and optimize motor patterns, improving physical skill performance."
	slot = AUGMENT_SLOT_NANO_SOFT
	path = /obj/item/organ/nanoware/reflex_recorder
