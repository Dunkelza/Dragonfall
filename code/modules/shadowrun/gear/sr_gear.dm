/// Shadowrun 5e Starting Gear Catalog
/// This file defines gear items available during character creation.
/// Each item has a name, description, cost, availability, and optional item path for spawning.

/// Gear categories for UI organization
#define SR_GEAR_CATEGORY_WEAPONS "weapons"
#define SR_GEAR_CATEGORY_ARMOR "armor"
#define SR_GEAR_CATEGORY_ELECTRONICS "electronics"
#define SR_GEAR_CATEGORY_TOOLS "tools"
#define SR_GEAR_CATEGORY_SURVIVAL "survival"
#define SR_GEAR_CATEGORY_MEDICAL "medical"

/// Base datum for SR5 gear items
/datum/sr_gear
	/// Display name
	var/name = "Unknown Gear"
	/// Description shown in UI
	var/desc = "No description available."
	/// Cost in nuyen
	var/cost = 0
	/// Availability rating (1-20, higher = harder to get)
	var/availability = 1
	/// Is this item restricted (R) or forbidden (F)?
	var/legality = "" // "", "R", or "F"
	/// Category for UI grouping
	var/category = SR_GEAR_CATEGORY_TOOLS
	/// Subcategory for finer organization
	var/subcategory = ""
	/// Path to spawn this item (if applicable)
	var/item_path = null
	/// Can this be purchased multiple times?
	var/stackable = FALSE
	/// Maximum quantity per purchase (for stackable)
	var/max_quantity = 1
	/// UI sort order
	var/ui_sort_order = 0

// ============================================================================
// WEAPONS - Firearms
// ============================================================================

/datum/sr_gear/weapon
	category = SR_GEAR_CATEGORY_WEAPONS

// --- Holdout Pistols ---
/datum/sr_gear/weapon/holdout_pistol
	name = "Streetline Special"
	desc = "A cheap, easily concealed holdout pistol. Low damage but very concealable."
	cost = 120
	availability = 4
	subcategory = "Holdout Pistols"
	item_path = /obj/item/gun/ballistic/automatic/pistol
	ui_sort_order = 10

// --- Light Pistols ---
/datum/sr_gear/weapon/light_pistol
	name = "Colt America L36"
	desc = "A reliable light pistol with good accuracy. Standard sidearm for many runners."
	cost = 320
	availability = 4
	subcategory = "Light Pistols"
	item_path = /obj/item/gun/ballistic/automatic/pistol
	ui_sort_order = 20

/datum/sr_gear/weapon/light_pistol/beretta
	name = "Beretta 201T"
	desc = "A quality light pistol with burst-fire capability."
	cost = 350
	availability = 6
	legality = "R"
	ui_sort_order = 21

// --- Heavy Pistols ---
/datum/sr_gear/weapon/heavy_pistol
	name = "Ares Predator V"
	desc = "The iconic heavy pistol of shadowrunners. Reliable, powerful, and intimidating."
	cost = 725
	availability = 5
	legality = "R"
	subcategory = "Heavy Pistols"
	item_path = /obj/item/gun/ballistic/automatic/pistol/m1911
	ui_sort_order = 30

/datum/sr_gear/weapon/heavy_pistol/ruger
	name = "Ruger Super Warhawk"
	desc = "A massive revolver chambered for heavy rounds. When you need to make a statement."
	cost = 400
	availability = 4
	legality = "R"
	item_path = /obj/item/gun/ballistic/revolver
	ui_sort_order = 31

// --- SMGs ---
/datum/sr_gear/weapon/smg
	name = "Ares Crusader II"
	desc = "A compact machine pistol with excellent rate of fire."
	cost = 830
	availability = 9
	legality = "R"
	subcategory = "Submachine Guns"
	item_path = /obj/item/gun/ballistic/automatic/pistol/aps
	ui_sort_order = 40

/datum/sr_gear/weapon/smg/ingram
	name = "Ingram Smartgun X"
	desc = "The classic street sweeper. Includes integrated smartgun system."
	cost = 1100
	availability = 6
	legality = "R"
	ui_sort_order = 41

