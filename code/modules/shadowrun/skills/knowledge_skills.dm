/**
 * Shadowrun 5e Knowledge Skills
 *
 * Knowledge skills represent what a character knows beyond their physical abilities.
 * In SR5, characters get (INT × 2) free knowledge skill points.
 *
 * Knowledge skills are divided into categories:
 * - Academic: Formal education topics (Biology, History, Magic Theory, etc.)
 * - Street: Street-level knowledge (Gang ID, Sprawl Life, Drug Culture, etc.)
 * - Professional: Job-related knowledge (Corporate Politics, Law, Security, etc.)
 * - Interests: Hobbies and personal interests (Sports, Music, Trids, etc.)
 */

/datum/rpg_knowledge_skill
	abstract_type = /datum/rpg_knowledge_skill

	var/name = ""
	var/desc = ""
	/// Base rating for this skill (0-6)
	var/value = 0
	var/list/modifiers
	/// Category: "academic", "street", "professional", "interests"
	var/category = "academic"
	/// Linked attribute - usually Logic or Intuition
	var/parent_stat_type = /datum/rpg_stat/logic
	/// Affects the sort order in TGUI
	var/ui_sort_order = 0

/datum/rpg_knowledge_skill/proc/get(mob/living/user, list/out_sources)
	return value

/datum/rpg_knowledge_skill/proc/update_modifiers()
	SHOULD_NOT_OVERRIDE(TRUE)
	value = initial(value)
	value += values_sum(modifiers)

// =============================================================================
// ACADEMIC KNOWLEDGE SKILLS (Logic-linked)
// =============================================================================

/datum/rpg_knowledge_skill/biology
	name = "Biology"
	desc = "Understanding of living organisms, genetics, and medicine."
	category = "academic"
	parent_stat_type = /datum/rpg_stat/logic
	ui_sort_order = 10

/datum/rpg_knowledge_skill/chemistry
	name = "Chemistry"
	desc = "Knowledge of chemical compounds, reactions, and synthesis."
	category = "academic"
	parent_stat_type = /datum/rpg_stat/logic
	ui_sort_order = 20

/datum/rpg_knowledge_skill/engineering
	name = "Engineering"
	desc = "Understanding of mechanical and electrical systems."
	category = "academic"
	parent_stat_type = /datum/rpg_stat/logic
	ui_sort_order = 30

/datum/rpg_knowledge_skill/history
	name = "History"
	desc = "Knowledge of past events, civilizations, and historical figures."
	category = "academic"
	parent_stat_type = /datum/rpg_stat/logic
	ui_sort_order = 40

/datum/rpg_knowledge_skill/magic_theory
	name = "Magic Theory"
	desc = "Understanding of magical traditions, astral space, and mana."
	category = "academic"
	parent_stat_type = /datum/rpg_stat/logic
	ui_sort_order = 50

/datum/rpg_knowledge_skill/matrix_theory
	name = "Matrix Theory"
	desc = "Knowledge of Matrix architecture, protocols, and cyberspace."
	category = "academic"
	parent_stat_type = /datum/rpg_stat/logic
	ui_sort_order = 60

/datum/rpg_knowledge_skill/parabotany
	name = "Parabotany"
	desc = "Study of Awakened plants and magical flora."
	category = "academic"
	parent_stat_type = /datum/rpg_stat/logic
	ui_sort_order = 70

/datum/rpg_knowledge_skill/parazoology
	name = "Parazoology"
	desc = "Study of Awakened creatures and magical fauna."
	category = "academic"
	parent_stat_type = /datum/rpg_stat/logic
	ui_sort_order = 80

// =============================================================================
// STREET KNOWLEDGE SKILLS (Intuition-linked)
// =============================================================================

/datum/rpg_knowledge_skill/gang_identification
	name = "Gang Identification"
	desc = "Recognizing gang colors, signs, territories, and hierarchies."
	category = "street"
	parent_stat_type = /datum/rpg_stat/intuition
	ui_sort_order = 100

