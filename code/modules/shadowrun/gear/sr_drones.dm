/// Shadowrun 5e Drone Catalog
/// This file defines drones available during character creation.
/// Drones are primarily used by riggers but can be purchased by anyone with enough nuyen.

/// Drone categories for UI organization
#define SR_DRONE_CATEGORY_MICRO "micro"
#define SR_DRONE_CATEGORY_SMALL "small"
#define SR_DRONE_CATEGORY_MEDIUM "medium"
#define SR_DRONE_CATEGORY_LARGE "large"
#define SR_DRONE_CATEGORY_ANTHRO "anthroform"

/// Base datum for SR5 drones
/datum/sr_drone
	/// Display name
	var/name = "Unknown Drone"
	/// Description shown in UI
	var/desc = "No description available."
	/// Cost in nuyen
	var/cost = 0
	/// Availability rating (1-20, higher = harder to get)
	var/availability = 1
	/// Is this item restricted (R) or forbidden (F)?
	var/legality = ""
	/// Size category for UI grouping
	var/category = SR_DRONE_CATEGORY_SMALL
	/// Drone type/role
	var/drone_type = "Utility"
	/// Body attribute (durability)
	var/body = 1
	/// Handling attribute (maneuverability)
	var/handling = 1
	/// Speed attribute
	var/speed = 1
	/// Pilot rating (autonomous capability)
	var/pilot = 1
	/// Sensor rating
	var/sensor = 1
	/// Armor rating
	var/armor = 0
	/// Device rating (for matrix stats)
	var/device_rating = 1
	/// Path to spawn this drone (if applicable)
	var/mob_path = null
	/// Can be jumped into by rigger?
	var/riggable = TRUE
	/// UI sort order
	var/ui_sort_order = 0

/// Global list of drones - lazy initialized
GLOBAL_LIST_EMPTY(sr_drones)

/proc/get_sr_drones()
	if(!length(GLOB.sr_drones))
		GLOB.sr_drones = list()
		for(var/path in subtypesof(/datum/sr_drone))
			var/datum/sr_drone/D = new path()
			if(D.name != "Unknown Drone")
				GLOB.sr_drones[D.type] = D
	return GLOB.sr_drones

// ============================================================================
// MICRO DRONES - Tiny surveillance and utility drones
// ============================================================================

/datum/sr_drone/micro
	category = SR_DRONE_CATEGORY_MICRO
	drone_type = "Surveillance"

/datum/sr_drone/micro/flyspy
	name = "MCT Fly-Spy"
	desc = "A tiny insect-sized surveillance drone. Nearly invisible, perfect for reconnaissance. Very fragile."
	cost = 2000
	availability = 8
	body = 1
	handling = 4
	speed = 3
	pilot = 3
	sensor = 3
	armor = 0
	device_rating = 3
	ui_sort_order = 10

/datum/sr_drone/micro/kanmushi
	name = "Shiawase Kanmushi"
	desc = "An extremely small surveillance drone disguised as a beetle. Excellent sensor package."
	cost = 1000
	availability = 6
	body = 1
	handling = 4
	speed = 2
	pilot = 3
	sensor = 3
	armor = 0
	device_rating = 2
	ui_sort_order = 11

/datum/sr_drone/micro/gnat
	name = "EVO Gnat"
	desc = "A cheap disposable micro-drone for quick surveillance ops."
	cost = 450
	availability = 4
	body = 1
	handling = 3
	speed = 2
	pilot = 2
	sensor = 2
	armor = 0
	device_rating = 1
	ui_sort_order = 12

// ============================================================================
// SMALL DRONES - Compact utility and recon drones
// ============================================================================

/datum/sr_drone/small
	category = SR_DRONE_CATEGORY_SMALL

