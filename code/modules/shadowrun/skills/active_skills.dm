/**
 * Shadowrun 5e Active Skills
 *
 * These are the core SR5 active skills, each linked to an attribute.
 */

/datum/rpg_skill
	abstract_type = /datum/rpg_skill

	var/name = ""
	var/desc = ""

	/// Base rating for this skill.
	var/value = 0
	var/list/modifiers

	/// All skills must have a valid parent stat type.
	var/parent_stat_type = null
	/// Affects the sort order in TGUI.
	var/ui_sort_order = 0

	/// List of available specializations for this skill. SR5: +2 dice when specialization applies.
	var/list/specializations = null

	/// The currently selected specialization for this skill (set per-character).
	var/selected_specialization = null

/datum/rpg_skill/proc/get(mob/living/user, list/out_sources)
	return value

/// Update the modified value with modifiers.
/datum/rpg_skill/proc/update_modifiers()
	SHOULD_NOT_OVERRIDE(TRUE)
	value = initial(value)
	value += values_sum(modifiers)

/// Set the selected specialization. Returns TRUE if valid, FALSE otherwise.
/datum/rpg_skill/proc/set_specialization(spec_name)
	if (!spec_name || !islist(specializations))
		selected_specialization = null
		return TRUE
	if (spec_name in specializations)
		selected_specialization = spec_name
		return TRUE
	return FALSE

/// Check if a given context matches the selected specialization. Returns +2 if match, 0 otherwise.
/datum/rpg_skill/proc/get_specialization_bonus(context)
	if (!selected_specialization || !context)
		return 0
	if (lowertext(selected_specialization) == lowertext(context))
		return 2
	return 0

// -----------------
// Agility-linked
// -----------------

/datum/rpg_skill/archery
	name = "Archery"
	desc = "Bows and crossbows."
	parent_stat_type = /datum/rpg_stat/agility
	ui_sort_order = 10
	specializations = list("Bows", "Crossbows")

/datum/rpg_skill/automatics
	name = "Automatics"
	desc = "Submachine guns and assault rifles."
	parent_stat_type = /datum/rpg_stat/agility
	ui_sort_order = 20
	specializations = list("Assault Rifles", "Submachine Guns", "Suppressive Fire")

/datum/rpg_skill/blades
	name = "Blades"
	desc = "Knives, swords, and edged weapons."
	parent_stat_type = /datum/rpg_stat/agility
	ui_sort_order = 30
	specializations = list("Axes", "Knives", "Swords", "Parrying")

/datum/rpg_skill/clubs
	name = "Clubs"
	desc = "Blunt melee weapons."
	parent_stat_type = /datum/rpg_stat/agility
	ui_sort_order = 40
	specializations = list("Batons", "Hammers", "Staves")

/datum/rpg_skill/escape_artist
	name = "Escape Artist"
	desc = "Getting out of restraints and tight spaces."
	parent_stat_type = /datum/rpg_stat/agility
	ui_sort_order = 50
	specializations = list("Contortionism", "Cuffs", "Ropes")

/datum/rpg_skill/gymnastics
	name = "Gymnastics"
	desc = "Balance, tumbling, and acrobatic movement."
	parent_stat_type = /datum/rpg_stat/agility
	ui_sort_order = 60
	specializations = list("Balance", "Climbing", "Jumping", "Tumbling")

/datum/rpg_skill/gunnery
	name = "Gunnery"
	desc = "Mounted and vehicle weapons."
	parent_stat_type = /datum/rpg_stat/agility
	ui_sort_order = 70
	specializations = list("Ballistic", "Energy", "Guided Missiles", "Rockets")

/datum/rpg_skill/heavy_weapons
	name = "Heavy Weapons"
	desc = "Machine guns, launchers, and heavy arms."
	parent_stat_type = /datum/rpg_stat/agility
	ui_sort_order = 80
	specializations = list("Assault Cannons", "Grenade Launchers", "Machine Guns", "Rocket Launchers")

/datum/rpg_skill/locksmith
	name = "Locksmith"
	desc = "Locks, bypasses, and physical security."
	parent_stat_type = /datum/rpg_stat/agility
	ui_sort_order = 90
	specializations = list("Keypads", "Maglocks", "Mechanical Locks", "Safes")

/datum/rpg_skill/longarms
	name = "Longarms"
	desc = "Shotguns and rifles."
	parent_stat_type = /datum/rpg_stat/agility
	ui_sort_order = 100
	specializations = list("Shotguns", "Sniper Rifles", "Sport Rifles")

