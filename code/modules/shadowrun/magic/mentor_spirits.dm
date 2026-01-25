/**
 * Shadowrun 5e Mentor Spirits
 *
 * A mentor spirit is a powerful spirit that has taken an interest in a
 * magician or adept. They provide guidance and bonuses, but also impose
 * certain behavioral expectations or disadvantages.
 *
 * All mentor spirits provide:
 * - A primary bonus (usually +2 dice to certain tests)
 * - A secondary bonus for magicians (often spirit-related)
 * - A disadvantage or behavioral constraint
 */

/datum/sr_mentor_spirit
	abstract_type = /datum/sr_mentor_spirit

	var/name = ""
	var/desc = ""
	/// The primary advantage provided by this mentor
	var/advantage = ""
	/// Additional advantage for magicians (often spirit/spell related)
	var/magician_advantage = ""
	/// The disadvantage or behavioral constraint
	var/disadvantage = ""
	/// Icon name for UI display
	var/icon_name = "question"
	/// Sort order in UI
	var/ui_sort_order = 0
	/// List of traditions this mentor is commonly associated with (for filtering)
	var/list/common_traditions = list()

// =============================================================================
// ANIMAL MENTOR SPIRITS
// =============================================================================

/datum/sr_mentor_spirit/bear
	name = "Bear"
	desc = "Bear is a healer and protector, fierce in defense of those in need."
	advantage = "+2 dice for health spells, preparations, and rituals."
	magician_advantage = "+2 dice for summoning or binding plant spirits."
	disadvantage = "If you or a loved one are harmed, you must make a Charisma + Willpower (3) test to not go berserk against the attacker."
	icon_name = "paw"
	ui_sort_order = 10
	common_traditions = list("shamanic", "wicca")

/datum/sr_mentor_spirit/cat
	name = "Cat"
	desc = "Cat is stealthy, curious, and fiercely independent."
	advantage = "+2 dice for Gymnastics and Sneaking tests."
	magician_advantage = "+2 dice for Illusion spells, preparations, and rituals."
	disadvantage = "Cat followers are easily distracted. When presented with an interesting situation, make a Charisma + Willpower (3) test or investigate."
	icon_name = "cat"
	ui_sort_order = 20
	common_traditions = list("shamanic", "chaos_magic")

/datum/sr_mentor_spirit/dog
	name = "Dog"
	desc = "Dog is loyal, protective, and values pack bonds above all."
	advantage = "+2 dice for Tracking tests and Perception tests involving smell."
	magician_advantage = "+2 dice for Detection spells, preparations, and rituals."
	disadvantage = "Dog never abandons a friend. You cannot leave a companion behind, even if tactically necessary."
	icon_name = "dog"
	ui_sort_order = 30
	common_traditions = list("shamanic")

/datum/sr_mentor_spirit/eagle
	name = "Eagle"
	desc = "Eagle soars above, seeing all with piercing clarity."
	advantage = "+2 dice for Perception tests."
	magician_advantage = "+2 dice for summoning or binding spirits of air."
	disadvantage = "Eagle demands honor. You suffer -1 to all Social tests if you have knowingly broken your word."
	icon_name = "feather-alt"
	ui_sort_order = 40
	common_traditions = list("shamanic")

/datum/sr_mentor_spirit/lion
	name = "Lion"
	desc = "Lion is a proud leader, brave and commanding."
	advantage = "+2 dice for Leadership tests."
	magician_advantage = "+2 dice for Combat spells, preparations, and rituals."
	disadvantage = "Lion's pride is easily wounded. You must make a Charisma + Willpower (3) test to back down from a challenge."
	icon_name = "crown"
	ui_sort_order = 50
	common_traditions = list("shamanic", "black_magic")

