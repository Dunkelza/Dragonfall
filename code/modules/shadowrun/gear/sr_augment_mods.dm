// ============================================================================
// AUGMENT MODIFICATIONS
// Upgrades that can be applied to augments during character creation
// Similar to drone mods, these allow customization of cyberware/bioware
// ============================================================================

/// Base datum for augment modifications
/datum/sr_augment_mod
	/// Display name
	var/name = "Unknown Mod"
	/// Description shown in UI
	var/desc = "No description available."
	/// Cost in nuyen
	var/cost = 0
	/// Additional essence cost (optional, most mods are nuyen-only)
	var/essence_cost = 0
	/// Availability rating
	var/availability = 1
	/// Is this item restricted (R) or forbidden (F)?
	var/legality = ""
	/// Which augment categories can use this mod (empty = all)
	/// Valid categories: bodyparts, organs, bioware, geneware, nanoware
	var/list/allowed_categories = list()
	/// Specific augment IDs that can use this mod (empty = use category)
	var/list/allowed_augments = list()
	/// Maximum times this mod can be applied per augment (1 = once only)
	var/max_per_augment = 1
	/// Icon for UI display
	var/icon = "cog"
	/// Mod category for UI grouping
	var/mod_category = "general"
	/// Only available for cyberlimbs?
	var/cyberlimb_only = FALSE
	/// UI sort order
	var/ui_sort_order = 0
	/// Stat modifications (key = stat name, value = bonus)
	var/list/stat_bonuses = list()

/// Global list of augment mods - lazy initialized
GLOBAL_LIST_EMPTY(sr_augment_mods)

/proc/get_sr_augment_mods()
	if(!length(GLOB.sr_augment_mods))
		GLOB.sr_augment_mods = list()
		for(var/path in subtypesof(/datum/sr_augment_mod))
			var/datum/sr_augment_mod/M = new path()
			if(M.name != "Unknown Mod")
				GLOB.sr_augment_mods[M.type] = M
	return GLOB.sr_augment_mods

// ============================================================================
// CONCEALMENT MODIFICATIONS
// ============================================================================

/datum/sr_augment_mod/concealment
	mod_category = "concealment"
	icon = "eye-slash"

/datum/sr_augment_mod/concealment/shielding
	name = "MAD Shielding"
	desc = "Metal alloy shielding reduces the augment's signature to MAD scanners. -2 to detection tests."
	cost = 3000
	availability = 6
	legality = "R"
	ui_sort_order = 1

/datum/sr_augment_mod/concealment/biocoating
	name = "Biocoating"
	desc = "Organic coating makes the augment appear as natural tissue to scanners. -3 to detection tests."
	cost = 5000
	availability = 8
	legality = "R"
	ui_sort_order = 2

/datum/sr_augment_mod/concealment/concealment_sleeve
	name = "Concealment Sleeve"
	desc = "Synthetic skin overlay for cyberlimbs that perfectly mimics natural appearance."
	cost = 2000
	availability = 4
	cyberlimb_only = TRUE
	allowed_categories = list("bodyparts")
	ui_sort_order = 3

/datum/sr_augment_mod/concealment/obvious_conversion
	name = "Obvious Conversion"
	desc = "Remove concealment in favor of industrial/military appearance. Reduces cost by 10% but makes augment clearly visible."
	cost = -500
	availability = 2
	cyberlimb_only = TRUE
	allowed_categories = list("bodyparts")
	ui_sort_order = 4

// ============================================================================
// ARMOR MODIFICATIONS (Cyberlimb-specific)
// ============================================================================

/datum/sr_augment_mod/armor
	mod_category = "armor"
	icon = "shield-alt"
	cyberlimb_only = TRUE
	allowed_categories = list("bodyparts")

/datum/sr_augment_mod/armor/light_plating
	name = "Light Armor Plating"
	desc = "Adds lightweight ballistic plating to the cyberlimb. +1 Armor."
	cost = 2500
	availability = 6
	stat_bonuses = list("armor" = 1)
	ui_sort_order = 1

/datum/sr_augment_mod/armor/medium_plating
	name = "Medium Armor Plating"
	desc = "Reinforced armor plating for the cyberlimb. +2 Armor, slightly bulky."
	cost = 5000
	availability = 8
	legality = "R"
	stat_bonuses = list("armor" = 2)
	ui_sort_order = 2