/datum/sr_drone/small/rotodrone
	name = "MCT-Nissan Roto-Drone"
	desc = "A versatile small rotorcraft drone. Can be armed with light weapons. Popular among riggers."
	cost = 5000
	availability = 6
	drone_type = "Combat/Recon"
	body = 4
	handling = 4
	speed = 4
	pilot = 3
	sensor = 3
	armor = 4
	device_rating = 3
	ui_sort_order = 20

/datum/sr_drone/small/crawler
	name = "Aztechnology Crawler"
	desc = "A small wheeled drone for urban reconnaissance. Quiet and unobtrusive."
	cost = 4000
	availability = 4
	drone_type = "Recon"
	body = 4
	handling = 5
	speed = 3
	pilot = 3
	sensor = 3
	armor = 2
	device_rating = 3
	ui_sort_order = 21

/datum/sr_drone/small/lockheed_optic
	name = "Lockheed Optic-X2"
	desc = "An advanced optical surveillance drone with stealth features and thermal imaging."
	cost = 21000
	availability = 10
	legality = "R"
	drone_type = "Surveillance"
	body = 3
	handling = 4
	speed = 4
	pilot = 4
	sensor = 5
	armor = 2
	device_rating = 4
	ui_sort_order = 22

/datum/sr_drone/small/ferret
	name = "Cyberspace Designs Ferret RPD-1X"
	desc = "A dedicated electronic warfare drone for matrix support operations."
	cost = 3000
	availability = 6
	drone_type = "Electronic Warfare"
	body = 3
	handling = 3
	speed = 3
	pilot = 3
	sensor = 3
	armor = 0
	device_rating = 3
	ui_sort_order = 23

// ============================================================================
// MEDIUM DRONES - Workhorse combat and utility drones
// ============================================================================

/datum/sr_drone/medium
	category = SR_DRONE_CATEGORY_MEDIUM

/datum/sr_drone/medium/steel_lynx
	name = "Ares Steel Lynx Combat Drone"
	desc = "A powerful combat drone with heavy armor and weapon mounts. The rigger's best friend in a firefight."
	cost = 25000
	availability = 10
	legality = "R"
	drone_type = "Combat"
	body = 6
	handling = 4
	speed = 4
	pilot = 3
	sensor = 3
	armor = 12
	device_rating = 4
	ui_sort_order = 30

/datum/sr_drone/medium/doberman
	name = "Ares Duelist Doberman"
	desc = "A reliable medium combat drone. Good balance of firepower and mobility."
	cost = 5000
	availability = 6
	legality = "R"
	drone_type = "Combat"
	body = 4
	handling = 5
	speed = 3
	pilot = 3
	sensor = 3
	armor = 4
	device_rating = 3
	ui_sort_order = 31

/datum/sr_drone/medium/knight_errant
	name = "Knight Errant K-9"
	desc = "A security patrol drone modeled after a large dog. Used by corporate security."
	cost = 12000
	availability = 8
	legality = "R"
	drone_type = "Security"
	body = 5
	handling = 4
	speed = 4
	pilot = 4
	sensor = 4
	armor = 6
	device_rating = 4
	ui_sort_order = 32

/datum/sr_drone/medium/proletarian
	name = "Mitsuhama Proletarian"
	desc = "An industrial utility drone designed for heavy lifting and construction work."
	cost = 6000
	availability = 4
	drone_type = "Utility"
	body = 6
	handling = 3
	speed = 2
	pilot = 2
	sensor = 2
	armor = 6
	device_rating = 2
	ui_sort_order = 33

// ============================================================================
// LARGE DRONES - Heavy combat and transport drones
// ============================================================================

/datum/sr_drone/large
	category = SR_DRONE_CATEGORY_LARGE

/datum/sr_drone/large/dalmatian
	name = "Ares Dalmatian Firefighting Drone"
	desc = "A large utility drone equipped for firefighting and rescue operations."
	cost = 10000
	availability = 6
	drone_type = "Utility"
	body = 6
	handling = 3
	speed = 3
	pilot = 3
	sensor = 3
	armor = 8
	device_rating = 3
	ui_sort_order = 40