/datum/sr_mentor_spirit/owl
	name = "Owl"
	desc = "Owl sees through darkness and deception, guardian of hidden knowledge."
	advantage = "+2 dice for Assensing tests and Perception tests in low light."
	magician_advantage = "+2 dice for Detection spells, preparations, and rituals."
	disadvantage = "Owl demands secrecy. You must make a Charisma + Willpower (3) test to share information freely."
	icon_name = "eye"
	ui_sort_order = 60
	common_traditions = list("shamanic", "hermetic")

/datum/sr_mentor_spirit/rat
	name = "Rat"
	desc = "Rat is a survivor, cunning and resourceful in the shadows."
	advantage = "+2 dice for Sneaking and Escape Artist tests."
	magician_advantage = "+2 dice for summoning or binding spirits of man."
	disadvantage = "When danger threatens, Rat's first instinct is flight. Make a Charisma + Willpower (3) test to stand and fight when escape is possible."
	icon_name = "user-secret"
	ui_sort_order = 70
	common_traditions = list("shamanic", "chaos_magic")

/datum/sr_mentor_spirit/raven
	name = "Raven"
	desc = "Raven is a trickster, clever and mischievous."
	advantage = "+2 dice for Con and Palming tests."
	magician_advantage = "+2 dice for Manipulation spells, preparations, and rituals."
	disadvantage = "Raven loves tricks. You must make a Charisma + Willpower (3) test to resist playing a prank or trick when the opportunity arises."
	icon_name = "crow"
	ui_sort_order = 80
	common_traditions = list("shamanic", "chaos_magic")

/datum/sr_mentor_spirit/shark
	name = "Shark"
	desc = "Shark is a relentless predator, drawn to weakness."
	advantage = "+2 dice for Unarmed Combat tests."
	magician_advantage = "+2 dice for Combat spells, preparations, and rituals."
	disadvantage = "Once blood is drawn, Shark enters a frenzy. Make a Charisma + Willpower (3) test to break off combat once engaged."
	icon_name = "fish"
	ui_sort_order = 90
	common_traditions = list("shamanic", "black_magic")

/datum/sr_mentor_spirit/snake
	name = "Snake"
	desc = "Snake is wise, patient, and a keeper of ancient secrets."
	advantage = "+2 dice for Arcana and First Aid tests."
	magician_advantage = "+2 dice for Detection spells, preparations, and rituals."
	disadvantage = "Snake values knowledge. You must make a Charisma + Willpower (3) test to destroy or pass up an opportunity to learn something new."
	icon_name = "diagnoses"
	ui_sort_order = 100
	common_traditions = list("shamanic", "hermetic", "wicca")

/datum/sr_mentor_spirit/wolf
	name = "Wolf"
	desc = "Wolf is a pack hunter, loyal and fierce."
	advantage = "+2 dice for Tracking tests and Perception tests involving smell."
	magician_advantage = "+2 dice for Combat spells, preparations, and rituals."
	disadvantage = "Wolf protects the pack. You cannot ignore threats to allies, even if prudent to do so."
	icon_name = "dog"
	ui_sort_order = 110
	common_traditions = list("shamanic")

// =============================================================================
// MYSTICAL MENTOR SPIRITS
// =============================================================================

/datum/sr_mentor_spirit/dragonslayer
	name = "Dragonslayer"
	desc = "The heroic ideal, champion of the weak against tyranny."
	advantage = "+2 dice for one Combat skill of your choice."
	magician_advantage = "+2 dice for Combat spells, preparations, and rituals."
	disadvantage = "You cannot ignore a call for help. You must make a Charisma + Willpower (3) test to refuse aiding someone in genuine need."
	icon_name = "shield-alt"
	ui_sort_order = 200
	common_traditions = list("hermetic", "shamanic")

/datum/sr_mentor_spirit/dark_king
	name = "Dark King"
	desc = "The ruler of the underworld, lord of death and rebirth."
	advantage = "+2 dice for Intimidation tests."
	magician_advantage = "+2 dice for summoning or binding spirits of man."
	disadvantage = "Dark King demands respect. You must make a Charisma + Willpower (3) test to accept insults or slights without retaliation."
	icon_name = "skull-crossbones"
	ui_sort_order = 210
	common_traditions = list("black_magic", "aztec")

