// SR5 Bioware - Biological augmentations that use less Essence than cyberware
// but are typically more expensive in nuyen.
//
// Bioware differs from cyberware in that it's cultured biological material
// rather than synthetic machinery, making it more compatible with the body.

#define BIOWARE_SOURCE "Bioware"

/obj/item/organ/bioware
	name = "bioware implant"
	desc = "A cultured biological augmentation that enhances the body's natural capabilities."
	icon = 'icons/obj/surgery.dmi'
	icon_state = "yourorgans"
	visual = FALSE
	// Bioware is still synthetic in game terms (doesn't decay, EMP doesn't affect it the same way)
	organ_flags = ORGAN_SYNTHETIC
	// SR5: Bioware has lower Essence costs than equivalent cyberware
	essence_base_cost = 0.10
	// SR5: Bioware is typically more expensive than cyberware
	nuyen_base_cost = 5000
	// The stat this bioware modifies (if any)
	var/datum/rpg_stat/modified_stat = null
	// How much the stat is modified
	var/stat_modifier = 0

/obj/item/organ/bioware/Insert(mob/living/carbon/receiver, special, drop_if_replaced)
	. = ..()
	if(!.)
		return
	if(modified_stat && stat_modifier && receiver.stats)
		receiver.stats.set_stat_modifier(stat_modifier, modified_stat, BIOWARE_SOURCE + " ([name])")

/obj/item/organ/bioware/Remove(mob/living/carbon/organ_owner, special = FALSE)
	if(modified_stat && stat_modifier && organ_owner?.stats)
		organ_owner.stats.remove_stat_modifier(modified_stat, BIOWARE_SOURCE + " ([name])")
	return ..()

// ============================================================================
// MUSCLE TONER - Augments Agility
// Bioware that replaces muscle tissue with enhanced vat-grown muscle fibers
// that provide greater control and coordination.
// ============================================================================

/obj/item/organ/bioware/muscle_toner
	name = "muscle toner"
	desc = "Vat-grown muscle fibers woven into the body's musculature, providing enhanced coordination and fine motor control."
	icon_state = "yourorgans"
	slot = ORGAN_SLOT_MUSCLE_TONER
	zone = BODY_ZONE_CHEST
	// SR5: Muscle Toner costs 0.2 Essence per rating
	essence_base_cost = 0.20
	// SR5: Muscle Toner costs 8,000¥ per rating
	nuyen_base_cost = 8000
	modified_stat = /datum/rpg_stat/agility
	stat_modifier = 1

/obj/item/organ/bioware/muscle_toner/rating2
	name = "muscle toner (rating 2)"
	desc = "Enhanced vat-grown muscle fibers providing significantly improved coordination and agility."
	// Rating 2: 0.4 Essence
	essence_base_cost = 0.40
	// Rating 2: 16,000¥
	nuyen_base_cost = 16000
	stat_modifier = 2

/obj/item/organ/bioware/muscle_toner/rating3
	name = "muscle toner (rating 3)"
	desc = "Top-of-the-line vat-grown muscle fibers that maximize coordination and agility to superhuman levels."
	// Rating 3: 0.6 Essence
	essence_base_cost = 0.60
	// Rating 3: 24,000¥
	nuyen_base_cost = 24000
	stat_modifier = 3

// ============================================================================
// MUSCLE AUGMENTATION - Augments Strength
// Bioware that adds additional vat-grown muscle tissue, increasing
// raw physical power.
// ============================================================================

/obj/item/organ/bioware/muscle_augmentation
	name = "muscle augmentation"
	desc = "Additional vat-grown muscle tissue woven into the body, providing enhanced physical strength."
	icon_state = "yourorgans"
	slot = ORGAN_SLOT_MUSCLE_AUG
	zone = BODY_ZONE_CHEST
	// SR5: Muscle Augmentation costs 0.2 Essence per rating
	essence_base_cost = 0.20
	// SR5: Muscle Augmentation costs 7,000¥ per rating
	nuyen_base_cost = 7000
	modified_stat = /datum/rpg_stat/strength
	stat_modifier = 1

/obj/item/organ/bioware/muscle_augmentation/rating2
	name = "muscle augmentation (rating 2)"
	desc = "Significantly enhanced vat-grown muscle tissue providing considerable additional strength."
	// Rating 2: 0.4 Essence
	essence_base_cost = 0.40
	// Rating 2: 14,000¥
	nuyen_base_cost = 14000
	stat_modifier = 2

/obj/item/organ/bioware/muscle_augmentation/rating3
	name = "muscle augmentation (rating 3)"
	desc = "Maximum density vat-grown muscle tissue that pushes physical strength to superhuman levels."
	// Rating 3: 0.6 Essence
	essence_base_cost = 0.60
	// Rating 3: 21,000¥
	nuyen_base_cost = 21000
	stat_modifier = 3

// ============================================================================
// SYNAPTIC BOOSTER - Augments Reaction
// Bioware that enhances the nervous system's synaptic connections,
// allowing for faster reflexes and reaction time.
// ============================================================================