// --- Assault Rifles ---
/datum/sr_gear/weapon/assault_rifle
	name = "Ares Alpha"
	desc = "A top-tier assault rifle with integrated grenade launcher. Standard for corporate security."
	cost = 2650
	availability = 11
	legality = "F"
	subcategory = "Assault Rifles"
	item_path = /obj/item/gun/ballistic/automatic/ar
	ui_sort_order = 50

/datum/sr_gear/weapon/assault_rifle/ak
	name = "AK-97"
	desc = "The tried-and-true assault rifle. Reliable in any conditions."
	cost = 1250
	availability = 4
	legality = "R"
	ui_sort_order = 51

// --- Shotguns ---
/datum/sr_gear/weapon/shotgun
	name = "Remington 990"
	desc = "A dependable pump-action shotgun. Devastating at close range."
	cost = 950
	availability = 4
	legality = "R"
	subcategory = "Shotguns"
	item_path = /obj/item/gun/ballistic/shotgun
	ui_sort_order = 60

/datum/sr_gear/weapon/shotgun/auto
	name = "Enfield AS-7"
	desc = "A semi-automatic shotgun with drum magazine. Room clearing specialist."
	cost = 1100
	availability = 12
	legality = "F"
	ui_sort_order = 61

// --- Melee Weapons ---
/datum/sr_gear/weapon/melee
	subcategory = "Melee Weapons"

/datum/sr_gear/weapon/melee/combat_knife
	name = "Combat Knife"
	desc = "A sturdy combat knife. Essential survival tool and backup weapon."
	cost = 300
	availability = 4
	item_path = /obj/item/knife/combat
	ui_sort_order = 70

/datum/sr_gear/weapon/melee/katana
	name = "Katana"
	desc = "A traditional Japanese sword. Popular among street samurai."
	cost = 1000
	availability = 9
	legality = "R"
	item_path = /obj/item/katana
	ui_sort_order = 71

/datum/sr_gear/weapon/melee/stun_baton
	name = "Stun Baton"
	desc = "An electrified baton for non-lethal takedowns."
	cost = 750
	availability = 6
	legality = "R"
	item_path = /obj/item/melee/baton/security
	ui_sort_order = 72

// ============================================================================
// ARMOR
// ============================================================================

/datum/sr_gear/armor
	category = SR_GEAR_CATEGORY_ARMOR

/datum/sr_gear/armor/clothing
	name = "Armored Clothing"
	desc = "Stylish clothing with concealed ballistic weave. Provides light protection without looking tactical."
	cost = 450
	availability = 2
	subcategory = "Light Armor"
	item_path = /obj/item/clothing/suit/armor/vest
	ui_sort_order = 10

/datum/sr_gear/armor/jacket
	name = "Armor Jacket"
	desc = "A reinforced jacket providing solid protection. The runner's standard."
	cost = 1000
	availability = 2
	subcategory = "Light Armor"
	item_path = /obj/item/clothing/suit/armor/vest
	ui_sort_order = 11

/datum/sr_gear/armor/vest
	name = "Armor Vest"
	desc = "A tactical vest with ceramic plates. Worn over clothing for maximum protection."
	cost = 500
	availability = 4
	subcategory = "Light Armor"
	item_path = /obj/item/clothing/suit/armor/vest
	ui_sort_order = 12

/datum/sr_gear/armor/lined_coat
	name = "Lined Coat"
	desc = "A long coat with hidden armor panels. Classic noir style with practical protection."
	cost = 900
	availability = 4
	subcategory = "Light Armor"
	item_path = /obj/item/clothing/suit/armor/vest
	ui_sort_order = 13

/datum/sr_gear/armor/full_body
	name = "Full Body Armor"
	desc = "Complete tactical armor system. Heavy but provides excellent protection."
	cost = 2000
	availability = 12
	legality = "R"
	subcategory = "Heavy Armor"
	item_path = /obj/item/clothing/suit/armor/bulletproof
	ui_sort_order = 20