/datum/rpg_knowledge_skill/sprawl_life
	name = "Sprawl Life"
	desc = "Knowledge of urban survival, squats, and street culture."
	category = "street"
	parent_stat_type = /datum/rpg_stat/intuition
	ui_sort_order = 110

/datum/rpg_knowledge_skill/underworld
	name = "Underworld"
	desc = "Knowledge of criminal organizations, syndicates, and black markets."
	category = "street"
	parent_stat_type = /datum/rpg_stat/intuition
	ui_sort_order = 120

/datum/rpg_knowledge_skill/drug_culture
	name = "Drug Culture"
	desc = "Knowledge of street drugs, dealers, and the drug trade."
	category = "street"
	parent_stat_type = /datum/rpg_stat/intuition
	ui_sort_order = 130

/datum/rpg_knowledge_skill/safe_houses
	name = "Safe Houses"
	desc = "Knowledge of hideouts, bolt holes, and secure locations."
	category = "street"
	parent_stat_type = /datum/rpg_stat/intuition
	ui_sort_order = 140

// =============================================================================
// PROFESSIONAL KNOWLEDGE SKILLS (Logic-linked)
// =============================================================================

/datum/rpg_knowledge_skill/corporate_politics
	name = "Corporate Politics"
	desc = "Understanding of megacorp power structures and business dealings."
	category = "professional"
	parent_stat_type = /datum/rpg_stat/logic
	ui_sort_order = 200

/datum/rpg_knowledge_skill/law
	name = "Law"
	desc = "Knowledge of legal systems, contracts, and regulations."
	category = "professional"
	parent_stat_type = /datum/rpg_stat/logic
	ui_sort_order = 210

/datum/rpg_knowledge_skill/security_procedures
	name = "Security Procedures"
	desc = "Understanding of security protocols, guards, and countermeasures."
	category = "professional"
	parent_stat_type = /datum/rpg_stat/logic
	ui_sort_order = 220

/datum/rpg_knowledge_skill/shadowrunner_culture
	name = "Shadowrunner Culture"
	desc = "Knowledge of runner etiquette, Johnson meetings, and the shadows."
	category = "professional"
	parent_stat_type = /datum/rpg_stat/logic
	ui_sort_order = 230

/datum/rpg_knowledge_skill/military
	name = "Military"
	desc = "Knowledge of military tactics, organizations, and equipment."
	category = "professional"
	parent_stat_type = /datum/rpg_stat/logic
	ui_sort_order = 240

/datum/rpg_knowledge_skill/medicine_knowledge
	name = "Medicine"
	desc = "Medical knowledge beyond first aid - diseases, treatments, anatomy."
	category = "professional"
	parent_stat_type = /datum/rpg_stat/logic
	ui_sort_order = 250

// =============================================================================
// INTEREST KNOWLEDGE SKILLS (Intuition-linked)
// =============================================================================

/datum/rpg_knowledge_skill/music
	name = "Music"
	desc = "Knowledge of musical genres, artists, and history."
	category = "interests"
	parent_stat_type = /datum/rpg_stat/intuition
	ui_sort_order = 300

/datum/rpg_knowledge_skill/sports
	name = "Sports"
	desc = "Knowledge of sports, teams, players, and statistics."
	category = "interests"
	parent_stat_type = /datum/rpg_stat/intuition
	ui_sort_order = 310

/datum/rpg_knowledge_skill/trids
	name = "Trids"
	desc = "Knowledge of trideo shows, movies, and entertainment."
	category = "interests"
	parent_stat_type = /datum/rpg_stat/intuition
	ui_sort_order = 320

/datum/rpg_knowledge_skill/urban_legends
	name = "Urban Legends"
	desc = "Knowledge of conspiracies, legends, and supernatural rumors."
	category = "interests"
	parent_stat_type = /datum/rpg_stat/intuition
	ui_sort_order = 330

/datum/rpg_knowledge_skill/combat_biking
	name = "Combat Biking"
	desc = "Knowledge of the combat biker league, teams, and tactics."
	category = "interests"
	parent_stat_type = /datum/rpg_stat/intuition
	ui_sort_order = 340
