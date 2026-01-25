/**
 * Shadowrun 5e Contacts System
 *
 * Contacts are NPCs that runners know and can call on for favors,
 * information, or services. Each contact has two ratings:
 *
 * - Connection (1-12): How useful/powerful the contact is
 *   1 = Street-level, knows local gossip
 *   3 = Professional, has useful specialized knowledge
 *   6 = Well-connected, has significant influence
 *   9 = Major player, has considerable power
 *   12 = Legendary, knows everyone and everything
 *
 * - Loyalty (1-6): How much the contact likes/trusts you
 *   1 = Just business, will sell you out easily
 *   2 = Regular customer, slight preference
 *   3 = Friend, will do small favors
 *   4 = Good friend, will go out of their way
 *   5 = Best friend, will take risks for you
 *   6 = Blood brother, would die for you
 *
 * Contact points at chargen = (CHA × 3)
 * Cost = Connection + Loyalty per contact
 */

/datum/sr_contact
	abstract_type = /datum/sr_contact

	var/name = ""
	var/desc = ""
	/// The contact's profession or role
	var/profession = ""
	/// What the contact specializes in
	var/specialty = ""
	/// Contact's archetype for categorization
	var/archetype = "general"
	/// Affects UI sort order
	var/ui_sort_order = 0

// =============================================================================
// FIXER CONTACTS
// =============================================================================

/datum/sr_contact/fixer
	name = "Street Fixer"
	desc = "A middleman who connects runners with jobs and buyers for hot goods."
	profession = "Fixer"
	specialty = "Finding work, fencing goods, making introductions"
	archetype = "fixer"
	ui_sort_order = 10

/datum/sr_contact/fixer_high
	name = "High-End Fixer"
	desc = "A well-connected fixer who handles lucrative corporate jobs."
	profession = "Elite Fixer"
	specialty = "Corporate runs, AAA contacts, high-value merchandise"
	archetype = "fixer"
	ui_sort_order = 11

// =============================================================================
// GEAR CONTACTS
// =============================================================================

/datum/sr_contact/arms_dealer
	name = "Arms Dealer"
	desc = "A supplier of weapons and ammunition, legal or otherwise."
	profession = "Arms Dealer"
	specialty = "Firearms, melee weapons, ammo, weapon mods"
	archetype = "gear"
	ui_sort_order = 100

/datum/sr_contact/street_doc
	name = "Street Doc"
	desc = "An unlicensed doctor who patches up runners and installs cyberware."
	profession = "Street Doctor"
	specialty = "Medical care, cyberware installation, bioware"
	archetype = "gear"
	ui_sort_order = 110

/datum/sr_contact/talismonger
	name = "Talismonger"
	desc = "A dealer in magical goods and reagents."
	profession = "Talismonger"
	specialty = "Foci, reagents, magical supplies, spirit binding materials"
	archetype = "gear"
	ui_sort_order = 120

/datum/sr_contact/decker_contact
	name = "Hardware Supplier"
	desc = "A tech specialist who provides Matrix hardware and software."
	profession = "Tech Dealer"
	specialty = "Cyberdecks, programs, commlinks, electronics"
	archetype = "gear"
	ui_sort_order = 130

/datum/sr_contact/vehicle_dealer
	name = "Vehicle Dealer"
	desc = "A supplier of transportation, from motorcycles to aircraft."
	profession = "Vehicle Dealer"
	specialty = "Vehicles, drones, vehicle mods, parts"
	archetype = "gear"
	ui_sort_order = 140

// =============================================================================
// INFORMATION CONTACTS
// =============================================================================

/datum/sr_contact/corporate_insider
	name = "Corporate Insider"
	desc = "An employee within a megacorp who can provide inside information."
	profession = "Corporate Employee"
	specialty = "Corporate intelligence, internal politics, security schedules"
	archetype = "info"
	ui_sort_order = 200

/datum/sr_contact/news_reporter
	name = "News Reporter"
	desc = "A journalist with access to information networks and public records."
	profession = "Journalist"
	specialty = "Public records, media contacts, breaking news, investigation"
	archetype = "info"
	ui_sort_order = 210

/datum/sr_contact/decker
	name = "Matrix Specialist"
	desc = "A skilled hacker who can dig up information from the Matrix."
	profession = "Decker"
	specialty = "Matrix searches, host infiltration, data analysis"
	archetype = "info"
	ui_sort_order = 220

/datum/sr_contact/bartender
	name = "Bartender"
	desc = "A barkeep who hears everything and knows everyone in the shadows."
	profession = "Bartender"
	specialty = "Local gossip, gang activity, underworld rumors"
	archetype = "info"
	ui_sort_order = 230