/datum/sr_drone/large/condor
	name = "Aztechnology Hedgehog Condor"
	desc = "A large aerial drone capable of carrying passengers or heavy cargo."
	cost = 30000
	availability = 12
	legality = "R"
	drone_type = "Transport"
	body = 8
	handling = 3
	speed = 5
	pilot = 4
	sensor = 3
	armor = 6
	device_rating = 4
	ui_sort_order = 41

/datum/sr_drone/large/dassault
	name = "Dassault Jaeger"
	desc = "A military-grade combat drone with advanced targeting systems."
	cost = 85000
	availability = 16
	legality = "F"
	drone_type = "Military"
	body = 8
	handling = 3
	speed = 5
	pilot = 5
	sensor = 5
	armor = 15
	device_rating = 5
	ui_sort_order = 42

// ============================================================================
// ANTHROFORM DRONES - Humanoid drones
// ============================================================================

/datum/sr_drone/anthro
	category = SR_DRONE_CATEGORY_ANTHRO
	drone_type = "Humanoid"

/datum/sr_drone/anthro/bust_a_move
	name = "Horizon Bust-A-Move"
	desc = "An entertainment anthroform drone. Can be used for distraction or social infiltration."
	cost = 3000
	availability = 6
	body = 2
	handling = 3
	speed = 2
	pilot = 2
	sensor = 2
	armor = 0
	device_rating = 2
	ui_sort_order = 50

/datum/sr_drone/anthro/criado
	name = "Renraku Criado"
	desc = "A servant anthroform drone designed for domestic tasks. Surprisingly capable."
	cost = 4000
	availability = 4
	body = 3
	handling = 3
	speed = 2
	pilot = 3
	sensor = 2
	armor = 2
	device_rating = 3
	ui_sort_order = 51

/datum/sr_drone/anthro/guardian
	name = "MCT Guardian"
	desc = "A security anthroform drone. Human-sized with light armor and combat capability."
	cost = 18000
	availability = 12
	legality = "R"
	body = 4
	handling = 3
	speed = 3
	pilot = 4
	sensor = 3
	armor = 8
	device_rating = 4
	ui_sort_order = 52

// ============================================================================
// DRONE MODIFICATIONS
// Upgrades that can be applied to drones during character creation
// ============================================================================

/// Base datum for drone modifications
/datum/sr_drone_mod
	/// Display name
	var/name = "Unknown Mod"
	/// Description shown in UI
	var/desc = "No description available."
	/// Cost in nuyen
	var/cost = 0
	/// Availability rating
	var/availability = 1
	/// Is this item restricted (R) or forbidden (F)?
	var/legality = ""
	/// Which drone categories can use this mod (empty = all)
	var/list/allowed_categories = list()
	/// Maximum times this mod can be applied per drone (1 = once only)
	var/max_per_drone = 1
	/// Stat modifications (key = stat name, value = bonus)
	var/list/stat_bonuses = list()
	/// Icon for UI display
	var/icon = "cog"
	/// Mod category for UI grouping
	var/mod_category = "general"
	/// UI sort order
	var/ui_sort_order = 0

/// Global list of drone mods - lazy initialized
GLOBAL_LIST_EMPTY(sr_drone_mods)

/proc/get_sr_drone_mods()
	if(!length(GLOB.sr_drone_mods))
		GLOB.sr_drone_mods = list()
		for(var/path in subtypesof(/datum/sr_drone_mod))
			var/datum/sr_drone_mod/M = new path()
			if(M.name != "Unknown Mod")
				GLOB.sr_drone_mods[M.type] = M
	return GLOB.sr_drone_mods

// ============================================================================
// ARMOR MODIFICATIONS
// ============================================================================

/datum/sr_drone_mod/armor
	mod_category = "armor"
	icon = "shield-alt"