/datum/sr_gear/armor/riot
	name = "Riot Armor"
	desc = "Law enforcement grade armor with integrated shield mounts."
	cost = 5000
	availability = 14
	legality = "R"
	subcategory = "Heavy Armor"
	item_path = /obj/item/clothing/suit/armor/riot
	ui_sort_order = 21

// --- Helmets ---
/datum/sr_gear/armor/helmet
	name = "Ballistic Helmet"
	desc = "A reinforced helmet protecting against head trauma and bullets."
	cost = 250
	availability = 4
	subcategory = "Helmets"
	item_path = /obj/item/clothing/head/helmet
	ui_sort_order = 30

/datum/sr_gear/armor/helmet/full
	name = "Full Helmet"
	desc = "Complete head protection with integrated comms and HUD mount."
	cost = 500
	availability = 8
	legality = "R"
	item_path = /obj/item/clothing/head/helmet/alt
	ui_sort_order = 31

// ============================================================================
// ELECTRONICS
// ============================================================================

/datum/sr_gear/electronics
	category = SR_GEAR_CATEGORY_ELECTRONICS

/datum/sr_gear/electronics/commlink
	name = "Meta Link"
	desc = "A basic commlink. Low-end but functional for calls and AR."
	cost = 100
	availability = 2
	subcategory = "Commlinks"
	ui_sort_order = 10

/datum/sr_gear/electronics/commlink/renraku
	name = "Renraku Sensei"
	desc = "A mid-range commlink with good processing power and sleek design."
	cost = 1000
	availability = 4
	ui_sort_order = 11

/datum/sr_gear/electronics/commlink/transys
	name = "Transys Avalon"
	desc = "A high-end commlink popular with deckers. Excellent processing power."
	cost = 3000
	availability = 6
	ui_sort_order = 12

/datum/sr_gear/electronics/cyberdeck
	name = "Erika MCD-1"
	desc = "An entry-level cyberdeck for aspiring deckers."
	cost = 49500
	availability = 6
	legality = "R"
	subcategory = "Cyberdecks"
	ui_sort_order = 20

// ============================================================================
// TOOLS & GEAR
// ============================================================================

/datum/sr_gear/tools
	category = SR_GEAR_CATEGORY_TOOLS

/datum/sr_gear/tools/toolkit
	name = "Tool Kit"
	desc = "A comprehensive toolkit for mechanical and electronic repairs."
	cost = 500
	availability = 2
	subcategory = "Kits"
	item_path = /obj/item/storage/toolbox/mechanical
	ui_sort_order = 10

/datum/sr_gear/tools/lockpicks
	name = "Lockpick Set"
	desc = "Professional quality lockpicks for bypassing mechanical locks."
	cost = 250
	availability = 4
	legality = "R"
	subcategory = "B&E"
	ui_sort_order = 20

/datum/sr_gear/tools/autopicker
	name = "Autopicker"
	desc = "An electronic device that automatically picks mechanical locks."
	cost = 500
	availability = 8
	legality = "R"
	subcategory = "B&E"
	ui_sort_order = 21

/datum/sr_gear/tools/maglock_passkey
	name = "Maglock Passkey"
	desc = "A device for bypassing electronic maglocks."
	cost = 2000
	availability = 12
	legality = "F"
	subcategory = "B&E"
	ui_sort_order = 22

/datum/sr_gear/tools/flashlight
	name = "Flashlight"
	desc = "A high-powered tactical flashlight."
	cost = 25
	availability = 2
	subcategory = "General"
	item_path = /obj/item/flashlight/flare
	ui_sort_order = 30

/datum/sr_gear/tools/binoculars
	name = "Binoculars"
	desc = "Optical binoculars with 50x magnification."
	cost = 50
	availability = 2
	subcategory = "General"
	ui_sort_order = 31

// ============================================================================
// SURVIVAL GEAR
// ============================================================================

/datum/sr_gear/survival
	category = SR_GEAR_CATEGORY_SURVIVAL