/datum/rpg_skill/pistols
	name = "Pistols"
	desc = "Handguns and light firearms."
	parent_stat_type = /datum/rpg_stat/agility
	ui_sort_order = 110
	specializations = list("Holdouts", "Revolvers", "Semi-Automatics", "Tasers")

/datum/rpg_skill/sneaking
	name = "Sneaking"
	desc = "Moving quietly and staying unseen."
	parent_stat_type = /datum/rpg_stat/agility
	ui_sort_order = 120
	specializations = list("Indoor", "Outdoor", "Urban", "Vehicle")

/datum/rpg_skill/throwing_weapons
	name = "Throwing Weapons"
	desc = "Thrown blades and similar weapons."
	parent_stat_type = /datum/rpg_stat/agility
	ui_sort_order = 130
	specializations = list("Aerodynamic", "Blades", "Non-Aerodynamic")

/**
 * SR5 Active Skill: Palming (Agility)
 * Legacy typepath kept for codebase compatibility.
 */
/datum/rpg_skill/fine_motor
	name = "Palming"
	desc = "Sleight of hand, concealment, and delicate manual work."

	parent_stat_type = /datum/rpg_stat/agility
	ui_sort_order = 95
	specializations = list("Legerdemain", "Pickpocket", "Concealment")

/datum/rpg_skill/fine_motor/get(mob/living/user, list/out_sources)
	. = ..()

	if(CHEM_EFFECT_MAGNITUDE(user, CE_STIMULANT))
		. -= 1
		out_sources?["Stimulants"] = -1

	if(user.is_blind())
		. -= 4
		out_sources?["Blind"] = -4

	else if(user.eye_blurry)
		. -= 1
		out_sources?["Blurred vision"] = -1

	if(!iscarbon(user))
		return

	var/mob/living/carbon/carbon_user = user

	if(carbon_user.getPain() > 100)
		. -= 2
		out_sources?["In pain"] = -2

	if(carbon_user.shock_stage > 30)
		. -= 2
		out_sources?["In shock"] = -2

	else if(carbon_user.shock_stage > 10)
		. -= 1
		out_sources?["In shock"] = -1

	// Drunkeness removes between 1 and 10 based on how fucked you are.
	var/datum/status_effect/inebriated/drunk/drunkness = user.has_status_effect(/datum/status_effect/inebriated/drunk)
	if(drunkness)
		var/drunk_effect = min(ceil(drunkness.drunk_value / 5), 10) * -1
		. += drunk_effect
		out_sources?["Intoxicated"] = drunk_effect

/**
 * SR5 Active Skill: Unarmed Combat (Agility)
 * Legacy typepath kept for codebase compatibility.
 */
/datum/rpg_skill/bloodsport
	name = "Unarmed Combat"
	desc = "Striking, grappling, and fighting without a weapon."

	parent_stat_type = /datum/rpg_stat/agility
	ui_sort_order = 140
	specializations = list("Blocking", "Cyber Implants", "Grappling", "Martial Arts", "Subduing")

/datum/rpg_skill/bloodsport/get(mob/living/user, list/out_sources)
	. = ..()
	if(CHEM_EFFECT_MAGNITUDE(user, CE_STIMULANT))
		. += 1
		out_sources?["Stimulants"] = 1

	if(user.incapacitated())
		. -= 10 //lol fucked
		out_sources?["Incapacitated"] = -10

	if(user.is_blind())
		. -= 4
		out_sources?["Blind"] = -4

	else if(user.eye_blurry)
		. -= 1
		out_sources?["Blurred vision"] = -1

	if(!iscarbon(user))
		return

	var/mob/living/carbon/carbon_user = user

	if(carbon_user.getPain() > 100)
		. -= 2
		out_sources?["In pain"] = -2

	if(carbon_user.shock_stage > 30)
		. -= 2
		out_sources?["In shock"] = -2

	else if(carbon_user.shock_stage > 10)
		. -= 1
		out_sources?["In shock"] = -1

	var/obj/item/organ/brain/brain = carbon_user.getorganslot(ORGAN_SLOT_BRAIN)
	if(brain && (brain.damage >= (brain.maxHealth * brain.low_threshold)))
		. -= 3
		out_sources?["Brain damage"] = -3

// -----------------
// Reaction-linked
// -----------------

/datum/rpg_skill/pilot_aircraft
	name = "Pilot Aircraft"
	desc = "Operating aircraft."
	parent_stat_type = /datum/rpg_stat/reaction
	ui_sort_order = 10
	specializations = list("Fixed-Wing", "Rotary-Wing", "Vectored Thrust", "Tilt-Wing")

