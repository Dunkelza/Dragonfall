// Shadowrun 5e Troll Metatype
// Attribute Limits: BOD 5-10, AGI 1-5, REA 1-6, STR 5-10, WIL 1-6, LOG 1-5, INT 1-5, CHA 1-4
// Racial Abilities: Thermographic Vision, +1 Reach, +1 Dermal Armor

/datum/species/troll
	name = "\improper Troll"
	id = SPECIES_TROLL
	default_color = "FFFFFF"
	species_traits = list(EYECOLOR, HAIR, FACEHAIR, LIPS, BODY_RESIZABLE, HAIRCOLOR, FACEHAIRCOLOR)
	inherent_traits = list(
		TRAIT_ADVANCEDTOOLUSER,
		TRAIT_CAN_STRIP,
		TRAIT_TROLL,
	)
	use_skintones = 1
	skinned_type = /obj/item/stack/sheet/animalhide/human
	disliked_food = GROSS | CLOTH
	liked_food = MEAT | FRIED | RAW
	changesource_flags = MIRROR_BADMIN | WABBAJACK | MIRROR_MAGIC | MIRROR_PRIDE | ERT_SPAWN | RACE_SWAP | SLIME_EXTRACT
	job_outfit_type = SPECIES_HUMAN
	// Trolls are massive
	bodypart_overrides = list(
		BODY_ZONE_HEAD = /obj/item/bodypart/head,
		BODY_ZONE_CHEST = /obj/item/bodypart/chest,
		BODY_ZONE_L_ARM = /obj/item/bodypart/arm/left,
		BODY_ZONE_R_ARM = /obj/item/bodypart/arm/right,
		BODY_ZONE_L_LEG = /obj/item/bodypart/leg/left,
		BODY_ZONE_R_LEG = /obj/item/bodypart/leg/right,
	)
	// Trolls have natural dermal armor
	armor = 5 // +1 dermal armor equivalent

/datum/species/troll/on_species_gain(mob/living/carbon/C, datum/species/old_species, pref_load)
	ADD_TRAIT(C, TRAIT_TROLL, SPECIES_TRAIT)
	return ..()

/datum/species/troll/on_species_loss(mob/living/carbon/human/C, datum/species/new_species, pref_load)
	REMOVE_TRAIT(C, TRAIT_TROLL, SPECIES_TRAIT)
	return ..()

/datum/species/troll/prepare_human_for_preview(mob/living/carbon/human/human)
	human.hairstyle = "Bald"
	human.skin_tone = "grey"
	human.update_body_parts()

/datum/species/troll/get_species_mechanics()
	return "Trolls are massive and incredibly strong with thermographic vision and natural dermal armor. BOD 5-10, STR 5-10, but AGI 1-5, LOG 1-5, INT 1-5, CHA 1-4."

/datum/species/troll/get_species_lore()
	return list(
		"Trolls. Towering giants with thick dermal deposits and fearsome strength.",
		"Their thermographic vision and natural armor make them formidable in combat.",
	)