/datum/sr_gear/survival/survival_kit
	name = "Survival Kit"
	desc = "Essential supplies for wilderness survival: fire starter, water purification, emergency shelter."
	cost = 200
	availability = 4
	subcategory = "Kits"
	ui_sort_order = 10

/datum/sr_gear/survival/respirator
	name = "Respirator"
	desc = "Filters airborne toxins and provides clean breathing air."
	cost = 50
	availability = 2
	subcategory = "Protective"
	item_path = /obj/item/clothing/mask/breath
	ui_sort_order = 20

/datum/sr_gear/survival/gas_mask
	name = "Gas Mask"
	desc = "Full face protection against chemical and biological agents."
	cost = 200
	availability = 2
	subcategory = "Protective"
	item_path = /obj/item/clothing/mask/gas
	ui_sort_order = 21

// ============================================================================
// MEDICAL
// ============================================================================

/datum/sr_gear/medical
	category = SR_GEAR_CATEGORY_MEDICAL

/datum/sr_gear/medical/medkit
	name = "Medkit"
	desc = "A standard first aid kit with bandages, painkillers, and basic medical supplies."
	cost = 200
	availability = 2
	subcategory = "Kits"
	item_path = /obj/item/storage/medkit/regular
	ui_sort_order = 10

/datum/sr_gear/medical/medkit/trauma
	name = "Trauma Patch"
	desc = "Single-use trauma patch for emergency wound treatment."
	cost = 500
	availability = 6
	stackable = TRUE
	max_quantity = 5
	ui_sort_order = 11

/datum/sr_gear/medical/stim_patch
	name = "Stim Patch"
	desc = "A stimulant patch to keep you going when the body says stop."
	cost = 100
	availability = 6
	subcategory = "Drugs"
	stackable = TRUE
	max_quantity = 10
	ui_sort_order = 20

/datum/sr_gear/medical/antidote_patch
	name = "Antidote Patch"
	desc = "Neutralizes common toxins and poisons."
	cost = 200
	availability = 8
	subcategory = "Drugs"
	stackable = TRUE
	max_quantity = 5
	ui_sort_order = 21

/// Global list of all SR gear items, built lazily on first access
GLOBAL_LIST_EMPTY(sr_gear_catalog)

/// Gets the SR gear catalog, building it on first access if needed
/proc/get_sr_gear_catalog()
	if(!length(GLOB.sr_gear_catalog))
		populate_sr_gear_catalog()
	return GLOB.sr_gear_catalog

/// Populates the SR gear catalog
/proc/populate_sr_gear_catalog()
	if(length(GLOB.sr_gear_catalog))
		return // Already populated
	for(var/gear_path in subtypesof(/datum/sr_gear))
		var/datum/sr_gear/G = new gear_path
		if(G.name == "Unknown Gear")
			qdel(G)
			continue
		GLOB.sr_gear_catalog["[gear_path]"] = G

/// Returns gear organized by category for UI
/proc/get_sr_gear_by_category()
	var/list/catalog = get_sr_gear_catalog()
	var/list/by_category = list()
	for(var/gear_id in catalog)
		var/datum/sr_gear/G = catalog[gear_id]
		if(!by_category[G.category])
			by_category[G.category] = list()
		by_category[G.category] += list(list(
			"id" = gear_id,
			"name" = G.name,
			"desc" = G.desc,
			"cost" = G.cost,
			"availability" = G.availability,
			"legality" = G.legality,
			"category" = G.category,
			"subcategory" = G.subcategory,
			"stackable" = G.stackable,
			"max_quantity" = G.max_quantity,
			"sort" = G.ui_sort_order
		))
	return by_category

#undef SR_GEAR_CATEGORY_WEAPONS
#undef SR_GEAR_CATEGORY_ARMOR
#undef SR_GEAR_CATEGORY_ELECTRONICS
#undef SR_GEAR_CATEGORY_TOOLS
#undef SR_GEAR_CATEGORY_SURVIVAL
#undef SR_GEAR_CATEGORY_MEDICAL
