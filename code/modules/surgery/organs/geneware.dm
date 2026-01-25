// Geneware Organs - Genetic Modifications
// These represent permanent genetic alterations made during character creation.
// Geneware has lower Essence costs but cannot be upgraded with grades like cyberware.

/obj/item/organ/geneware
	name = "genetic modification"
	desc = "A permanent genetic modification."
	organ_flags = ORGAN_SYNTHETIC
	/// Rating of the geneware (1-3 typically)
	var/rating = 1

// ============================================================================
// GENETIC OPTIMIZATION - Attribute Boosters
// ============================================================================

/obj/item/organ/geneware/genetic_optimization
	name = "Genetic Optimization"
	desc = "Optimized gene sequences that enhance physical performance."
	essence_base_cost = 0.2
	nuyen_base_cost = 10000

/obj/item/organ/geneware/genetic_optimization/rating2
	name = "Genetic Optimization (Rating 2)"
	rating = 2
	essence_base_cost = 0.4
	nuyen_base_cost = 25000

/obj/item/organ/geneware/genetic_optimization/rating3
	name = "Genetic Optimization (Rating 3)"
	rating = 3
	essence_base_cost = 0.6
	nuyen_base_cost = 50000

// ============================================================================
// CATSEYES - Low-light vision genetic modification
// ============================================================================

/obj/item/organ/geneware/catseyes
	name = "Cat's Eyes"
	desc = "Genetically modified pupils that enhance low-light vision capability."
	icon_state = "youreyesonly"
	essence_base_cost = 0.1
	nuyen_base_cost = 4000

/obj/item/organ/geneware/catseyes/Insert(mob/living/carbon/receiver, special, movement_flags)
	. = ..()
	if(ishuman(receiver))
		var/mob/living/carbon/human/H = receiver
		H.see_in_dark = max(H.see_in_dark, 8)

/obj/item/organ/geneware/catseyes/Remove(mob/living/carbon/organ_owner, special)
	if(ishuman(organ_owner))
		var/mob/living/carbon/human/H = organ_owner
		H.see_in_dark = initial(H.see_in_dark)
	return ..()

// ============================================================================
// DOUBLE ELASTIN - Enhanced Flexibility
// ============================================================================

/obj/item/organ/geneware/double_elastin
	name = "Double Elastin"
	desc = "Genetically enhanced elastin production for increased flexibility."
	icon_state = "ci-nutriment"
	essence_base_cost = 0.25
	nuyen_base_cost = 14000

// ============================================================================
// ENHANCED IMMUNE SYSTEM - Disease Resistance
// ============================================================================

/obj/item/organ/geneware/enhanced_immune
	name = "Pathogenic Defense"
	desc = "Genetically enhanced immune system that resists diseases and toxins."
	icon_state = "ci-nutriment"
	essence_base_cost = 0.2
	nuyen_base_cost = 8000

/obj/item/organ/geneware/enhanced_immune/Insert(mob/living/carbon/receiver, special, movement_flags)
	. = ..()
	ADD_TRAIT(receiver, TRAIT_DWARF_TOXIN_RESIST, ORGAN_TRAIT)

/obj/item/organ/geneware/enhanced_immune/Remove(mob/living/carbon/organ_owner, special)
	REMOVE_TRAIT(organ_owner, TRAIT_DWARF_TOXIN_RESIST, ORGAN_TRAIT)
	return ..()

/obj/item/organ/geneware/enhanced_immune/rating2
	name = "Pathogenic Defense (Rating 2)"
	rating = 2
	essence_base_cost = 0.3
	nuyen_base_cost = 20000

/obj/item/organ/geneware/enhanced_immune/rating3
	name = "Pathogenic Defense (Rating 3)"
	rating = 3
	essence_base_cost = 0.5
	nuyen_base_cost = 40000

// ============================================================================
// METABOLIC OPTIMIZER - Enhanced Metabolism
// ============================================================================