/datum/sr_mentor_spirit/fire_bringer
	name = "Fire-Bringer"
	desc = "The giver of gifts, who brings light and knowledge at great cost."
	advantage = "+2 dice for Artisan tests and one Technical skill of your choice."
	magician_advantage = "+2 dice for Manipulation spells, preparations, and rituals."
	disadvantage = "Fire-Bringer cannot refuse a request for knowledge or aid. Make a Charisma + Willpower (3) test to refuse such requests."
	icon_name = "fire"
	ui_sort_order = 220
	common_traditions = list("hermetic", "chaos_magic")

/datum/sr_mentor_spirit/seductress
	name = "Seductress"
	desc = "The temptress, master of desire and manipulation."
	advantage = "+2 dice for Con and Etiquette tests."
	magician_advantage = "+2 dice for Illusion spells, preparations, and rituals."
	disadvantage = "Seductress loves attention. You must make a Charisma + Willpower (3) test to avoid being the center of attention in social situations."
	icon_name = "heart"
	ui_sort_order = 230
	common_traditions = list("black_magic", "chaos_magic")

/datum/sr_mentor_spirit/wise_warrior
	name = "Wise Warrior"
	desc = "The perfect balance of thought and action, mind and body."
	advantage = "+2 dice for one Combat skill of your choice."
	magician_advantage = "+2 dice for Detection spells, preparations, and rituals."
	disadvantage = "Wise Warrior values honor. You must fight fairly and cannot use underhanded tactics against a worthy foe."
	icon_name = "yin-yang"
	ui_sort_order = 240
	common_traditions = list("wuxing", "shinto")

/datum/sr_mentor_spirit/mountain
	name = "Mountain"
	desc = "Immovable, patient, enduring through all adversity."
	advantage = "+2 dice for Body tests to resist damage or fatigue."
	magician_advantage = "+2 dice for summoning or binding earth spirits."
	disadvantage = "Mountain is slow to act. You must make a Willpower (3) test to act first in ambiguous situations."
	icon_name = "mountain"
	ui_sort_order = 250
	common_traditions = list("shamanic", "druidic")

/datum/sr_mentor_spirit/spider
	name = "Spider"
	desc = "Patient weaver of webs, master of traps and patience."
	advantage = "+2 dice for Artisan tests and all tests involving traps or ambushes."
	magician_advantage = "+2 dice for Illusion spells, preparations, and rituals."
	disadvantage = "Spider prefers subtlety. You must make a Charisma + Willpower (3) test to attack directly when a trap could be set."
	icon_name = "spider"
	ui_sort_order = 260
	common_traditions = list("shamanic", "voudou")

/datum/sr_mentor_spirit/coyote
	name = "Coyote"
	desc = "The ultimate trickster, surviving through wit and cunning."
	advantage = "+2 dice for Con and Escape Artist tests."
	magician_advantage = "+2 dice for Illusion spells, preparations, and rituals."
	disadvantage = "Coyote cannot resist a good joke. You must make a Charisma + Willpower (3) test to pass up an opportunity for mischief."
	icon_name = "dog"
	ui_sort_order = 270
	common_traditions = list("shamanic", "chaos_magic")

/datum/sr_mentor_spirit/thunderbird
	name = "Thunderbird"
	desc = "Lord of storms, bringer of change and destruction."
	advantage = "+2 dice for Intimidation tests."
	magician_advantage = "+2 dice for Combat spells and summoning spirits of air."
	disadvantage = "Thunderbird's wrath is legendary. You must make a Charisma + Willpower (3) test to show mercy to a defeated foe."
	icon_name = "bolt"
	ui_sort_order = 280
	common_traditions = list("shamanic")

