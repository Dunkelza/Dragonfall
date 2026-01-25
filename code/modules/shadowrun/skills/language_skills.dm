/**
 * Shadowrun 5e Language Skills
 *
 * Language skills determine how well a character can speak, read, and write languages.
 * In SR5, characters get one native language for free at rating N (Native).
 * Other languages are rated 1-6, with 4+ being fluent.
 *
 * Languages available depend on the Sixth World setting.
 */

/datum/rpg_language
	abstract_type = /datum/rpg_language

	var/name = ""
	var/desc = ""
	/// Rating: 0 = None, 1-3 = Basic, 4-5 = Fluent, 6 = Expert, "N" = Native
	var/value = 0
	/// Is this the character's native language?
	var/is_native = FALSE
	/// Language family for grouping in UI
	var/family = "common"
	/// Affects the sort order in TGUI
	var/ui_sort_order = 0

/datum/rpg_language/proc/get_rating_text()
	if(is_native)
		return "N"
	switch(value)
		if(0)
			return "None"
		if(1, 2)
			return "Basic"
		if(3)
			return "Conversational"
		if(4, 5)
			return "Fluent"
		if(6)
			return "Expert"
	return "[value]"

// =============================================================================
// COMMON LANGUAGES (Sixth World)
// =============================================================================

/datum/rpg_language/english
	name = "English"
	desc = "The dominant language of the UCAS, CAS, and much of the corporate world."
	family = "common"
	ui_sort_order = 10

/datum/rpg_language/japanese
	name = "Japanese"
	desc = "Official language of Japan and common in many megacorps."
	family = "common"
	ui_sort_order = 20

/datum/rpg_language/mandarin
	name = "Mandarin"
	desc = "Most spoken language in the world, dominant in China and the PCC."
	family = "common"
	ui_sort_order = 30

/datum/rpg_language/spanish
	name = "Spanish"
	desc = "Common in Aztlan, CAS, and much of the Americas."
	family = "common"
	ui_sort_order = 40

/datum/rpg_language/german
	name = "German"
	desc = "Official language of the Allied German States and S-K subsidiaries."
	family = "common"
	ui_sort_order = 50

/datum/rpg_language/russian
	name = "Russian"
	desc = "Dominant in the Russian Republic and former Soviet territories."
	family = "common"
	ui_sort_order = 60

/datum/rpg_language/french
	name = "French"
	desc = "Official language of Quebec and common in Europe and Africa."
	family = "common"
	ui_sort_order = 70

/datum/rpg_language/arabic
	name = "Arabic"
	desc = "Dominant in the Middle East and North Africa."
	family = "common"
	ui_sort_order = 80

// =============================================================================
// REGIONAL LANGUAGES
// =============================================================================

/datum/rpg_language/cantonese
	name = "Cantonese"
	desc = "Common in Hong Kong Free Enterprise Zone and southern China."
	family = "regional"
	ui_sort_order = 100

/datum/rpg_language/korean
	name = "Korean"
	desc = "Official language of Korea and common in Japanese megacorps."
	family = "regional"
	ui_sort_order = 110

/datum/rpg_language/italian
	name = "Italian"
	desc = "Official language of the Italian Confederation."
	family = "regional"
	ui_sort_order = 120

/datum/rpg_language/portuguese
	name = "Portuguese"
	desc = "Official language of Amazonia."
	family = "regional"
	ui_sort_order = 130

/datum/rpg_language/hindi
	name = "Hindi"
	desc = "One of the major languages of the Indian Union."
	family = "regional"
	ui_sort_order = 140

// =============================================================================
// NATIVE AMERICAN LANGUAGES
// =============================================================================

/datum/rpg_language/lakota
	name = "Lakota"
	desc = "Official language of the Sioux Nation."
	family = "native_american"
	ui_sort_order = 200

/datum/rpg_language/salish
	name = "Salish"
	desc = "Official language of the Salish-Shidhe Council."
	family = "native_american"
	ui_sort_order = 210

/datum/rpg_language/dine
	name = "Diné Bizaad"
	desc = "Navajo language, common in the Pueblo Corporate Council."
	family = "native_american"
	ui_sort_order = 220

// =============================================================================
// MAGICAL/SPECIALTY LANGUAGES
// =============================================================================

/datum/rpg_language/sperethiel
	name = "Sperethiel"
	desc = "The ancient elven language, revived after the Awakening."
	family = "magical"
	ui_sort_order = 300

/datum/rpg_language/orzet
	name = "Or'zet"
	desc = "The ork underground language, a sign of ork cultural pride."
	family = "magical"
	ui_sort_order = 310