/obj/item/organ/geneware/metabolic_optimizer
	name = "Metabolic Arrester"
	desc = "Optimized metabolic processes that resist fatigue and speed recovery."
	icon_state = "ci-nutriment"
	essence_base_cost = 0.2
	nuyen_base_cost = 12000

/obj/item/organ/geneware/metabolic_optimizer/rating2
	name = "Metabolic Arrester (Rating 2)"
	rating = 2
	essence_base_cost = 0.35
	nuyen_base_cost = 30000

// ============================================================================
// QUICK HEALER - Enhanced Regeneration
// ============================================================================

/obj/item/organ/geneware/quick_healer
	name = "Quick Healer"
	desc = "Enhanced cellular regeneration that speeds natural healing."
	icon_state = "youreyesonly"
	essence_base_cost = 0.2
	nuyen_base_cost = 10000

/obj/item/organ/geneware/quick_healer/on_life(seconds_per_tick, times_fired)
	. = ..()
	if(ishuman(owner))
		var/mob/living/carbon/human/H = owner
		// Slowly heal brute and burn damage over time
		if(H.getBruteLoss() > 0 && prob(10 * rating))
			H.heal_overall_damage(brute = 0.5 * rating)
		if(H.getFireLoss() > 0 && prob(10 * rating))
			H.heal_overall_damage(burn = 0.5 * rating)

/obj/item/organ/geneware/quick_healer/rating2
	name = "Quick Healer (Rating 2)"
	rating = 2
	essence_base_cost = 0.35
	nuyen_base_cost = 25000

/obj/item/organ/geneware/quick_healer/rating3
	name = "Quick Healer (Rating 3)"
	rating = 3
	essence_base_cost = 0.5
	nuyen_base_cost = 50000

// ============================================================================
// METAGENIC IMPROVEMENT - Cosmetic and Minor Enhancements
// ============================================================================

/obj/item/organ/geneware/metagenic
	name = "Metagenic Improvement"
	desc = "Minor genetic tweaks for improved appearance and minor physical traits."
	icon_state = "ci-nutriment"
	essence_base_cost = 0.1
	nuyen_base_cost = 5000

// ============================================================================
// THERMOSENSE - Thermal Vision
// ============================================================================

/obj/item/organ/geneware/thermosense
	name = "Thermosense"
	desc = "Genetically modified thermal-sensing pits that detect heat signatures."
	icon_state = "youreyesonly"
	essence_base_cost = 0.15
	nuyen_base_cost = 6000

/obj/item/organ/geneware/thermosense/Insert(mob/living/carbon/receiver, special, movement_flags)
	. = ..()
	ADD_TRAIT(receiver, TRAIT_THERMOGRAPHIC, ORGAN_TRAIT)

/obj/item/organ/geneware/thermosense/Remove(mob/living/carbon/organ_owner, special)
	REMOVE_TRAIT(organ_owner, TRAIT_THERMOGRAPHIC, ORGAN_TRAIT)
	return ..()

// ============================================================================
// CLEAN METABOLISM - Reduced Toxin Buildup
// ============================================================================

/obj/item/organ/geneware/clean_metabolism
	name = "Clean Metabolism"
	desc = "Optimized metabolic pathways that reduce toxin buildup from food and drugs."
	icon_state = "ci-nutriment"
	essence_base_cost = 0.15
	nuyen_base_cost = 7000

// ============================================================================
// EXTENDED VOLUME - Enhanced Lung Capacity
// ============================================================================

/obj/item/organ/geneware/extended_volume
	name = "Extended Volume"
	desc = "Enhanced lung capacity through genetic modification."
	icon_state = "ci-nutriment"
	essence_base_cost = 0.1
	nuyen_base_cost = 5000

/obj/item/organ/geneware/extended_volume/rating2
	name = "Extended Volume (Rating 2)"
	rating = 2
	essence_base_cost = 0.2
	nuyen_base_cost = 12000
