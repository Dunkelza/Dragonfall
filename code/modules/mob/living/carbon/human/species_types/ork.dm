// Shadowrun 5e Ork Metatype
// Attribute Limits: BOD 4-9, AGI 1-6, REA 1-6, STR 3-8, WIL 1-6, LOG 1-5, INT 1-6, CHA 1-5
// Racial Abilities: Low-Light Vision

/datum/species/ork
	name = "\improper Ork"
	id = SPECIES_ORK
	default_color = "FFFFFF"
	species_traits = list(EYECOLOR, HAIR, FACEHAIR, LIPS, BODY_RESIZABLE, HAIRCOLOR, FACEHAIRCOLOR)
	inherent_traits = list(
		TRAIT_ADVANCEDTOOLUSER,
		TRAIT_CAN_STRIP,
		TRAIT_CAN_USE_FLIGHT_POTION,
		TRAIT_ORK,
	)
	use_skintones = 1
	skinned_type = /obj/item/stack/sheet/animalhide/human
	disliked_food = GROSS | CLOTH
	liked_food = MEAT | FRIED | RAW
	changesource_flags = MIRROR_BADMIN | WABBAJACK | MIRROR_MAGIC | MIRROR_PRIDE | ERT_SPAWN | RACE_SWAP | SLIME_EXTRACT
	job_outfit_type = SPECIES_HUMAN
	// Orks are larger and more muscular
	bodypart_overrides = list(
		BODY_ZONE_HEAD = /obj/item/bodypart/head,
		BODY_ZONE_CHEST = /obj/item/bodypart/chest,
		BODY_ZONE_L_ARM = /obj/item/bodypart/arm/left,
		BODY_ZONE_R_ARM = /obj/item/bodypart/arm/right,
		BODY_ZONE_L_LEG = /obj/item/bodypart/leg/left,
		BODY_ZONE_R_LEG = /obj/item/bodypart/leg/right,
	)

/datum/species/ork/on_species_gain(mob/living/carbon/C, datum/species/old_species, pref_load)
	ADD_TRAIT(C, TRAIT_ORK, SPECIES_TRAIT)
	return ..()

/datum/species/ork/on_species_loss(mob/living/carbon/human/C, datum/species/new_species, pref_load)
	REMOVE_TRAIT(C, TRAIT_ORK, SPECIES_TRAIT)
	return ..()

/datum/species/ork/prepare_human_for_preview(mob/living/carbon/human/human)
	human.hairstyle = "Mohawk"
	human.hair_color = "#1a1a1a" // black
	human.skin_tone = "olive"
	human.update_body_parts()

/datum/species/ork/get_species_mechanics()
	return "Orks are physically powerful with low-light vision. BOD 4-9, STR 3-8, but LOG 1-5 and CHA 1-5."

/datum/species/ork/get_species_lore()
	return list(
		"Orks. Strong, tough, and built for physical labor and combat.",
		"Their low-light vision grants them excellent sight in dim conditions.",
	)