/datum/rpg_skill/pilot_ground_craft
	name = "Pilot Ground Craft"
	desc = "Driving ground vehicles."
	parent_stat_type = /datum/rpg_stat/reaction
	ui_sort_order = 20
	specializations = list("Bikes", "Cars", "Trucks", "Wheeled", "Tracked")

/datum/rpg_skill/pilot_watercraft
	name = "Pilot Watercraft"
	desc = "Operating boats and water vehicles."
	parent_stat_type = /datum/rpg_stat/reaction
	ui_sort_order = 30
	specializations = list("Hovercraft", "Motorboat", "Sailboat", "Submarine")

// -----------------
// Strength-linked
// -----------------

/datum/rpg_skill/swimming
	name = "Swimming"
	desc = "Swimming and water endurance."
	parent_stat_type = /datum/rpg_stat/strength
	ui_sort_order = 20
	specializations = list("Diving", "Long Distance", "Speed Swimming", "Treading Water")

/**
 * SR5 Active Skill: Running (Strength)
 * Legacy typepath kept for codebase compatibility.
 */
/datum/rpg_skill/electric_body
	name = "Running"
	desc = "Sprinting, chasing, and pushing your physical limits."

	parent_stat_type = /datum/rpg_stat/strength
	ui_sort_order = 10
	specializations = list("Distance", "Sprinting", "Urban", "Wilderness")

/datum/rpg_skill/electric_body/get(mob/living/user, list/out_sources)
	. = ..()

	// Drunkeness adds between 1 and 3 based on how fucked you are.
	var/datum/status_effect/inebriated/drunk/drunkness = user.has_status_effect(/datum/status_effect/inebriated/drunk)
	if(drunkness)
		var/drunk_effect = min(ceil(drunkness.drunk_value / 3), 3)
		. += drunk_effect
		out_sources?["Hammered"] = drunk_effect

// -----------------
// Body-linked
// -----------------

/datum/rpg_skill/diving
	name = "Diving"
	desc = "Breath control and underwater activity."
	parent_stat_type = /datum/rpg_stat/body
	ui_sort_order = 10
	specializations = list("Breath Control", "SCUBA", "Underwater Combat")

// -----------------
// Willpower-linked
// -----------------

/datum/rpg_skill/astral_combat
	name = "Astral Combat"
	desc = "Fighting on the astral plane."
	parent_stat_type = /datum/rpg_stat/willpower
	ui_sort_order = 10
	specializations = list("Mana Spells", "Spirits", "Weapon Foci")

/**
 * SR5 Active Skill: Survival (Willpower)
 * Legacy typepath kept for codebase compatibility.
 */
/datum/rpg_skill/knuckle_down
	name = "Survival"
	desc = "Endurance, grit, and staying functional under harsh conditions."

	parent_stat_type = /datum/rpg_stat/willpower
	ui_sort_order = 20
	specializations = list("Desert", "Forest", "Jungle", "Mountain", "Polar", "Urban")

// -----------------
// Logic-linked
// -----------------

/datum/rpg_skill/arcana
	name = "Arcana"
	desc = "Magical theory, symbols, and traditions."
	parent_stat_type = /datum/rpg_stat/logic
	ui_sort_order = 10
	specializations = list("Magical Theory", "Spirit Types", "Spell Design", "Traditions")

/datum/rpg_skill/armorer
	name = "Armorer"
	desc = "Maintaining and modifying gear and weapons."
	parent_stat_type = /datum/rpg_stat/logic
	ui_sort_order = 20
	specializations = list("Armor", "Artillery", "Explosives", "Firearms", "Melee")

/**
 * SR5 Active Skill: Biotechnology (Logic)
 * Legacy typepath kept for codebase compatibility.
 */
/datum/rpg_skill/forensics
	name = "Biotechnology"
	desc = "Biology, lab work, and forensic biotech."

	parent_stat_type = /datum/rpg_stat/logic
	ui_sort_order = 30
	specializations = list("Bioinformatics", "Bioware", "Cloning", "Cybertechnology", "Genetech")

/datum/rpg_skill/chemistry
	name = "Chemistry"
	desc = "Chemicals, reactions, and synthesis."
	parent_stat_type = /datum/rpg_stat/logic
	ui_sort_order = 40
	specializations = list("Analytical", "Biochemistry", "Drugs", "Synthesis", "Toxins")

/datum/rpg_skill/computer
	name = "Computer"
	desc = "Using and understanding computer systems."
	parent_stat_type = /datum/rpg_stat/logic
	ui_sort_order = 50
	specializations = list("Edit File", "Erase Mark", "Matrix Perception", "Matrix Search")

