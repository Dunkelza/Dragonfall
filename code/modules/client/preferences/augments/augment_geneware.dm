// Geneware augment items for chargen
// These register geneware organs as selectable augmentations

/datum/augment_item/geneware
	category = AUGMENT_CATEGORY_GENEWARE

// ============================================================================
// GENETIC OPTIMIZATION - Attribute Enhancement
// ============================================================================

/datum/augment_item/geneware/genetic_optimization
	name = "Genetic Optimization"
	description = "Optimized gene sequences that enhance overall physical performance. Rating 1."
	slot = AUGMENT_SLOT_GENE_ATTRIBUTE
	path = /obj/item/organ/geneware/genetic_optimization

/datum/augment_item/geneware/genetic_optimization/rating2
	name = "Genetic Optimization (Rating 2)"
	description = "Advanced genetic optimization for superior physical capabilities."
	path = /obj/item/organ/geneware/genetic_optimization/rating2

/datum/augment_item/geneware/genetic_optimization/rating3
	name = "Genetic Optimization (Rating 3)"
	description = "Peak genetic optimization for near-superhuman physical performance."
	path = /obj/item/organ/geneware/genetic_optimization/rating3

// ============================================================================
// SENSORY ENHANCEMENTS
// ============================================================================

/datum/augment_item/geneware/catseyes
	name = "Cat's Eyes"
	description = "Genetically modified pupils that grant enhanced low-light vision."
	slot = AUGMENT_SLOT_GENE_SENSE
	path = /obj/item/organ/geneware/catseyes

/datum/augment_item/geneware/thermosense
	name = "Thermosense"
	description = "Thermal-sensing genetic modification that detects heat signatures."
	slot = AUGMENT_SLOT_GENE_SENSE
	path = /obj/item/organ/geneware/thermosense

// ============================================================================
// IMMUNE SYSTEM ENHANCEMENTS
// ============================================================================

/datum/augment_item/geneware/pathogenic_defense
	name = "Pathogenic Defense"
	description = "Enhanced immune system that resists diseases and toxins. Rating 1."
	slot = AUGMENT_SLOT_GENE_IMMUNE
	path = /obj/item/organ/geneware/enhanced_immune

/datum/augment_item/geneware/pathogenic_defense/rating2
	name = "Pathogenic Defense (Rating 2)"
	description = "Advanced immune enhancement for superior disease and toxin resistance."
	path = /obj/item/organ/geneware/enhanced_immune/rating2

/datum/augment_item/geneware/pathogenic_defense/rating3
	name = "Pathogenic Defense (Rating 3)"
	description = "Peak immune enhancement providing near-immunity to biological threats."
	path = /obj/item/organ/geneware/enhanced_immune/rating3

/datum/augment_item/geneware/clean_metabolism
	name = "Clean Metabolism"
	description = "Optimized metabolic pathways that reduce toxin buildup from substances."
	slot = AUGMENT_SLOT_GENE_IMMUNE
	path = /obj/item/organ/geneware/clean_metabolism

// ============================================================================
// METABOLIC ENHANCEMENTS
// ============================================================================

/datum/augment_item/geneware/metabolic_arrester
	name = "Metabolic Arrester"
	description = "Optimized metabolic processes that resist fatigue and speed recovery."
	slot = AUGMENT_SLOT_GENE_METABOLIC
	path = /obj/item/organ/geneware/metabolic_optimizer

/datum/augment_item/geneware/metabolic_arrester/rating2
	name = "Metabolic Arrester (Rating 2)"
	description = "Advanced metabolic optimization for extended endurance."
	path = /obj/item/organ/geneware/metabolic_optimizer/rating2

/datum/augment_item/geneware/extended_volume
	name = "Extended Volume"
	description = "Enhanced lung capacity through genetic modification."
	slot = AUGMENT_SLOT_GENE_METABOLIC
	path = /obj/item/organ/geneware/extended_volume

/datum/augment_item/geneware/extended_volume/rating2
	name = "Extended Volume (Rating 2)"
	description = "Superior lung capacity for extended breath-holding and endurance."
	path = /obj/item/organ/geneware/extended_volume/rating2

// ============================================================================
// COSMETIC/FLEXIBILITY
// ============================================================================

/datum/augment_item/geneware/double_elastin
	name = "Double Elastin"
	description = "Genetically enhanced elastin production for increased flexibility."
	slot = AUGMENT_SLOT_GENE_COSMETIC
	path = /obj/item/organ/geneware/double_elastin

/datum/augment_item/geneware/metagenic
	name = "Metagenic Improvement"
	description = "Minor genetic tweaks for improved appearance and minor physical traits."
	slot = AUGMENT_SLOT_GENE_COSMETIC
	path = /obj/item/organ/geneware/metagenic

// ============================================================================
// REGENERATION
// ============================================================================

/datum/augment_item/geneware/quick_healer
	name = "Quick Healer"
	description = "Enhanced cellular regeneration that speeds natural healing."
	slot = AUGMENT_SLOT_GENE_REGENERATION
	path = /obj/item/organ/geneware/quick_healer

/datum/augment_item/geneware/quick_healer/rating2
	name = "Quick Healer (Rating 2)"
	description = "Advanced regeneration for faster wound recovery."
	path = /obj/item/organ/geneware/quick_healer/rating2

/datum/augment_item/geneware/quick_healer/rating3
	name = "Quick Healer (Rating 3)"
	description = "Peak regeneration capability for rapid healing of injuries."
	path = /obj/item/organ/geneware/quick_healer/rating3