/datum/rpg_language/latin
	name = "Latin"
	desc = "Classical language used in academia and magical traditions."
	family = "magical"
	ui_sort_order = 320

// =============================================================================
// SIGN LANGUAGES
// =============================================================================

/datum/rpg_language/asl
	name = "ASL"
	desc = "American Sign Language."
	family = "sign"
	ui_sort_order = 400

/datum/rpg_language/cityspeak
	name = "Cityspeak"
	desc = "A pidgin language common in sprawl streets, mixing many tongues."
	family = "sign"
	ui_sort_order = 410

// =============================================================================
// SR5 LANGUAGE TO SS13 LANGUAGE MAPPING
// =============================================================================

/// Maps SR5 rpg_language types to SS13 datum/language types.
/// All SR5 languages now have dedicated /datum/language/sr5/* implementations.
/proc/get_ss13_language_for_sr5(sr5_lang_path)
	var/static/list/lang_mapping = list(
		// Common languages
		"[/datum/rpg_language/english]" = /datum/language/sr5/english,
		"[/datum/rpg_language/japanese]" = /datum/language/sr5/japanese,
		"[/datum/rpg_language/mandarin]" = /datum/language/sr5/mandarin,
		"[/datum/rpg_language/spanish]" = /datum/language/sr5/spanish,
		"[/datum/rpg_language/german]" = /datum/language/sr5/german,
		"[/datum/rpg_language/russian]" = /datum/language/sr5/russian,
		"[/datum/rpg_language/french]" = /datum/language/sr5/french,
		"[/datum/rpg_language/arabic]" = /datum/language/sr5/arabic,
		// Regional languages
		"[/datum/rpg_language/cantonese]" = /datum/language/sr5/cantonese,
		"[/datum/rpg_language/korean]" = /datum/language/sr5/korean,
		"[/datum/rpg_language/italian]" = /datum/language/sr5/italian,
		"[/datum/rpg_language/portuguese]" = /datum/language/sr5/portuguese,
		"[/datum/rpg_language/hindi]" = /datum/language/sr5/hindi,
		// Native American languages
		"[/datum/rpg_language/lakota]" = /datum/language/sr5/lakota,
		"[/datum/rpg_language/salish]" = /datum/language/sr5/salish,
		"[/datum/rpg_language/dine]" = /datum/language/sr5/dine,
		// Magical/Metatype languages
		"[/datum/rpg_language/sperethiel]" = /datum/language/sr5/sperethiel,
		"[/datum/rpg_language/orzet]" = /datum/language/sr5/orzet,
		"[/datum/rpg_language/latin]" = /datum/language/sr5/latin,
		// Special languages
		"[/datum/rpg_language/cityspeak]" = /datum/language/sr5/cityspeak,
		"[/datum/rpg_language/asl]" = /datum/language/sr5/asl,
	)

	var/key = "[sr5_lang_path]"
	return lang_mapping[key]

/// Applies SR5 language ratings to a mob's language holder.
/// Rating 1-2 = basic understanding only
/// Rating 3 = conversational (understand fully)
/// Rating 4+ = fluent (speak and understand)
/// Rating N (native) = perfect fluency
/proc/apply_sr5_languages_to_mob(mob/living/target, list/languages, native_language)
	if(!target)
		return

	// Source identifier for SR5 chargen languages
	var/source = "sr5_chargen"

	// Get language holder
	var/datum/language_holder/holder = target.get_language_holder()
	if(!holder)
		return

	// Process each language
	for(var/lang_key in languages)
		var/rating = languages[lang_key]
		if(!isnum(rating) || rating < 1)
			continue

		var/lang_path = text2path(lang_key)
		if(!lang_path)
			continue

		var/ss13_lang = get_ss13_language_for_sr5(lang_path)
		if(!ss13_lang)
			continue // This SR5 language has no SS13 equivalent

		// Rating thresholds based on SR5 language skill rules:
		// 1-2: Basic - can understand simple phrases (understand = TRUE at 2+)
		// 3: Conversational - can understand fluently (understand = TRUE)
		// 4+: Fluent - can speak and understand freely (speak = TRUE)
		var/can_understand = rating >= 2
		var/can_speak = rating >= 4

		if(can_understand || can_speak)
			target.grant_language(ss13_lang, can_understand, can_speak, source)

	// Handle native language (always full fluency)
	if(native_language)
		var/native_path = text2path(native_language)
		if(native_path)
			var/ss13_native = get_ss13_language_for_sr5(native_path)
			if(ss13_native)
				target.grant_language(ss13_native, TRUE, TRUE, source)