/datum/rpg_skill/cybercombat
	name = "Cybercombat"
	desc = "Fighting in the Matrix."
	parent_stat_type = /datum/rpg_stat/logic
	ui_sort_order = 60
	specializations = list("Brute Force", "Data Spike", "Crash Program", "Personas")

/datum/rpg_skill/cybertechnology
	name = "Cybertechnology"
	desc = "Cyberware knowledge and maintenance."
	parent_stat_type = /datum/rpg_stat/logic
	ui_sort_order = 70
	specializations = list("Bodyware", "Cyberweapons", "Headware", "Repair")

/datum/rpg_skill/demolitions
	name = "Demolitions"
	desc = "Explosives placement and disarming."
	parent_stat_type = /datum/rpg_stat/logic
	ui_sort_order = 80
	specializations = list("Commercial Explosives", "Defusing", "Improvised Explosives", "Plastic Explosives")

/datum/rpg_skill/electronic_warfare
	name = "Electronic Warfare"
	desc = "Signals, jamming, and electronic intrusion."
	parent_stat_type = /datum/rpg_stat/logic
	ui_sort_order = 90
	specializations = list("Communications", "Encryption", "Jamming", "Sensor Operations")

/**
 * SR5 Active Skill: First Aid (Logic)
 * Legacy typepath kept for codebase compatibility.
 */
/datum/rpg_skill/anatomy
	name = "First Aid"
	desc = "Immediate medical care and emergency treatment."

	parent_stat_type = /datum/rpg_stat/logic
	ui_sort_order = 100
	specializations = list("Burn Treatment", "Resuscitation", "Trauma Treatment", "Wound Care")

/datum/rpg_skill/forgery
	name = "Forgery"
	desc = "Creating and detecting false documents."
	parent_stat_type = /datum/rpg_stat/logic
	ui_sort_order = 110
	specializations = list("Art", "Credential Forgery", "Document Forgery", "Signature")

/datum/rpg_skill/hacking
	name = "Hacking"
	desc = "Breaking into and controlling Matrix devices."
	parent_stat_type = /datum/rpg_stat/logic
	ui_sort_order = 120
	specializations = list("Deckers", "Files", "Hosts", "Personas", "Spiders")

/datum/rpg_skill/hardware
	name = "Hardware"
	desc = "Physical electronics repair and modification."
	parent_stat_type = /datum/rpg_stat/logic
	ui_sort_order = 130
	specializations = list("Commlinks", "Cyberdecks", "Maglocks", "RCC", "Sensors")

/datum/rpg_skill/medicine
	name = "Medicine"
	desc = "Extended medical treatment and diagnosis."
	parent_stat_type = /datum/rpg_stat/logic
	ui_sort_order = 140
	specializations = list("Cybersurgery", "Extended Care", "Organ Culture", "Surgery", "Trauma Surgery")

/datum/rpg_skill/software
	name = "Software"
	desc = "Programming and software design."
	parent_stat_type = /datum/rpg_stat/logic
	ui_sort_order = 150
	specializations = list("Data Bombs", "Editor Programs", "Agents", "Sprites")

/datum/rpg_skill/aeronautics_mechanic
	name = "Aeronautics Mechanic"
	desc = "Repairing and maintaining aircraft."
	parent_stat_type = /datum/rpg_stat/logic
	ui_sort_order = 160
	specializations = list("Aerospace", "Fixed-Wing", "Rotary-Wing", "Vectored Thrust")

/datum/rpg_skill/automotive_mechanic
	name = "Automotive Mechanic"
	desc = "Repairing and maintaining ground vehicles."
	parent_stat_type = /datum/rpg_stat/logic
	ui_sort_order = 170
	specializations = list("Bikes", "Cars", "Trucks", "Walkers")

/datum/rpg_skill/industrial_mechanic
	name = "Industrial Mechanic"
	desc = "Repairing and maintaining industrial machinery."
	parent_stat_type = /datum/rpg_stat/logic
	ui_sort_order = 180
	specializations = list("Fuel Cells", "Heavy Machinery", "Power Plants", "Robotics")

/datum/rpg_skill/nautical_mechanic
	name = "Nautical Mechanic"
	desc = "Repairing and maintaining watercraft."
	parent_stat_type = /datum/rpg_stat/logic
	ui_sort_order = 190
	specializations = list("Hovercraft", "Motorboat", "Sailboat", "Submarine")

// -----------------
// Intuition-linked
// -----------------

