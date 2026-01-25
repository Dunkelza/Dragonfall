/**
 * Shadowrun 5e Magical Traditions
 *
 * A tradition determines how a magician views and interacts with magic.
 * It affects which attributes are used for Drain resistance.
 *
 * In SR5, Drain is resisted with Willpower + [Drain Attribute].
 * The Drain Attribute is determined by the tradition.
 */

/datum/sr_tradition
	abstract_type = /datum/sr_tradition

	var/name = ""
	var/desc = ""
	/// The attribute used with Willpower to resist Drain
	/// Options: "charisma", "logic", "intuition"
	var/drain_attribute = "charisma"
	/// Brief description of the tradition's worldview
	var/philosophy = ""
	/// Spirit types this tradition can summon (flavor)
	var/list/spirits = list()
	/// Affects the sort order in TGUI
	var/ui_sort_order = 0

// =============================================================================
// CORE TRADITIONS
// =============================================================================

/datum/sr_tradition/hermetic
	name = "Hermetic"
	desc = "Academic, logical approach to magic based on formulae and research."
	drain_attribute = "logic"
	philosophy = "Magic is a science that can be studied, quantified, and mastered through intellectual rigor."
	spirits = list("Earth", "Fire", "Water", "Air", "Man")
	ui_sort_order = 10

/datum/sr_tradition/shamanic
	name = "Shamanic"
	desc = "Nature-focused tradition guided by animal totem spirits."
	drain_attribute = "charisma"
	philosophy = "Magic flows from the spirit world. Totems guide and empower those who listen."
	spirits = list("Beast", "Earth", "Water", "Air", "Man")
	ui_sort_order = 20

/datum/sr_tradition/chaos_magic
	name = "Chaos Magic"
	desc = "Belief creates reality. Paradigm-shifting magic without fixed rules."
	drain_attribute = "intuition"
	philosophy = "Belief is the only true power. Reality bends to those who can truly believe."
	spirits = list("Fire", "Man", "Guardian", "Task")
	ui_sort_order = 30

/datum/sr_tradition/black_magic
	name = "Black Magic"
	desc = "Dark tradition focused on power over others and oneself."
	drain_attribute = "charisma"
	philosophy = "Power is the only truth. Take what you need by force of will."
	spirits = list("Fire", "Earth", "Man", "Guardian")
	ui_sort_order = 40

/datum/sr_tradition/wicca
	name = "Wicca"
	desc = "Nature-revering tradition focused on balance and harmony."
	drain_attribute = "intuition"
	philosophy = "Magic is a gift from the earth. Harm none and nature will provide."
	spirits = list("Beast", "Earth", "Water", "Plant", "Man")
	ui_sort_order = 50

// =============================================================================
// CULTURAL TRADITIONS
// =============================================================================

/datum/sr_tradition/aztec
	name = "Aztec"
	desc = "Blood magic tradition honoring the old gods of Mesoamerica."
	drain_attribute = "charisma"
	philosophy = "The gods demand sacrifice. Blood is the currency of power."
	spirits = list("Beast", "Fire", "Water", "Earth", "Man")
	ui_sort_order = 100

/datum/sr_tradition/shinto
	name = "Shinto"
	desc = "Japanese tradition honoring the kami spirits of nature."
	drain_attribute = "intuition"
	philosophy = "Kami dwell in all things. Respect the spirits and they will aid you."
	spirits = list("Air", "Beast", "Earth", "Man", "Water")
	ui_sort_order = 110

/datum/sr_tradition/voudou
	name = "Voudou"
	desc = "Caribbean tradition working with the Loa spirits."
	drain_attribute = "charisma"
	philosophy = "The Loa are family. Serve them well and they serve you."
	spirits = list("Fire", "Man", "Water", "Guardian")
	ui_sort_order = 120

/datum/sr_tradition/buddhism
	name = "Buddhist"
	desc = "Eastern tradition focused on enlightenment and inner peace."
	drain_attribute = "intuition"
	philosophy = "Magic flows from inner stillness. Master the self to master reality."
	spirits = list("Air", "Beast", "Earth", "Fire", "Water")
	ui_sort_order = 130

/datum/sr_tradition/norse
	name = "Norse"
	desc = "Viking tradition honoring the Aesir and Vanir."
	drain_attribute = "charisma"
	philosophy = "Glory in battle, wisdom in runes. The gods favor the bold."
	spirits = list("Air", "Beast", "Fire", "Guardian", "Man")
	ui_sort_order = 140

/datum/sr_tradition/druidic
	name = "Druidic"
	desc = "Celtic tradition of nature priests and sacred groves."
	drain_attribute = "intuition"
	philosophy = "The old ways remember. Nature's patterns reveal all truths."
	spirits = list("Beast", "Earth", "Plant", "Water")
	ui_sort_order = 150

// =============================================================================
// SPECIALIZED TRADITIONS
// =============================================================================