/datum/sr_mentor_spirit/sea
	name = "Sea"
	desc = "Vast and deep, keeper of secrets and the unknown."
	advantage = "+2 dice for Swimming tests and Navigation tests on water."
	magician_advantage = "+2 dice for summoning or binding water spirits."
	disadvantage = "Sea calls to you. You must make a Willpower (3) test to willingly go more than a day's travel from large bodies of water."
	icon_name = "water"
	ui_sort_order = 290
	common_traditions = list("shamanic", "shinto")

/datum/sr_mentor_spirit/horse
	name = "Horse"
	desc = "Swift and free, the eternal traveler and messenger."
	advantage = "+2 dice for Running tests and all tests while mounted."
	magician_advantage = "+2 dice for Detection spells, preparations, and rituals."
	disadvantage = "Horse cannot be caged. You suffer -2 to all tests when confined or restrained."
	icon_name = "horse"
	ui_sort_order = 300
	common_traditions = list("shamanic")

/datum/sr_mentor_spirit/oracle
	name = "Oracle"
	desc = "The voice of prophecy, cursed to see what cannot be changed."
	advantage = "+2 dice for Assensing and all tests to predict outcomes."
	magician_advantage = "+2 dice for Detection spells, preparations, and rituals."
	disadvantage = "Oracle compels truth. You must make a Charisma + Willpower (3) test to tell a direct lie."
	icon_name = "eye"
	ui_sort_order = 310
	common_traditions = list("hermetic", "chaos_magic")

/datum/sr_mentor_spirit/peacemaker
	name = "Peacemaker"
	desc = "The diplomat, resolver of conflicts and healer of divisions."
	advantage = "+2 dice for Negotiation and Etiquette tests."
	magician_advantage = "+2 dice for Health spells, preparations, and rituals."
	disadvantage = "Peacemaker abhors violence. You must make a Charisma + Willpower (4) test to initiate combat."
	icon_name = "dove"
	ui_sort_order = 320
	common_traditions = list("wicca", "buddhism")

/datum/sr_mentor_spirit/adversary
	name = "Adversary"
	desc = "The eternal opposer, tester of limits and breaker of rules."
	advantage = "+2 dice for Intimidation and one Social skill of your choice."
	magician_advantage = "+2 dice for Manipulation spells, preparations, and rituals."
	disadvantage = "Adversary demands conflict. You must make a Charisma + Willpower (3) test to agree without argument."
	icon_name = "skull"
	ui_sort_order = 330
	common_traditions = list("black_magic", "chaos_magic")

/datum/sr_mentor_spirit/moon
	name = "Moon"
	desc = "Mistress of cycles, secrets, and hidden truths."
	advantage = "+2 dice for Sneaking tests at night and Assensing tests."
	magician_advantage = "+2 dice for Illusion spells, preparations, and rituals."
	disadvantage = "Moon's children are affected by lunar cycles. -1 to all tests during daylight hours."
	icon_name = "moon"
	ui_sort_order = 340
	common_traditions = list("wicca", "shamanic")


// =============================================================================
// UTILITY PROCS
// =============================================================================

/// Global list of mentor spirits, built lazily
GLOBAL_LIST_EMPTY(sr_mentor_spirits)

/// Gets the mentor spirits list, building it on first access if needed
/proc/get_sr_mentor_spirits()
	if(!length(GLOB.sr_mentor_spirits))
		populate_sr_mentor_spirits()
	return GLOB.sr_mentor_spirits

/// Populates the mentor spirits list
/proc/populate_sr_mentor_spirits()
	if(length(GLOB.sr_mentor_spirits))
		return
	for(var/mentor_path in subtypesof(/datum/sr_mentor_spirit))
		var/datum/sr_mentor_spirit/M = new mentor_path
		if(!M.name)
			qdel(M)
			continue
		GLOB.sr_mentor_spirits["[mentor_path]"] = M