/**
 * SR5 Active Skill: Perception (Intuition)
 * Legacy typepath kept for codebase compatibility.
 */
/datum/rpg_skill/fourteen_eyes
	name = "Perception"
	desc = "Noticing details, threats, and important information."

	parent_stat_type = /datum/rpg_stat/intuition
	ui_sort_order = 5
	specializations = list("Aural", "Searching", "Tactile", "Taste", "Visual")

/datum/rpg_skill/assensing
	name = "Assensing"
	desc = "Reading auras and magical signatures."
	parent_stat_type = /datum/rpg_stat/intuition
	ui_sort_order = 10
	specializations = list("Aura Reading", "Astral Signatures", "Metahuman", "Spirits")

/datum/rpg_skill/artisan
	name = "Artisan"
	desc = "Crafting, performance craft, and creative work."
	parent_stat_type = /datum/rpg_stat/intuition
	ui_sort_order = 20
	specializations = list("Carpentry", "Cooking", "Drawing", "Painting", "Sculpting")

/datum/rpg_skill/disguise
	name = "Disguise"
	desc = "Blending in, altering appearance, and deception in presentation."
	parent_stat_type = /datum/rpg_stat/intuition
	ui_sort_order = 30
	specializations = list("Camouflage", "Cosmetic", "Theatrical", "Trideo/Video")

/datum/rpg_skill/navigation
	name = "Navigation"
	desc = "Route planning and wayfinding."
	parent_stat_type = /datum/rpg_stat/intuition
	ui_sort_order = 40
	specializations = list("Astral", "GPS", "Matrix", "Urban", "Wilderness")

/datum/rpg_skill/tracking
	name = "Tracking"
	desc = "Following trails and locating targets."
	parent_stat_type = /datum/rpg_stat/intuition
	ui_sort_order = 50
	specializations = list("Astral", "Desert", "Forest", "Jungle", "Mountain", "Urban")

// -----------------
// Charisma-linked
// -----------------

/datum/rpg_skill/animal_handling
	name = "Animal Handling"
	desc = "Working with, training, and calming animals."
	parent_stat_type = /datum/rpg_stat/charisma
	ui_sort_order = 10
	specializations = list("Cat", "Dog", "Horse", "Exotic Pet", "Paracritter")

/datum/rpg_skill/con
	name = "Con"
	desc = "Lies, misdirection, and scams."
	parent_stat_type = /datum/rpg_stat/charisma
	ui_sort_order = 20
	specializations = list("Fast Talk", "Seduction", "Performance", "Swindle")

/datum/rpg_skill/etiquette
	name = "Etiquette"
	desc = "Knowing how to behave in different social circles."
	parent_stat_type = /datum/rpg_stat/charisma
	ui_sort_order = 30
	specializations = list("Corporate", "High Society", "Media", "Military", "Street")

/datum/rpg_skill/impersonation
	name = "Impersonation"
	desc = "Mimicking identities and adopting roles."
	parent_stat_type = /datum/rpg_stat/charisma
	ui_sort_order = 40
	specializations = list("Dwarf", "Elf", "Human", "Ork", "Troll")

/datum/rpg_skill/instruction
	name = "Instruction"
	desc = "Teaching and coaching effectively."
	parent_stat_type = /datum/rpg_stat/charisma
	ui_sort_order = 50
	specializations = list("Combat Skills", "Magic", "Matrix", "Technical Skills")

/datum/rpg_skill/intimidation
	name = "Intimidation"
	desc = "Threats, fear, and coercion."
	parent_stat_type = /datum/rpg_stat/charisma
	ui_sort_order = 60
	specializations = list("Interrogation", "Mental", "Physical", "Torture")

/datum/rpg_skill/leadership
	name = "Leadership"
	desc = "Command presence and coordinating others."
	parent_stat_type = /datum/rpg_stat/charisma
	ui_sort_order = 70
	specializations = list("Command", "Direct", "Inspire", "Rally")

/datum/rpg_skill/negotiation
	name = "Negotiation"
	desc = "Deals, bargaining, and contracts."
	parent_stat_type = /datum/rpg_stat/charisma
	ui_sort_order = 80
	specializations = list("Bargaining", "Contracts", "Diplomacy")

/**
 * SR5 Active Skill: Performance (Charisma)
 * Legacy typepath kept for codebase compatibility.
 */
/datum/rpg_skill/theatre
	name = "Performance"
	desc = "Entertainment and stagecraft; captivating an audience."

	parent_stat_type = /datum/rpg_stat/charisma
	ui_sort_order = 90
	specializations = list("Comedy", "Drama", "Dancing", "Music", "Singing")