/datum/sr_drone_mod/armor/light_plating
	name = "Light Armor Plating"
	desc = "Adds lightweight ballistic plating to the drone chassis. +1 Armor."
	cost = 500
	availability = 4
	stat_bonuses = list("armor" = 1)
	ui_sort_order = 1

/datum/sr_drone_mod/armor/medium_plating
	name = "Medium Armor Plating"
	desc = "Reinforced armor plating provides solid protection. +2 Armor."
	cost = 1500
	availability = 8
	stat_bonuses = list("armor" = 2)
	ui_sort_order = 2

/datum/sr_drone_mod/armor/heavy_plating
	name = "Heavy Armor Plating"
	desc = "Military-grade armor plating. Reduces speed slightly. +4 Armor, -1 Speed."
	cost = 4000
	availability = 12
	legality = "R"
	stat_bonuses = list("armor" = 4, "speed" = -1)
	allowed_categories = list("medium", "large", "anthroform")
	ui_sort_order = 3

/datum/sr_drone_mod/armor/concealed_armor
	name = "Concealed Armor"
	desc = "Hidden armor that doesn't affect the drone's appearance. +1 Armor."
	cost = 1000
	availability = 6
	stat_bonuses = list("armor" = 1)
	ui_sort_order = 4

// ============================================================================
// SENSOR MODIFICATIONS
// ============================================================================

/datum/sr_drone_mod/sensor
	mod_category = "sensor"
	icon = "satellite-dish"

/datum/sr_drone_mod/sensor/enhanced_sensors
	name = "Enhanced Sensor Array"
	desc = "Upgraded sensors with improved range and resolution. +1 Sensor."
	cost = 1000
	availability = 4
	stat_bonuses = list("sensor" = 1)
	ui_sort_order = 1

/datum/sr_drone_mod/sensor/military_sensors
	name = "Military Sensor Suite"
	desc = "Military-grade sensor package with thermal and ultrasound. +2 Sensor."
	cost = 3000
	availability = 10
	legality = "R"
	stat_bonuses = list("sensor" = 2)
	ui_sort_order = 2

/datum/sr_drone_mod/sensor/cyberware_scanner
	name = "Cyberware Scanner"
	desc = "Specialized sensors for detecting cyberware and implants. +1 Sensor."
	cost = 2000
	availability = 8
	legality = "R"
	stat_bonuses = list("sensor" = 1)
	ui_sort_order = 3

// ============================================================================
// SPEED/HANDLING MODIFICATIONS
// ============================================================================

/datum/sr_drone_mod/mobility
	mod_category = "mobility"
	icon = "tachometer-alt"

/datum/sr_drone_mod/mobility/speed_upgrade
	name = "Speed Enhancement"
	desc = "Improved motors and aerodynamics. +1 Speed."
	cost = 1000
	availability = 4
	stat_bonuses = list("speed" = 1)
	ui_sort_order = 1

/datum/sr_drone_mod/mobility/racing_kit
	name = "Racing Kit"
	desc = "High-performance modifications for maximum speed. +2 Speed, -1 Body."
	cost = 2500
	availability = 8
	stat_bonuses = list("speed" = 2, "body" = -1)
	ui_sort_order = 2

/datum/sr_drone_mod/mobility/handling_upgrade
	name = "Handling Enhancement"
	desc = "Improved gyroscopes and control systems. +1 Handling."
	cost = 800
	availability = 4
	stat_bonuses = list("handling" = 1)
	ui_sort_order = 3

/datum/sr_drone_mod/mobility/all_terrain
	name = "All-Terrain Kit"
	desc = "Modifications for rough terrain operation. +1 Handling, +1 Body."
	cost = 1500
	availability = 6
	stat_bonuses = list("handling" = 1, "body" = 1)
	allowed_categories = list("small", "medium", "large")
	ui_sort_order = 4

// ============================================================================
// PILOT/SOFTWARE MODIFICATIONS
// ============================================================================