/datum/sr_augment_mod/armor/heavy_plating
	name = "Heavy Armor Plating"
	desc = "Military-grade armor plating. +3 Armor, obviously artificial."
	cost = 10000
	availability = 12
	legality = "F"
	stat_bonuses = list("armor" = 3)
	ui_sort_order = 3

// ============================================================================
// SENSOR MODIFICATIONS (Cyberlimb-specific)
// ============================================================================

/datum/sr_augment_mod/sensor
	mod_category = "sensor"
	icon = "satellite-dish"
	cyberlimb_only = TRUE
	allowed_categories = list("bodyparts")

/datum/sr_augment_mod/sensor/basic_sensors
	name = "Basic Sensor Suite"
	desc = "Installs basic environmental sensors in the cyberlimb. +1 Sensor rating."
	cost = 1500
	availability = 4
	stat_bonuses = list("sensor" = 1)
	ui_sort_order = 1

/datum/sr_augment_mod/sensor/enhanced_sensors
	name = "Enhanced Sensor Suite"
	desc = "Advanced multi-spectrum sensors. +2 Sensor rating."
	cost = 4000
	availability = 8
	stat_bonuses = list("sensor" = 2)
	ui_sort_order = 2

/datum/sr_augment_mod/sensor/cyberware_scanner
	name = "Cyberware Scanner"
	desc = "Built-in scanner that detects nearby cyberware. +3 to detecting augmented individuals."
	cost = 3500
	availability = 10
	legality = "R"
	ui_sort_order = 3

/datum/sr_augment_mod/sensor/thermographic
	name = "Thermographic Sensors"
	desc = "Heat-vision capability in the cyberlimb. Useful for detecting hidden individuals."
	cost = 2000
	availability = 6
	ui_sort_order = 4

// ============================================================================
// BULK/CAPACITY MODIFICATIONS
// ============================================================================

/datum/sr_augment_mod/capacity
	mod_category = "capacity"
	icon = "expand-arrows-alt"

/datum/sr_augment_mod/capacity/hidden_compartment
	name = "Hidden Compartment"
	desc = "A concealed storage space within the augment. Can hold small items."
	cost = 2000
	availability = 4
	cyberlimb_only = TRUE
	allowed_categories = list("bodyparts")
	ui_sort_order = 1

/datum/sr_augment_mod/capacity/smuggling_compartment
	name = "Smuggling Compartment"
	desc = "A larger hidden compartment with MAD shielding. Can hold weapons or contraband."
	cost = 5000
	availability = 8
	legality = "R"
	cyberlimb_only = TRUE
	allowed_categories = list("bodyparts")
	ui_sort_order = 2

/datum/sr_augment_mod/capacity/drone_bay
	name = "Micro-Drone Bay"
	desc = "Stores and launches a micro-drone from the cyberlimb."
	cost = 8000
	availability = 10
	legality = "R"
	cyberlimb_only = TRUE
	allowed_categories = list("bodyparts")
	ui_sort_order = 3

// ============================================================================
// UTILITY MODIFICATIONS
// ============================================================================

/datum/sr_augment_mod/utility
	mod_category = "utility"
	icon = "toolbox"

/datum/sr_augment_mod/utility/built_in_commlink
	name = "Built-in Commlink"
	desc = "A commlink integrated directly into the augment. Cannot be lost or stolen."
	cost = 1000
	availability = 4
	ui_sort_order = 1

/datum/sr_augment_mod/utility/grapple_hand
	name = "Grapple Hand"
	desc = "Launches the hand on a 50m retractable cable. For climbing or retrieval."
	cost = 3500
	availability = 8
	cyberlimb_only = TRUE
	allowed_categories = list("bodyparts")
	ui_sort_order = 2

/datum/sr_augment_mod/utility/tool_hand
	name = "Tool Hand"
	desc = "Built-in toolkit replaces fingers. Includes screwdrivers, wrenches, and soldering iron."
	cost = 2000
	availability = 4
	cyberlimb_only = TRUE
	allowed_categories = list("bodyparts")
	ui_sort_order = 3

/datum/sr_augment_mod/utility/gyroscopic_stabilizer
	name = "Gyroscopic Stabilizer"
	desc = "Enhanced balance and stability. +1 dice to avoid knockdown."
	cost = 4000
	availability = 6
	cyberlimb_only = TRUE
	allowed_categories = list("bodyparts")
	ui_sort_order = 4

