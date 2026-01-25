// Shadowrun 5e Dwarf Metatype
// Attribute Limits: BOD 1-7, AGI 1-6, REA 1-5, STR 1-8, WIL 2-7, LOG 1-6, INT 1-6, CHA 1-6
// Racial Abilities: Thermographic Vision, +2 dice for Toxin Resistance, +20% Lifestyle cost

/datum/species/dwarf
	name = "\improper Dwarf"
	id = SPECIES_DWARF
	default_color = "FFFFFF"
	species_traits = list(EYECOLOR, HAIR, FACEHAIR, LIPS, BODY_RESIZABLE, HAIRCOLOR, FACEHAIRCOLOR)
	inherent_traits = list(
		TRAIT_ADVANCEDTOOLUSER,
		TRAIT_CAN_STRIP,
		TRAIT_CAN_USE_FLIGHT_POTION,
		TRAIT_DWARF,
	)
	use_skintones = 1
	skinned_type = /obj/item/stack/sheet/animalhide/human
	disliked_food = GROSS | RAW | CLOTH
	liked_food = MEAT | FRIED
	changesource_flags = MIRROR_BADMIN | WABBAJACK | MIRROR_MAGIC | MIRROR_PRIDE | ERT_SPAWN | RACE_SWAP | SLIME_EXTRACT
	job_outfit_type = SPECIES_HUMAN
	// Dwarves are shorter
	bodypart_overrides = list(
		BODY_ZONE_HEAD = /obj/item/bodypart/head,
		BODY_ZONE_CHEST = /obj/item/bodypart/chest,
		BODY_ZONE_L_ARM = /obj/item/bodypart/arm/left,
		BODY_ZONE_R_ARM = /obj/item/bodypart/arm/right,
		BODY_ZONE_L_LEG = /obj/item/bodypart/leg/left,
		BODY_ZONE_R_LEG = /obj/item/bodypart/leg/right,
	)

/datum/species/dwarf/on_species_gain(mob/living/carbon/C, datum/species/old_species, pref_load)
	ADD_TRAIT(C, TRAIT_DWARF, SPECIES_TRAIT)
	return ..()

/datum/species/dwarf/on_species_loss(mob/living/carbon/human/C, datum/species/new_species, pref_load)
	REMOVE_TRAIT(C, TRAIT_DWARF, SPECIES_TRAIT)
	return ..()

/datum/species/dwarf/prepare_human_for_preview(mob/living/carbon/human/human)
	human.hairstyle = "Business Hair"
	human.hair_color = "#8B4513" // brown
	human.facial_hairstyle = "Full Beard"
	human.facial_hair_color = "#8B4513"
	human.update_body_parts()

/datum/species/dwarf/get_species_mechanics()
	return "Dwarves are stout and resilient with thermographic vision and enhanced toxin resistance. STR 1-8, BOD 1-7, WIL 2-7, but REA limited to 1-5."

/datum/species/dwarf/get_species_lore()
	return list(
		"Dwarves. Stocky, hardy, and with an innate resistance to toxins.",
		"Their thermographic vision allows them to see heat signatures in darkness.",
	)