/obj/item/organ/bioware/synaptic_booster
	name = "synaptic booster"
	desc = "A neural enhancement that optimizes synaptic transmission, dramatically improving reaction time."
	icon_state = "yourorgans"
	slot = ORGAN_SLOT_SYNAPTIC
	zone = BODY_ZONE_HEAD
	// SR5: Synaptic Booster costs 0.5 Essence per rating (it's powerful)
	essence_base_cost = 0.50
	// SR5: Synaptic Booster costs 47,500¥ per rating (very expensive)
	nuyen_base_cost = 47500
	modified_stat = /datum/rpg_stat/reaction
	stat_modifier = 1

/obj/item/organ/bioware/synaptic_booster/rating2
	name = "synaptic booster (rating 2)"
	desc = "An advanced neural enhancement providing significantly faster reflexes and reaction time."
	// Rating 2: 1.0 Essence
	essence_base_cost = 1.00
	// Rating 2: 95,000¥
	nuyen_base_cost = 95000
	stat_modifier = 2

/obj/item/organ/bioware/synaptic_booster/rating3
	name = "synaptic booster (rating 3)"
	desc = "A cutting-edge neural enhancement that pushes reaction time to the absolute biological limit."
	// Rating 3: 1.5 Essence
	essence_base_cost = 1.50
	// Rating 3: 142,500¥
	nuyen_base_cost = 142500
	stat_modifier = 3

// ============================================================================
// CEREBRAL BOOSTER - Augments Logic
// Bioware that enhances the brain's cognitive functions through
// additional neural tissue and optimized neural pathways.
// ============================================================================

/obj/item/organ/bioware/cerebral_booster
	name = "cerebral booster"
	desc = "Enhanced neural tissue that improves cognitive function, memory, and logical processing."
	icon_state = "yourorgans"
	slot = ORGAN_SLOT_CEREBRAL
	zone = BODY_ZONE_HEAD
	// SR5: Cerebral Booster costs 0.2 Essence per rating
	essence_base_cost = 0.20
	// SR5: Cerebral Booster costs 15,750¥ per rating
	nuyen_base_cost = 15750
	modified_stat = /datum/rpg_stat/logic
	stat_modifier = 1

/obj/item/organ/bioware/cerebral_booster/rating2
	name = "cerebral booster (rating 2)"
	desc = "Significantly enhanced neural tissue providing considerably improved cognitive abilities."
	// Rating 2: 0.4 Essence
	essence_base_cost = 0.40
	// Rating 2: 31,500¥
	nuyen_base_cost = 31500
	stat_modifier = 2

/obj/item/organ/bioware/cerebral_booster/rating3
	name = "cerebral booster (rating 3)"
	desc = "Maximum capacity neural enhancement that pushes logical reasoning to superhuman levels."
	// Rating 3: 0.6 Essence
	essence_base_cost = 0.60
	// Rating 3: 47,250¥
	nuyen_base_cost = 47250
	stat_modifier = 3

// ============================================================================
// MNEMONIC ENHANCER - Augments Intuition (and memory)
// Bioware that enhances memory formation and intuitive processing.
// ============================================================================

/obj/item/organ/bioware/mnemonic_enhancer
	name = "mnemonic enhancer"
	desc = "Neural tissue optimized for memory formation and intuitive pattern recognition."
	icon_state = "yourorgans"
	slot = ORGAN_SLOT_MNEMONIC
	zone = BODY_ZONE_HEAD
	// SR5: Mnemonic Enhancer costs 0.1 Essence per rating
	essence_base_cost = 0.10
	// SR5: Mnemonic Enhancer costs 3,000¥ per rating
	nuyen_base_cost = 3000
	modified_stat = /datum/rpg_stat/intuition
	stat_modifier = 1

/obj/item/organ/bioware/mnemonic_enhancer/rating2
	name = "mnemonic enhancer (rating 2)"
	desc = "Enhanced memory and intuition pathways for significantly improved pattern recognition."
	// Rating 2: 0.2 Essence
	essence_base_cost = 0.20
	// Rating 2: 6,000¥
	nuyen_base_cost = 6000
	stat_modifier = 2

/obj/item/organ/bioware/mnemonic_enhancer/rating3
	name = "mnemonic enhancer (rating 3)"
	desc = "Maximum capacity memory enhancement for near-eidetic recall and superhuman intuition."
	// Rating 3: 0.3 Essence
	essence_base_cost = 0.30
	// Rating 3: 9,000¥
	nuyen_base_cost = 9000
	stat_modifier = 3

// ============================================================================
// PLATELET FACTORIES - Enhanced healing
// Bioware that produces enhanced platelets for faster clot formation
// and wound healing.
// ============================================================================

/obj/item/organ/bioware/platelet_factories
	name = "platelet factories"
	desc = "Specialized tissue that produces enhanced platelets, dramatically improving the body's ability to heal wounds."
	icon_state = "yourorgans"
	slot = ORGAN_SLOT_PLATELET
	zone = BODY_ZONE_CHEST
	// SR5: Platelet Factories cost 0.2 Essence
	essence_base_cost = 0.20
	// SR5: Platelet Factories cost 17,000¥
	nuyen_base_cost = 17000
	/// How much bleeding is reduced per process tick
	var/bleed_reduction = 1