/datum/sr_augment_mod/utility/shock_absorbers
	name = "Shock Absorbers"
	desc = "Reduces fall damage and impact stress. +2 dice to resist fall damage."
	cost = 3000
	availability = 6
	cyberlimb_only = TRUE
	allowed_categories = list("bodyparts")
	ui_sort_order = 5

// ============================================================================
// COSMETIC MODIFICATIONS
// ============================================================================

/datum/sr_augment_mod/cosmetic
	mod_category = "cosmetic"
	icon = "paint-brush"

/datum/sr_augment_mod/cosmetic/chrome_finish
	name = "Chrome Finish"
	desc = "High-polish chrome plating for a classic cyberpunk look."
	cost = 500
	availability = 2
	cyberlimb_only = TRUE
	allowed_categories = list("bodyparts")
	ui_sort_order = 1

/datum/sr_augment_mod/cosmetic/matte_black
	name = "Matte Black Finish"
	desc = "Non-reflective matte black coating. Professional and stealthy."
	cost = 750
	availability = 2
	cyberlimb_only = TRUE
	allowed_categories = list("bodyparts")
	ui_sort_order = 2

/datum/sr_augment_mod/cosmetic/holographic_display
	name = "Holographic Display"
	desc = "Customizable holographic patterns flow across the surface."
	cost = 1500
	availability = 4
	cyberlimb_only = TRUE
	allowed_categories = list("bodyparts")
	ui_sort_order = 3

/datum/sr_augment_mod/cosmetic/led_illumination
	name = "LED Illumination"
	desc = "Programmable LED lights integrated into the augment surface."
	cost = 800
	availability = 2
	cyberlimb_only = TRUE
	allowed_categories = list("bodyparts")
	ui_sort_order = 4

/datum/sr_augment_mod/cosmetic/synthetic_skin
	name = "Synthetic Skin Upgrade"
	desc = "Premium synthetic skin that perfectly mimics natural tissue texture and warmth."
	cost = 2500
	availability = 6
	cyberlimb_only = TRUE
	allowed_categories = list("bodyparts")
	ui_sort_order = 5

// ============================================================================
// ENHANCEMENT MODIFICATIONS (Available to most augments)
// ============================================================================

/datum/sr_augment_mod/enhancement
	mod_category = "enhancement"
	icon = "bolt"

/datum/sr_augment_mod/enhancement/overclocked
	name = "Overclocked"
	desc = "Push the augment beyond factory specs. +10% effectiveness but requires more maintenance."
	cost = 3000
	availability = 8
	ui_sort_order = 1

/datum/sr_augment_mod/enhancement/optimized_calibration
	name = "Optimized Calibration"
	desc = "Fine-tuned calibration for maximum efficiency. Reduces Essence cost by 0.1."
	cost = 4000
	availability = 10
	essence_cost = -0.1
	ui_sort_order = 2

/datum/sr_augment_mod/enhancement/redundant_systems
	name = "Redundant Systems"
	desc = "Backup systems ensure continued function if primary systems are damaged."
	cost = 2500
	availability = 6
	ui_sort_order = 3

/datum/sr_augment_mod/enhancement/wireless_inhibitor
	name = "Wireless Inhibitor"
	desc = "Blocks wireless connectivity. Immune to hacking but loses wireless features."
	cost = 500
	availability = 2
	ui_sort_order = 4

/datum/sr_augment_mod/enhancement/stealth_wireless
	name = "Stealth Wireless"
	desc = "Encrypted low-emission wireless. -2 dice to detect or hack this augment."
	cost = 2000
	availability = 8
	legality = "R"
	ui_sort_order = 5

// ============================================================================
// BIOWARE-SPECIFIC MODIFICATIONS
// ============================================================================

/datum/sr_augment_mod/bioware
	mod_category = "bioware"
	icon = "dna"
	allowed_categories = list("bioware")

/datum/sr_augment_mod/bioware/cultured
	name = "Cultured Growth"
	desc = "Bioware grown from your own tissue. Reduces Essence cost by 10%."
	cost = 5000
	availability = 8
	essence_cost = -0.1
	ui_sort_order = 1

/datum/sr_augment_mod/bioware/enhanced_rejection_suppression
	name = "Enhanced Rejection Suppression"
	desc = "Advanced immunosuppression integration. -0.05 Essence cost."
	cost = 3000
	availability = 6
	essence_cost = -0.05
	ui_sort_order = 2