/datum/sr_contact/investigator
	name = "Private Investigator"
	desc = "A licensed PI with legal access to records and surveillance."
	profession = "Private Investigator"
	specialty = "Background checks, surveillance, finding people"
	archetype = "info"
	ui_sort_order = 240

// =============================================================================
// SERVICE CONTACTS
// =============================================================================

/datum/sr_contact/lawyer
	name = "Lawyer"
	desc = "A legal professional who can help with contracts and legal trouble."
	profession = "Lawyer"
	specialty = "Legal advice, contract review, court representation"
	archetype = "service"
	ui_sort_order = 300

/datum/sr_contact/smuggler
	name = "Smuggler"
	desc = "Someone who moves goods across borders without attracting attention."
	profession = "Smuggler"
	specialty = "Border crossing, customs evasion, covert transport"
	archetype = "service"
	ui_sort_order = 310

/datum/sr_contact/taxi_driver
	name = "Taxi Driver"
	desc = "A driver who knows the city and doesn't ask questions."
	profession = "Driver"
	specialty = "Quick transport, knowledge of city, getaway driving"
	archetype = "service"
	ui_sort_order = 320

/datum/sr_contact/mechanic
	name = "Mechanic"
	desc = "A skilled technician who repairs and modifies vehicles."
	profession = "Mechanic"
	specialty = "Vehicle repair, modifications, custom work"
	archetype = "service"
	ui_sort_order = 330

/datum/sr_contact/forger
	name = "Forger"
	desc = "A specialist in fake documents and identification."
	profession = "Forger"
	specialty = "Fake SINs, licenses, credentials, document forgery"
	archetype = "service"
	ui_sort_order = 340

// =============================================================================
// GANG/STREET CONTACTS
// =============================================================================

/datum/sr_contact/gang_leader
	name = "Gang Leader"
	desc = "The head of a local street gang with muscle and territory."
	profession = "Gang Leader"
	specialty = "Muscle, territory control, street enforcement"
	archetype = "street"
	ui_sort_order = 400

/datum/sr_contact/gang_member
	name = "Ganger"
	desc = "A member of a street gang who knows the local scene."
	profession = "Ganger"
	specialty = "Street knowledge, local connections, small-time muscle"
	archetype = "street"
	ui_sort_order = 410

/datum/sr_contact/squatter
	name = "Squatter"
	desc = "A homeless individual who knows the forgotten places."
	profession = "Squatter"
	specialty = "Abandoned buildings, underground access, observation"
	archetype = "street"
	ui_sort_order = 420

/datum/sr_contact/fence
	name = "Fence"
	desc = "Someone who buys and sells stolen goods."
	profession = "Fence"
	specialty = "Moving hot goods, appraisal, black market connections"
	archetype = "street"
	ui_sort_order = 430

// =============================================================================
// LAW ENFORCEMENT CONTACTS
// =============================================================================

/datum/sr_contact/cop
	name = "Corrupt Cop"
	desc = "A police officer willing to look the other way for the right price."
	profession = "Police Officer"
	specialty = "Police procedures, tip-offs, evidence tampering"
	archetype = "law"
	ui_sort_order = 500

/datum/sr_contact/detective
	name = "Detective"
	desc = "A police detective with access to case files and investigations."
	profession = "Detective"
	specialty = "Case information, crime scene access, witness lists"
	archetype = "law"
	ui_sort_order = 510

/datum/sr_contact/corp_sec
	name = "Corp Security"
	desc = "A corporate security guard with inside access to facilities."
	profession = "Security Officer"
	specialty = "Security schedules, access codes, patrol routes"
	archetype = "law"
	ui_sort_order = 520

// =============================================================================
// MAGIC CONTACTS
// =============================================================================

/datum/sr_contact/mage
	name = "Street Mage"
	desc = "A practicing magician who knows the magical community."
	profession = "Mage"
	specialty = "Magical knowledge, astral reconnaissance, spell advice"
	archetype = "magic"
	ui_sort_order = 600

/datum/sr_contact/shaman
	name = "Shaman"
	desc = "A traditional magic practitioner connected to spirits."
	profession = "Shaman"
	specialty = "Spirit lore, traditional magic, nature spirits"
	archetype = "magic"
	ui_sort_order = 610

/datum/sr_contact/occult_scholar
	name = "Occult Scholar"
	desc = "An academic who studies magic and the supernatural."
	profession = "Professor/Scholar"
	specialty = "Magical theory, artifact identification, historical lore"
	archetype = "magic"
	ui_sort_order = 620