/datum/sr_tradition/street_magic
	name = "Street Magic"
	desc = "Urban magic born from the sprawl's chaos and creativity."
	drain_attribute = "charisma"
	philosophy = "Magic is everywhere in the sprawl. You just need to know where to look."
	spirits = list("Fire", "Man", "Task", "Guardian")
	ui_sort_order = 200

/datum/sr_tradition/psionics
	name = "Psionics"
	desc = "Scientific approach treating magic as mental discipline."
	drain_attribute = "logic"
	philosophy = "The mind is the ultimate tool. Everything else is just potential."
	spirits = list("Air", "Man", "Task")
	ui_sort_order = 210

/datum/sr_tradition/christian_theurgy
	name = "Christian Theurgy"
	desc = "Christian mysticism channeling divine power."
	drain_attribute = "charisma"
	philosophy = "Magic is a gift from the divine. Use it to serve a higher purpose."
	spirits = list("Air", "Fire", "Guardian", "Man")
	ui_sort_order = 220

/datum/sr_tradition/qabbalist
	name = "Qabbalist"
	desc = "Jewish mystical tradition based on the Tree of Life."
	drain_attribute = "logic"
	philosophy = "The universe is structured by divine mathematics. Understand the pattern."
	spirits = list("Air", "Earth", "Fire", "Man", "Water")
	ui_sort_order = 230

// =============================================================================
// ADDITIONAL TRADITIONS
// =============================================================================

/datum/sr_tradition/wuxing
	name = "Wuxing"
	desc = "Chinese tradition based on the five elements and yin-yang balance."
	drain_attribute = "intuition"
	philosophy = "All things flow from the interplay of the five elements. Balance is power."
	spirits = list("Earth", "Fire", "Water", "Air", "Man")
	ui_sort_order = 240

/datum/sr_tradition/path_of_the_wheel
	name = "Path of the Wheel"
	desc = "Romani tradition following the eternal cycle of fate and fortune."
	drain_attribute = "intuition"
	philosophy = "Fate turns like a wheel. Read the signs and ride the currents of destiny."
	spirits = list("Air", "Fire", "Man", "Task")
	ui_sort_order = 250

/datum/sr_tradition/islamic_alchemy
	name = "Islamic Alchemy"
	desc = "Tradition rooted in Sufi mysticism and alchemical transformation."
	drain_attribute = "logic"
	philosophy = "Magic is the refinement of the soul. Transform the base into the divine."
	spirits = list("Air", "Earth", "Fire", "Man", "Water")
	ui_sort_order = 260

/datum/sr_tradition/zoroastrian
	name = "Zoroastrian"
	desc = "Ancient Persian tradition of light against darkness."
	drain_attribute = "charisma"
	philosophy = "The eternal battle between Ahura Mazda and Angra Mainyu plays out in all things."
	spirits = list("Fire", "Air", "Guardian", "Man")
	ui_sort_order = 270

/datum/sr_tradition/santeria
	name = "Santeria"
	desc = "Afro-Cuban tradition blending Yoruba beliefs with Catholic imagery."
	drain_attribute = "charisma"
	philosophy = "The Orishas walk among us. Honor them and they share their power."
	spirits = list("Beast", "Fire", "Man", "Water", "Guardian")
	ui_sort_order = 280

/datum/sr_tradition/hindu
	name = "Hindu"
	desc = "Indian tradition invoking the power of the Vedic deities."
	drain_attribute = "charisma"
	philosophy = "All is Brahman. Through devotion and discipline, touch the infinite."
	spirits = list("Air", "Beast", "Earth", "Fire", "Water", "Man")
	ui_sort_order = 290

/datum/sr_tradition/necromancy
	name = "Necromancy"
	desc = "Dark tradition focused on death magic and communing with the dead."
	drain_attribute = "charisma"
	philosophy = "Death is not an ending but a threshold. The dead remember all."
	spirits = list("Man", "Task", "Guardian")
	ui_sort_order = 300

/datum/sr_tradition/romani
	name = "Romani"
	desc = "Traveling people's tradition of curses, fortune, and freedom."
	drain_attribute = "intuition"
	philosophy = "The road provides. Fortune favors those who wander."
	spirits = list("Air", "Beast", "Fire", "Man")
	ui_sort_order = 310

/datum/sr_tradition/insect_shaman
	name = "Insect Shaman"
	desc = "Dangerous tradition serving the alien insect spirits."
	drain_attribute = "charisma"
	philosophy = "The hive is all. Serve the queen and be reborn in perfection."
	spirits = list("Beast", "Guardian", "Task")
	ui_sort_order = 999 // Hidden/restricted

/datum/sr_tradition/toxic_shaman
	name = "Toxic Shaman"
	desc = "Corrupted tradition drawing power from pollution and decay."
	drain_attribute = "charisma"
	philosophy = "Purity is a lie. Embrace the poison and become immune to weakness."
	spirits = list("Earth", "Fire", "Man", "Water")
	ui_sort_order = 998 // Hidden/restricted