/datum/sr_augment_mod/bioware/symbiotic_integration
	name = "Symbiotic Integration"
	desc = "The bioware forms a symbiotic relationship with your body. +1 to recovery tests."
	cost = 4000
	availability = 10
	ui_sort_order = 3

/datum/sr_augment_mod/bioware/accelerated_metabolism
	name = "Accelerated Metabolism"
	desc = "Enhanced nutrient processing. The bioware works 20% more efficiently."
	cost = 2500
	availability = 6
	ui_sort_order = 4

// ============================================================================
// ORGAN-SPECIFIC MODIFICATIONS
// ============================================================================

/datum/sr_augment_mod/organ
	mod_category = "organ"
	icon = "lungs"
	allowed_categories = list("organs")

/datum/sr_augment_mod/organ/reinforced_housing
	name = "Reinforced Housing"
	desc = "Armored casing protects the organ from damage. +2 to resist organ damage."
	cost = 3000
	availability = 6
	ui_sort_order = 1

/datum/sr_augment_mod/organ/quick_disconnect
	name = "Quick Disconnect System"
	desc = "Allows rapid removal and replacement. Useful for field repairs."
	cost = 1500
	availability = 4
	ui_sort_order = 2

/datum/sr_augment_mod/organ/nanofilament_connections
	name = "Nanofilament Connections"
	desc = "Ultra-fine neural connections. -0.05 Essence cost and faster response."
	cost = 4000
	availability = 10
	essence_cost = -0.05
	ui_sort_order = 3

/datum/sr_augment_mod/organ/self_diagnostic
	name = "Self-Diagnostic System"
	desc = "Built-in monitoring alerts you to malfunctions before they become critical."
	cost = 1000
	availability = 4
	ui_sort_order = 4

// ============================================================================
// GENEWARE-SPECIFIC MODIFICATIONS
// ============================================================================

/datum/sr_augment_mod/geneware
	mod_category = "geneware"
	icon = "seedling"
	allowed_categories = list("geneware")

/datum/sr_augment_mod/geneware/stable_expression
	name = "Stable Gene Expression"
	desc = "Locked-in genetic modifications resist mutation and degradation."
	cost = 2000
	availability = 6
	ui_sort_order = 1

/datum/sr_augment_mod/geneware/enhanced_expression
	name = "Enhanced Expression"
	desc = "Boosted gene expression for stronger effects. +15% effectiveness."
	cost = 4000
	availability = 10
	ui_sort_order = 2

/datum/sr_augment_mod/geneware/reversible_modification
	name = "Reversible Modification"
	desc = "Gene therapy includes reversal sequence. Can be removed without surgery."
	cost = 3000
	availability = 8
	ui_sort_order = 3

/datum/sr_augment_mod/geneware/multi_generational
	name = "Multi-Generational Lock"
	desc = "Modifications are heritable. Your children may inherit these traits."
	cost = 5000
	availability = 12
	legality = "R"
	ui_sort_order = 4

// ============================================================================
// NANOWARE-SPECIFIC MODIFICATIONS
// ============================================================================

/datum/sr_augment_mod/nanoware
	mod_category = "nanoware"
	icon = "microscope"
	allowed_categories = list("nanoware")

/datum/sr_augment_mod/nanoware/extended_swarm
	name = "Extended Swarm"
	desc = "50% more nanites for greater coverage and faster effects."
	cost = 3000
	availability = 8
	ui_sort_order = 1

/datum/sr_augment_mod/nanoware/hardened_nanites
	name = "Hardened Nanites"
	desc = "EMP-resistant nanites. +4 to resist electromagnetic damage."
	cost = 2500
	availability = 10
	ui_sort_order = 2

/datum/sr_augment_mod/nanoware/autonomous_repair
	name = "Autonomous Repair Protocol"
	desc = "Nanites can self-repair damaged units. Extends operational lifespan."
	cost = 4000
	availability = 10
	ui_sort_order = 3

/datum/sr_augment_mod/nanoware/stealth_swarm
	name = "Stealth Swarm"
	desc = "Low-emission nanites are harder to detect. -3 to detection tests."
	cost = 3500
	availability = 12
	legality = "R"
	ui_sort_order = 4

/datum/sr_augment_mod/nanoware/aggressive_response
	name = "Aggressive Response Protocol"
	desc = "Nanites actively attack foreign nanites and pathogens. +2 to resist infection."
	cost = 2000
	availability = 6
	ui_sort_order = 5
