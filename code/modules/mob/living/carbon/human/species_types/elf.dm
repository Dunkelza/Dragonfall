// =============================================================================
// Shadowrun 5e Elf Metatype
// =============================================================================
// Attribute Limits: BOD 1-6, AGI 2-7, REA 1-6, STR 1-6, WIL 1-6, LOG 1-6, INT 1-6, CHA 3-8
// Racial Abilities: Low-Light Vision
// Priority: D or higher

/datum/species/elf
	name = "\improper Elf"
	id = SPECIES_ELF
	default_color = "FFFFFF"
	species_traits = list(EYECOLOR, HAIR, FACEHAIR, LIPS, BODY_RESIZABLE, HAIRCOLOR, FACEHAIRCOLOR)
	inherent_traits = list(
		TRAIT_ADVANCEDTOOLUSER,
		TRAIT_CAN_STRIP,
		TRAIT_CAN_USE_FLIGHT_POTION,
	)
	mutant_bodyparts = list("wings" = "None")
	use_skintones = 1
	skinned_type = /obj/item/stack/sheet/animalhide/human
	disliked_food = GROSS | RAW | CLOTH
	liked_food = JUNKFOOD | FRIED
	changesource_flags = MIRROR_BADMIN | WABBAJACK | MIRROR_MAGIC | MIRROR_PRIDE | ERT_SPAWN | RACE_SWAP | SLIME_EXTRACT
	job_outfit_type = SPECIES_HUMAN

/datum/species/elf/on_species_gain(mob/living/carbon/C, datum/species/old_species, pref_load)
	ADD_TRAIT(C, TRAIT_ADVANCED_RACE_THEORY, SPECIES_TRAIT)
	return ..()

/datum/species/elf/on_species_loss(mob/living/carbon/human/C, datum/species/new_species, pref_load)
	REMOVE_TRAIT(C, TRAIT_ADVANCED_RACE_THEORY, SPECIES_TRAIT)
	return ..()

/datum/species/elf/prepare_human_for_preview(mob/living/carbon/human/human)
	human.hairstyle = "Business Hair"
	human.hair_color = "#bb9966" // brown
	human.update_body_parts()

/datum/species/elf/get_species_mechanics()
	return "Elves are graceful and charismatic with low-light vision. AGI 2-7, CHA 3-8, but otherwise standard attribute limits."

/datum/species/elf/get_species_lore()
	return list(
		"Elves. The first metatype to emerge during the Awakening, known for their grace and charisma.",
		"Their low-light vision allows them to see in dim conditions with ease.",
	)