/datum/sr_drone_mod/software
	mod_category = "software"
	icon = "microchip"

/datum/sr_drone_mod/software/pilot_upgrade
	name = "Pilot Upgrade"
	desc = "Enhanced autonomous software. +1 Pilot."
	cost = 2000
	availability = 6
	stat_bonuses = list("pilot" = 1)
	ui_sort_order = 1

/datum/sr_drone_mod/software/advanced_pilot
	name = "Advanced Pilot Suite"
	desc = "Military-grade autonomous operation software. +2 Pilot."
	cost = 5000
	availability = 12
	legality = "R"
	stat_bonuses = list("pilot" = 2)
	ui_sort_order = 2

/datum/sr_drone_mod/software/evasion_protocol
	name = "Evasion Protocol"
	desc = "Combat evasion algorithms. +1 Handling when under fire."
	cost = 1500
	availability = 8
	stat_bonuses = list("handling" = 1)
	ui_sort_order = 3

// ============================================================================
// WEAPON MODIFICATIONS
// ============================================================================

/datum/sr_drone_mod/weapon
	mod_category = "weapon"
	icon = "crosshairs"

/datum/sr_drone_mod/weapon/light_mount
	name = "Light Weapon Mount"
	desc = "A mount for pistol-sized weapons. Requires medium+ drone."
	cost = 500
	availability = 6
	legality = "R"
	allowed_categories = list("medium", "large", "anthroform")
	ui_sort_order = 1

/datum/sr_drone_mod/weapon/standard_mount
	name = "Standard Weapon Mount"
	desc = "A mount for SMG or rifle-sized weapons. Requires large+ drone."
	cost = 1500
	availability = 10
	legality = "R"
	allowed_categories = list("large", "anthroform")
	ui_sort_order = 2

/datum/sr_drone_mod/weapon/heavy_mount
	name = "Heavy Weapon Mount"
	desc = "A mount for machine guns or launchers. Requires large drone."
	cost = 4000
	availability = 16
	legality = "F"
	allowed_categories = list("large")
	ui_sort_order = 3

// ============================================================================
// UTILITY MODIFICATIONS
// ============================================================================

/datum/sr_drone_mod/utility
	mod_category = "utility"
	icon = "toolbox"

/datum/sr_drone_mod/utility/smuggling_compartment
	name = "Smuggling Compartment"
	desc = "A hidden compartment for carrying small items."
	cost = 500
	availability = 6
	allowed_categories = list("small", "medium", "large", "anthroform")
	ui_sort_order = 1

/datum/sr_drone_mod/utility/gecko_tips
	name = "Gecko Tips"
	desc = "Allows the drone to climb walls and ceilings."
	cost = 750
	availability = 6
	allowed_categories = list("micro", "small")
	ui_sort_order = 2

/datum/sr_drone_mod/utility/chameleon_coating
	name = "Chameleon Coating"
	desc = "Color-changing coating for improved stealth. +1 to stealth tests."
	cost = 2000
	availability = 10
	legality = "R"
	ui_sort_order = 3

/datum/sr_drone_mod/utility/medical_kit
	name = "Medical Kit Integration"
	desc = "Allows the drone to perform basic first aid."
	cost = 1000
	availability = 4
	allowed_categories = list("small", "medium", "large", "anthroform")
	ui_sort_order = 4

/datum/sr_drone_mod/utility/repair_kit
	name = "Repair Kit Integration"
	desc = "Allows the drone to perform basic repairs on other drones."
	cost = 1000
	availability = 4
	allowed_categories = list("medium", "large", "anthroform")
	ui_sort_order = 5

#undef SR_DRONE_CATEGORY_MICRO
#undef SR_DRONE_CATEGORY_SMALL
#undef SR_DRONE_CATEGORY_MEDIUM
#undef SR_DRONE_CATEGORY_LARGE
#undef SR_DRONE_CATEGORY_ANTHRO