/obj/item/organ/bioware/platelet_factories/on_life(delta_time, times_fired)
	. = ..()
	if(!owner)
		return
	// Reduce bleeding faster
	for(var/datum/wound/wound as anything in owner.all_wounds)
		if(wound.blood_flow > 0)
			wound.blood_flow = max(0, wound.blood_flow - bleed_reduction * delta_time)

// ============================================================================
// BONE LACING - Enhanced durability
// Bioware that reinforces bones with stronger material, increasing
// durability and unarmed combat effectiveness.
// ============================================================================

/obj/item/organ/bioware/bone_lacing
	name = "bone lacing (calcium)"
	desc = "Bones reinforced with enhanced calcium deposits, providing increased durability and stronger unarmed strikes."
	icon_state = "yourorgans"
	slot = ORGAN_SLOT_BONE_LACING
	zone = BODY_ZONE_CHEST
	// SR5: Bone Lacing (Plastic) costs 0.5 Essence
	essence_base_cost = 0.50
	// SR5: Bone Lacing costs 8,000¥
	nuyen_base_cost = 8000
	// Damage bonus to unarmed attacks
	var/unarmed_bonus = 2
	// Damage reduction from impacts
	var/damage_reduction = 0.05

/obj/item/organ/bioware/bone_lacing/aluminum
	name = "bone lacing (aluminum)"
	desc = "Bones reinforced with aluminum composite, providing good durability with minimal weight increase."
	// SR5: Aluminum bone lacing costs 1.0 Essence
	essence_base_cost = 1.00
	// SR5: Aluminum costs 18,000¥
	nuyen_base_cost = 18000
	unarmed_bonus = 3
	damage_reduction = 0.10

/obj/item/organ/bioware/bone_lacing/titanium
	name = "bone lacing (titanium)"
	desc = "Bones reinforced with titanium alloy, providing excellent durability and significantly enhanced unarmed combat capability."
	// SR5: Titanium bone lacing costs 1.5 Essence
	essence_base_cost = 1.50
	// SR5: Titanium costs 36,000¥
	nuyen_base_cost = 36000
	unarmed_bonus = 4
	damage_reduction = 0.15

/obj/item/organ/bioware/bone_lacing/Insert(mob/living/carbon/receiver, special, drop_if_replaced)
	. = ..()
	if(!.)
		return
	// Add unarmed damage bonus trait or similar effect could go here

/obj/item/organ/bioware/bone_lacing/Remove(mob/living/carbon/organ_owner, special = FALSE)
	// Remove unarmed damage bonus
	return ..()

// ============================================================================
// TAILORED PHEROMONES - Augments Charisma
// Bioware that produces pheromones tailored to influence social interactions.
// ============================================================================

/obj/item/organ/bioware/tailored_pheromones
	name = "tailored pheromones"
	desc = "Specialized glands that produce pheromones designed to subtly influence social interactions."
	icon_state = "yourorgans"
	slot = ORGAN_SLOT_PHEROMONES
	zone = BODY_ZONE_CHEST
	// SR5: Tailored Pheromones cost 0.2 Essence per rating
	essence_base_cost = 0.20
	// SR5: Tailored Pheromones cost 15,750¥ per rating
	nuyen_base_cost = 15750
	modified_stat = /datum/rpg_stat/charisma
	stat_modifier = 1

/obj/item/organ/bioware/tailored_pheromones/rating2
	name = "tailored pheromones (rating 2)"
	desc = "Advanced pheromone glands that produce more potent social influence chemicals."
	// Rating 2: 0.4 Essence
	essence_base_cost = 0.40
	// Rating 2: 31,500¥
	nuyen_base_cost = 31500
	stat_modifier = 2

/obj/item/organ/bioware/tailored_pheromones/rating3
	name = "tailored pheromones (rating 3)"
	desc = "Military-grade pheromone glands that provide significant advantages in social situations."
	// Rating 3: 0.6 Essence
	essence_base_cost = 0.60
	// Rating 3: 47,250¥
	nuyen_base_cost = 47250
	stat_modifier = 3

// ============================================================================
// ENHANCED ARTICULATION - Augments Body
// Bioware that replaces joints with enhanced versions for better
// overall physical resilience.
// ============================================================================

/obj/item/organ/bioware/enhanced_articulation
	name = "enhanced articulation"
	desc = "Replacement joints and connective tissue that improve overall physical resilience and flexibility."
	icon_state = "yourorgans"
	slot = ORGAN_SLOT_ARTICULATION
	zone = BODY_ZONE_CHEST
	// SR5: Enhanced Articulation costs 0.3 Essence
	essence_base_cost = 0.30
	// SR5: Enhanced Articulation costs 12,000¥
	nuyen_base_cost = 12000
	modified_stat = /datum/rpg_stat/body
	stat_modifier = 1

#undef BIOWARE_SOURCE
