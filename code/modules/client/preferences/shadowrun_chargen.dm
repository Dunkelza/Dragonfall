/// Shadowrun 5e-style character creation (Priority + point-buy for stats/skills).

#define SHADOWRUN_CHARGEN_SOURCE "Character Creation"

// Bump this when the on-disk state schema changes.
#define SHADOWRUN_CHARGEN_SCHEMA_VERSION 4

// Temporary toggle: only allow Human metatype until we map species properly.
#define SHADOWRUN_CHARGEN_ENABLE_NONHUMAN_METATYPES FALSE

#define METATYPE_PRIORITY_A 5
#define METATYPE_PRIORITY_B 4
#define METATYPE_PRIORITY_C 3
#define METATYPE_PRIORITY_D 2
#define METATYPE_PRIORITY_E 1

/// Returns TRUE if the user's Shadowrun character sheet is marked saved.
/proc/shadowrun_chargen_is_saved(datum/preferences/preferences)
	if (isnull(preferences))
		return FALSE
	// IMPORTANT: Do not call preferences.read_preference() here.
	// This proc is used during UI compilation and preference accessibility checks.
	// Calling read_preference() can recurse back into deserialize() and explode.
	var/list/state = preferences.value_cache[/datum/preference/blob/shadowrun_chargen]
	if (!islist(state))
		return FALSE
	return !!state["saved"]

/// Returns TRUE if non-appearance preferences should be locked.
/// Allow editing in the lobby even during active rounds.
/// Only lock for players who have already spawned into the round.
/proc/shadowrun_should_lock_nonappearance_prefs(datum/preferences/preferences)
	if (isnull(SSticker) || !SSticker.IsRoundInProgress())
		return FALSE // Not in an active round, always allow editing

	// Check if the player is in the lobby (new_player mob)
	var/client/C = preferences?.parent
	if (isnull(C))
		return TRUE // No client, play it safe and lock

	// If the player's mob is a new_player (lobby), allow editing
	if (isnewplayer(C.mob))
		return FALSE

	// Player has spawned into the round, lock their preferences
	return TRUE

/// Returns TRUE if character creation (stats, metatype, etc.) should be locked.
/// Lock during active rounds AND after sheet is saved.
/// Players in the lobby can still edit if they haven't saved their sheet.
/proc/shadowrun_should_lock_chargen(datum/preferences/preferences)
	if (isnull(SSticker) || !SSticker.IsRoundInProgress())
		return shadowrun_chargen_is_saved(preferences) // Only lock if saved

	// Check if the player is in the lobby (new_player mob)
	var/client/C = preferences?.parent
	if (isnull(C))
		return TRUE // No client, play it safe and lock

	// If the player's mob is a new_player (lobby), check saved status
	if (isnewplayer(C.mob))
		return shadowrun_chargen_is_saved(preferences)

	// Player has spawned into the round, lock their chargen
	return TRUE

/datum/preference/blob/shadowrun_chargen
	explanation = "Shadowrun Character Creation"
	savefile_key = "shadowrun_chargen"
	category = "secondary_features"
	savefile_identifier = PREFERENCE_CHARACTER
	can_randomize = FALSE

	/// Keep this relatively late so it can override default stats.
	priority = MAX_PREFERENCE_PRIORITY

/datum/preference/blob/shadowrun_chargen/create_default_value()
	return sanitize_state(list())

/datum/preference/blob/shadowrun_chargen/deserialize(input, datum/preferences/preferences)
	var/list/incoming = ..()
	var/list/sanitized = sanitize_state(incoming)

	if (isnull(preferences))
		return sanitized

	// Use the cached current value to avoid recursive calls into deserialize().
	var/list/current = islist(preferences.value_cache[type]) ? preferences.value_cache[type] : sanitize_state(list())
	current = sanitize_state(current)

	// During active rounds, lock saved sheets to prevent mid-round edits.
	// Players can still finish chargen and save if they haven't saved yet.
	if (!isnull(SSticker) && SSticker.IsRoundInProgress())
		// Always allow a full reset, even mid-round, so players can recover from
		// an accidental empty save.
		if (is_full_reset_state(sanitized))
			return sanitized
		// If already saved, lock edits.
		if (!!current["saved"])
			return current
		// Otherwise, allow edits so the user can finish chargen and save.
		return sanitized

	// Outside of an active round (lobby, etc.), allow ALL changes including
	// re-saves, resets, and edits. Players should be able to modify their
	// sheets freely when not in a round.
	return sanitized

/datum/preference/blob/shadowrun_chargen/is_valid(value)
	return islist(value)

/datum/preference/blob/shadowrun_chargen/value_changed(datum/preferences/prefs, new_value, old_value)
	. = ..()
	// Reset appearance when the selected metatype (species) changes.
	// This keeps species-specific feature defaults sane.
	var/list/new_state = sanitize_state(new_value)
	var/list/old_state = sanitize_state(old_value)
	if (new_state["metatype_species"] != old_state["metatype_species"])
		// Keep the core species preference in sync so other preferences
		// (feature availability, randomization, etc) follow the selected metatype.
		var/datum/preference/S = GLOB.preference_entries[/datum/preference/choiced/species]
		if (S)
			prefs.update_preference(S, new_state["metatype_species"])

		var/datum/preference/P = GLOB.preference_entries[/datum/preference/appearance_mods]
		prefs.update_preference(P, P.create_default_value())

/datum/preference/blob/shadowrun_chargen/apply_to_human(mob/living/carbon/human/target, value)
	if(!target?.stats)
		return

	var/list/state = sanitize_state(value)

	var/list/attrs = state["attributes"]
	var/list/special = state["special"]
	var/list/skills = state["skills"]
	var/list/skill_groups = state["skill_groups"]
	var/list/priorities = state["priorities"]
	var/awakening = state["awakening"]
	var/species_type = state["metatype_species"]

	// Metatype (implemented as species selection).
	if (ispath(species_type, /datum/species))
		target.set_species(species_type, icon_update = FALSE, pref_load = TRUE)

	// Resolve skill group purchases into per-skill minimums.
	var/list/group_skill_min = list()
	for (var/group_id in skill_groups)
		var/group_rating = skill_groups[group_id]
		if (!isnum(group_rating) || group_rating <= 0)
			continue
		group_rating = clamp(round(group_rating), 1, 6)

		var/list/members = get_skill_group_members(group_id)
		if (!islist(members) || !length(members))
			continue

		for (var/skill_path in members)
			if (!ispath(skill_path, /datum/rpg_skill))
				continue
			var/key = "[skill_path]"
			var/current = group_skill_min[key]
			if (!isnum(current) || group_rating > current)
				group_skill_min[key] = group_rating

	// Core attributes (SR5): Body, Agility, Reaction, Strength, Willpower, Logic, Intuition, Charisma.
	for (var/stat_path in get_core_stat_paths())
		var/key = "[stat_path]"
		var/desired = attrs[key]
		if(!isnum(desired))
			desired = 1

		desired = clamp(round(desired), 1, 6)

		var/base_value = target.stats.get_base_stat_value(stat_path)
		var/delta = desired - base_value
		if(delta)
			target.stats.set_stat_modifier(delta, stat_path, SHADOWRUN_CHARGEN_SOURCE)
		else
			target.stats.remove_stat_modifier(stat_path, SHADOWRUN_CHARGEN_SOURCE)

	// Skills: clear/apply for all skills, so removing a bought skill resets it.
	for (var/skill_path in target.stats.get_all_skill_types())
		var/key = "[skill_path]"
		var/desired = skills[key]
		if(!isnum(desired))
			desired = 0
		var/group_min = group_skill_min[key]
		if(isnum(group_min) && group_min > desired)
			desired = group_min
		desired = clamp(round(desired), 0, 6)

		var/base_value = target.stats.get_base_skill_value(skill_path)
		var/delta = desired - base_value
		if(delta)
			target.stats.set_skill_modifier(delta, skill_path, SHADOWRUN_CHARGEN_SOURCE)
		else
			target.stats.remove_skill_modifier(skill_path, SHADOWRUN_CHARGEN_SOURCE)

	// Awakening + Magic from priorities (SR5-ish).
	// If Magic priority is E, we force mundane.
	var/magic_letter = priorities["magic"]
	var/is_awakened = (awakening != "mundane") && (magic_letter != "E")
	var/base_magic_from_priority = is_awakened ? get_magic_rating(magic_letter) : 0

	// Special attribute spending: Edge (always) and Magic (only if awakened).
	var/edge_bonus = isnum(special["[/datum/rpg_stat/edge]"]) ? special["[/datum/rpg_stat/edge]"] : 0
	var/magic_bonus = (is_awakened && isnum(special["[/datum/rpg_stat/magic]"])) ? special["[/datum/rpg_stat/magic]"] : 0

	// Apply Magic total (priority base + special bonus).
	var/desired_magic = clamp(round(base_magic_from_priority + magic_bonus), 0, 6)
	var/base_magic = target.stats.get_base_stat_value(/datum/rpg_stat/magic)
	var/magic_delta = desired_magic - base_magic
	if(magic_delta)
		target.stats.set_stat_modifier(magic_delta, /datum/rpg_stat/magic, SHADOWRUN_CHARGEN_SOURCE)
	else
		target.stats.remove_stat_modifier(/datum/rpg_stat/magic, SHADOWRUN_CHARGEN_SOURCE)

	// Apply Edge total (base Edge + special bonus).
	var/list/edge_meta = get_edge_meta()
	var/edge_base = edge_meta["base"]

	var/desired_edge = clamp(round(edge_base + edge_bonus), 0, 6)
	var/base_edge = target.stats.get_base_stat_value(/datum/rpg_stat/edge)
	var/edge_delta = desired_edge - base_edge
	if(edge_delta)
		target.stats.set_stat_modifier(edge_delta, /datum/rpg_stat/edge, SHADOWRUN_CHARGEN_SOURCE)
	else
		target.stats.remove_stat_modifier(/datum/rpg_stat/edge, SHADOWRUN_CHARGEN_SOURCE)

	// Apply augments (cyberware, prosthetics)
	var/list/augments = state["augments"]
	if(islist(augments) && length(augments))
		var/datum/species/S = target.dna?.species
		for(var/slot in augments)
			var/aug_path = text2path(augments[slot])
			var/datum/augment_item/A = GLOB.augment_items[aug_path]
			if(!A)
				continue
			if(!A.can_apply_to_species(S))
				continue
			A.apply_to_human(target, S)

	// Apply SR5 languages to the mob's language holder
	// Rating 3+ = understand, Rating 6 = speak fluently
	var/list/languages_state = state["languages"]
	var/native_language = state["native_language"]
	if(islist(languages_state) || native_language)
		apply_sr5_languages_to_mob(target, languages_state, native_language)

/datum/preference/blob/shadowrun_chargen/compile_constant_data()
	var/list/data = list()

	data["schema_version"] = SHADOWRUN_CHARGEN_SCHEMA_VERSION

	data["priority_letters"] = list("A", "B", "C", "D", "E")
	data["priority_categories"] = get_priority_categories()
	data["priority_display_names"] = get_priority_display_names()

	data["priority_tables"] = list(
		"attributes" = list("A" = 24, "B" = 20, "C" = 16, "D" = 14, "E" = 12),
		"skills" = list("A" = 46, "B" = 36, "C" = 28, "D" = 22, "E" = 18),
		"skill_groups" = list("A" = 10, "B" = 5, "C" = 2, "D" = 0, "E" = 0),
		"magic" = list("A" = 6, "B" = 4, "C" = 3, "D" = 2, "E" = 0),
		// SR5 Resources priority values (in Nuyen ¥)
		"resources" = list("A" = 450000, "B" = 275000, "C" = 140000, "D" = 50000, "E" = 6000),
		// SR5-style "special attribute" points (we currently spend these on Edge only).
		"metatype_special" = list("A" = 7, "B" = 4, "C" = 3, "D" = 1, "E" = 0)
	)

	// Metatype choices (implemented as roundstart-eligible species).
	// We expose all roundstart-eligible species and let UI filter based on Metatype priority.
	var/list/metatype_choices = list()
	var/list/metatype_attribute_bounds = list()

	var/datum/species/tmp_human = new /datum/species/human
	metatype_choices += list(list(
		"id" = "[/datum/species/human]",
		"name" = "Human",
		"min_priority" = "E"
	))
	metatype_attribute_bounds["[/datum/species/human]"] = get_metatype_attribute_bounds(/datum/species/human)
	qdel(tmp_human)

	var/datum/species/tmp_elf = new /datum/species/elf
	metatype_choices += list(list(
		"id" = "[/datum/species/elf]",
		"name" = "Elf",
		"min_priority" = "D"
	))
	metatype_attribute_bounds["[/datum/species/elf]"] = get_metatype_attribute_bounds(/datum/species/elf)
	qdel(tmp_elf)

	var/datum/species/tmp_dwarf = new /datum/species/dwarf
	metatype_choices += list(list(
		"id" = "[/datum/species/dwarf]",
		"name" = "Dwarf",
		"min_priority" = "C"
	))
	metatype_attribute_bounds["[/datum/species/dwarf]"] = get_metatype_attribute_bounds(/datum/species/dwarf)
	qdel(tmp_dwarf)

	var/datum/species/tmp_ork = new /datum/species/ork
	metatype_choices += list(list(
		"id" = "[/datum/species/ork]",
		"name" = "Ork",
		"min_priority" = "C"
	))
	metatype_attribute_bounds["[/datum/species/ork]"] = get_metatype_attribute_bounds(/datum/species/ork)
	qdel(tmp_ork)

	var/datum/species/tmp_troll = new /datum/species/troll
	metatype_choices += list(list(
		"id" = "[/datum/species/troll]",
		"name" = "Troll",
		"min_priority" = "B"
	))
	metatype_attribute_bounds["[/datum/species/troll]"] = get_metatype_attribute_bounds(/datum/species/troll)
	qdel(tmp_troll)

	data["metatype_choices"] = metatype_choices
	data["metatype_attribute_bounds"] = metatype_attribute_bounds

	data["awakening_choices"] = list(
		list("id" = "mundane", "name" = "Mundane"),
		list("id" = "mage", "name" = "Mage"),
		list("id" = "adept", "name" = "Adept"),
		list("id" = "mystic_adept", "name" = "Mystic Adept"),
		list("id" = "technomancer", "name" = "Technomancer"),
	)

	// Special attribute metadata (Edge + Magic).
	var/list/edge_meta = get_edge_meta()
	data["edge_base"] = edge_meta["base"]
	var/datum/rpg_stat/magic/tmp_magic = get_magic_meta_datum()
	data["special_attributes"] = list(
		list(
		"id" = "[/datum/rpg_stat/edge]",
		"name" = edge_meta["name"],
		"min" = edge_meta["min"],
		"max" = edge_meta["max"],
		),
		list(
		"id" = "[/datum/rpg_stat/magic]",
		"name" = tmp_magic.name,
		"min" = tmp_magic.min_value,
		"max" = tmp_magic.max_value,
		),
	)
	// Intentionally do not qdel the cached stat datums.

	// Core attributes metadata (base bounds; UI and sanitizers should apply metatype overrides).
	var/list/attr_list = list()
	for (var/stat_path in get_core_stat_paths())
		var/datum/rpg_stat/tmp = new stat_path
		attr_list += list(list(
			"id" = "[stat_path]",
			"name" = tmp.name,
			"sort" = tmp.ui_sort_order,
			"min" = 1,
			"max" = 6,
		))
		qdel(tmp)

	data["attributes"] = attr_list

	// Skills metadata (all rpg skills with parent stat types).
	var/list/skill_list = list()
	for (var/skill_path in subtypesof(/datum/rpg_skill))

		var/datum/rpg_skill/tmp_skill = new skill_path
		var/parent_stat_path = tmp_skill.parent_stat_type
		if (!ispath(parent_stat_path))
			qdel(tmp_skill)
			continue

		var/parent_stat_name = ""
		if (ispath(parent_stat_path, /datum/rpg_stat))
			var/datum/rpg_stat/tmp_stat = new parent_stat_path
			parent_stat_name = tmp_stat.name
			qdel(tmp_stat)

		skill_list += list(list(
			"id" = "[skill_path]",
			"name" = tmp_skill.name,
			"sort" = tmp_skill.ui_sort_order,
			"parent_stat_id" = "[parent_stat_path]",
			"parent_stat_name" = parent_stat_name,
		))
		qdel(tmp_skill)

	data["skills"] = skill_list

	// Skill groups metadata.
	var/list/group_list = list()
	var/list/group_defs = get_skill_group_definitions()
	for (var/group_id in group_defs)
		var/list/members = group_defs[group_id]
		if (!islist(members) || !length(members))
			continue

		var/list/member_keys = list()
		for (var/skill_path in members)
			if (ispath(skill_path, /datum/rpg_skill))
				member_keys += "[skill_path]"

		if (!length(member_keys))
			continue

		group_list += list(list(
			"id" = "[group_id]",
			"name" = get_skill_group_display_name(group_id),
			"skills" = member_keys,
		))

	data["skill_groups"] = group_list

	// Knowledge skills metadata.
	var/list/knowledge_list = list()
	for (var/ks_path in subtypesof(/datum/rpg_knowledge_skill))
		var/datum/rpg_knowledge_skill/tmp_ks = new ks_path
		knowledge_list += list(list(
			"id" = "[ks_path]",
			"name" = tmp_ks.name,
			"desc" = tmp_ks.desc,
			"category" = tmp_ks.category,
			"sort" = tmp_ks.ui_sort_order,
		))
		qdel(tmp_ks)
	data["knowledge_skills"] = knowledge_list

	// Language skills metadata.
	var/list/language_list = list()
	for (var/lang_path in subtypesof(/datum/rpg_language))
		var/datum/rpg_language/tmp_lang = new lang_path
		language_list += list(list(
			"id" = "[lang_path]",
			"name" = tmp_lang.name,
			"desc" = tmp_lang.desc,
			"family" = tmp_lang.family,
			"sort" = tmp_lang.ui_sort_order,
		))
		qdel(tmp_lang)
	data["languages"] = language_list

	// Spells metadata (for mages).
	var/list/spell_list = list()
	for (var/spell_path in subtypesof(/datum/sr_spell))
		var/datum/sr_spell/tmp_spell = new spell_path
		spell_list += list(list(
			"id" = "[spell_path]",
			"name" = tmp_spell.name,
			"desc" = tmp_spell.desc,
			"category" = tmp_spell.category,
			"type_tag" = tmp_spell.type_tag,
			"drain" = tmp_spell.drain,
			"range" = tmp_spell.range,
			"duration" = tmp_spell.duration,
			"is_physical" = tmp_spell.is_physical,
			"sort" = tmp_spell.ui_sort_order,
		))
		qdel(tmp_spell)
	data["spells"] = spell_list

	// Adept powers metadata (for adepts).
	var/list/power_list = list()
	for (var/power_path in subtypesof(/datum/sr_adept_power))
		var/datum/sr_adept_power/tmp_power = new power_path
		power_list += list(list(
			"id" = "[power_path]",
			"name" = tmp_power.name,
			"desc" = tmp_power.desc,
			"pp_cost" = tmp_power.pp_cost,
			"has_levels" = tmp_power.has_levels,
			"max_levels" = tmp_power.max_levels,
			"category" = tmp_power.category,
			"sort" = tmp_power.ui_sort_order,
		))
		qdel(tmp_power)
	data["adept_powers"] = power_list

	// Magical traditions metadata.
	var/list/tradition_list = list()
	for (var/trad_path in subtypesof(/datum/sr_tradition))
		var/datum/sr_tradition/tmp_trad = new trad_path
		tradition_list += list(list(
			"id" = "[trad_path]",
			"name" = tmp_trad.name,
			"desc" = tmp_trad.desc,
			"drain_attribute" = tmp_trad.drain_attribute,
			"philosophy" = tmp_trad.philosophy,
			"spirits" = tmp_trad.spirits,
			"sort" = tmp_trad.ui_sort_order,
		))
		qdel(tmp_trad)
	data["traditions"] = tradition_list

	// Complex forms metadata (for technomancers).
	var/list/cf_list = list()
	for (var/cf_path in subtypesof(/datum/sr_complex_form))
		var/datum/sr_complex_form/tmp_cf = new cf_path
		cf_list += list(list(
			"id" = "[cf_path]",
			"name" = tmp_cf.name,
			"desc" = tmp_cf.desc,
			"target" = tmp_cf.target,
			"duration" = tmp_cf.duration,
			"fading" = tmp_cf.fading,
			"category" = tmp_cf.category,
			"sort" = tmp_cf.ui_sort_order,
		))
		qdel(tmp_cf)
	data["complex_forms"] = cf_list

	// Sprite types metadata (for technomancers).
	var/list/sprite_list = list()
	for (var/sprite_path in subtypesof(/datum/sr_sprite))
		var/datum/sr_sprite/tmp_sprite = new sprite_path
		sprite_list += list(list(
			"id" = "[sprite_path]",
			"name" = tmp_sprite.name,
			"desc" = tmp_sprite.desc,
			"specialty" = tmp_sprite.specialty,
			"powers" = tmp_sprite.powers,
			"sort" = tmp_sprite.ui_sort_order,
		))
		qdel(tmp_sprite)
	data["sprites"] = sprite_list

	// Contact types metadata.
	var/list/contact_list = list()
	for (var/contact_path in subtypesof(/datum/sr_contact))
		var/datum/sr_contact/tmp_contact = new contact_path
		contact_list += list(list(
			"id" = "[contact_path]",
			"name" = tmp_contact.name,
			"desc" = tmp_contact.desc,
			"profession" = tmp_contact.profession,
			"specialty" = tmp_contact.specialty,
			"archetype" = tmp_contact.archetype,
			"sort" = tmp_contact.ui_sort_order,
		))
		qdel(tmp_contact)
	data["contact_types"] = contact_list

	// Augments metadata (cyberware, bioware, prosthetics).
	var/list/augment_categories = list()
	augment_categories["bodyparts"] = list(
		"name" = "Cyberlimbs",
		"icon" = "hand",
		"description" = "Replacement limbs with enhanced capabilities. Each cyberlimb costs 1.0 Essence."
	)
	augment_categories["organs"] = list(
		"name" = "Cyberware",
		"icon" = "microchip",
		"description" = "Cybernetic organ replacements that enhance body functions."
	)
	augment_categories["bioware"] = list(
		"name" = "Bioware",
		"icon" = "dna",
		"description" = "Biological enhancements grown from organic materials. Lower Essence cost than cyberware."
	)
	data["augment_categories"] = augment_categories

	// Build augment items list keyed by type path
	var/list/augments = list()
	var/list/augments_by_category = list(
		"bodyparts" = list(),
		"organs" = list(),
		"bioware" = list()
	)

	for (var/aug_path in GLOB.augment_items)
		var/datum/augment_item/A = GLOB.augment_items[aug_path]
		if (!A || !A.path)
			continue

		var/essence_cost = 0
		var/nuyen_cost = 0
		var/category_key = null

		// Determine category and get essence/nuyen costs
		if (A.category == AUGMENT_CATEGORY_BODYPARTS)
			category_key = "bodyparts"
			// Get costs from the bodypart path
			var/obj/item/bodypart/BP = A.path
			essence_cost = initial(BP.essence_base_cost)
			nuyen_cost = initial(BP.nuyen_base_cost)
		else if (A.category == AUGMENT_CATEGORY_ORGANS)
			category_key = "organs"
			// Get costs from the organ path
			var/obj/item/organ/O = A.path
			essence_cost = initial(O.essence_base_cost)
			nuyen_cost = initial(O.nuyen_base_cost)
		else if (A.category == AUGMENT_CATEGORY_BIOWARE)
			category_key = "bioware"
			// Get costs from the bioware organ path
			var/obj/item/organ/O = A.path
			essence_cost = initial(O.essence_base_cost)
			nuyen_cost = initial(O.nuyen_base_cost)
		else
			continue // Skip implants and other categories for now

		var/aug_id = "[aug_path]"
		var/list/aug_data = list(
			"id" = aug_id,
			"name" = A.name,
			"description" = A.description || "No description available.",
			"slot" = A.slot,
			"category" = category_key,
			"essence_cost" = essence_cost,
			"nuyen_cost" = nuyen_cost,
			"path" = "[A.path]"
		)

		augments[aug_id] = aug_data
		augments_by_category[category_key] += list(aug_data)

	data["augments"] = augments
	data["augments_by_category"] = augments_by_category

	return data

/datum/preference/blob/shadowrun_chargen/proc/get_priority_categories()
	return list("metatype", "attributes", "magic", "skills", "resources")

/datum/preference/blob/shadowrun_chargen/proc/get_priority_display_names()
	return list(
		"metatype" = "Metatype",
		"attributes" = "Attributes",
		"magic" = "Magic/Resonance",
		"skills" = "Skills",
		"resources" = "Resources",
	)

/datum/preference/blob/shadowrun_chargen/proc/get_default_priorities()
	// Must be a valid A-E permutation.
	return list(
		"metatype" = "E",
		"attributes" = "A",
		"magic" = "D",
		"skills" = "B",
		"resources" = "C",
	)

/datum/preference/blob/shadowrun_chargen/proc/get_core_stat_paths()
	return list(
		/datum/rpg_stat/body,
		/datum/rpg_stat/agility,
		/datum/rpg_stat/reaction,
		/datum/rpg_stat/strength,
		/datum/rpg_stat/willpower,
		/datum/rpg_stat/logic,
		/datum/rpg_stat/intuition,
		/datum/rpg_stat/charisma,
	)

/datum/preference/blob/shadowrun_chargen/proc/sanitize_state(list/input)
	if (!islist(input))
		input = list()

	var/list/output = list()

	output["schema_version"] = isnum(input["schema_version"]) ? input["schema_version"] : 0
	output["saved"] = !!input["saved"]

	var/list/priorities = islist(input["priorities"]) ? input["priorities"] : list()
	priorities = sanitize_priorities(priorities)
	output["priorities"] = priorities

	output["awakening"] = sanitize_awakening(input["awakening"], priorities)
	output["metatype_species"] = sanitize_metatype_species(input["metatype_species"], priorities)

	var/list/attributes_in = islist(input["attributes"]) ? input["attributes"] : list()
	var/list/special_in = islist(input["special"]) ? input["special"] : list()
	var/list/skills_in = islist(input["skills"]) ? input["skills"] : list()
	var/list/skill_groups_in = islist(input["skill_groups"]) ? input["skill_groups"] : list()

	output["attributes"] = sanitize_attributes(attributes_in, priorities, output["metatype_species"])
	output["special"] = sanitize_special(special_in, priorities, output["awakening"], output["schema_version"])
	output["skills"] = sanitize_skills(skills_in, priorities)
	output["skill_groups"] = sanitize_skill_groups(skill_groups_in, priorities)

	// Magic system fields
	output["tradition"] = sanitize_tradition(input["tradition"], output["awakening"])
	output["selected_spells"] = sanitize_selected_spells(input["selected_spells"], priorities, output["awakening"])
	output["selected_powers"] = sanitize_selected_powers(input["selected_powers"], priorities, output["awakening"])
	output["selected_complex_forms"] = sanitize_selected_complex_forms(input["selected_complex_forms"], priorities, output["awakening"])

	// Knowledge system fields
	output["native_language"] = sanitize_native_language(input["native_language"])
	output["knowledge_skills"] = sanitize_knowledge_skills(input["knowledge_skills"], output["attributes"])
	output["languages"] = sanitize_languages(input["languages"], output["attributes"], output["native_language"])

	// Contacts system
	output["contacts"] = sanitize_contacts(input["contacts"], output["attributes"])

	// Augments system
	output["augments"] = sanitize_augments(input["augments"], output["metatype_species"])

	return output

/datum/preference/blob/shadowrun_chargen/proc/is_full_reset_state(list/state)
	if (!islist(state))
		return FALSE
	if (!!state["saved"])
		return FALSE
	if (state["awakening"] != "mundane")
		return FALSE
	if (state["metatype_species"] != /datum/species/human)
		return FALSE
	var/list/attrs = state["attributes"]
	var/list/skills = state["skills"]
	var/list/groups = state["skill_groups"]
	var/list/special = state["special"]
	if (islist(attrs) && length(attrs))
		return FALSE
	if (islist(skills) && length(skills))
		return FALSE
	if (islist(groups) && length(groups))
		return FALSE
	if (islist(special) && length(special))
		return FALSE
	// Magic system fields
	if (istext(state["tradition"]) && length(state["tradition"]))
		return FALSE
	var/list/spells = state["selected_spells"]
	var/list/powers = state["selected_powers"]
	var/list/forms = state["selected_complex_forms"]
	if (islist(spells) && length(spells))
		return FALSE
	if (islist(powers) && length(powers))
		return FALSE
	if (islist(forms) && length(forms))
		return FALSE
	// Knowledge system fields
	if (istext(state["native_language"]) && length(state["native_language"]))
		return FALSE
	var/list/knowledge = state["knowledge_skills"]
	var/list/languages = state["languages"]
	if (islist(knowledge) && length(knowledge))
		return FALSE
	if (islist(languages) && length(languages))
		return FALSE
	// Contacts
	var/list/contacts = state["contacts"]
	if (islist(contacts) && length(contacts))
		return FALSE
	return TRUE

/datum/preference/blob/shadowrun_chargen/proc/sanitize_metatype_species(raw_value, list/priorities)
	var/species_path = null
	if (ispath(raw_value, /datum/species))
		species_path = raw_value
	else if (istext(raw_value))
		species_path = text2path(raw_value)

	if (!ispath(species_path, /datum/species))
		species_path = /datum/species/human

	// SR5 Metatypes: Human, Elf, Dwarf, Ork, Troll
	var/list/allowed_metatypes = list(
		/datum/species/human,
		/datum/species/elf,
		/datum/species/dwarf,
		/datum/species/ork,
		/datum/species/troll
	)
	if (!(species_path in allowed_metatypes))
		species_path = /datum/species/human

	var/metatype_letter = priorities["metatype"]
	var/min_priority = get_metatype_min_priority(species_path)
	if (!priority_allows(metatype_letter, min_priority))
		species_path = /datum/species/human

	return species_path

/datum/preference/blob/shadowrun_chargen/proc/priority_rank(letter)
	switch(letter)
		if ("A") return METATYPE_PRIORITY_A
		if ("B") return METATYPE_PRIORITY_B
		if ("C") return METATYPE_PRIORITY_C
		if ("D") return METATYPE_PRIORITY_D
		if ("E") return METATYPE_PRIORITY_E
	return METATYPE_PRIORITY_E

/datum/preference/blob/shadowrun_chargen/proc/priority_allows(given_letter, required_letter)
	return priority_rank(given_letter) >= priority_rank(required_letter)

/datum/preference/blob/shadowrun_chargen/proc/get_metatype_min_priority(species_type)
	// Maps the game's available species onto SR5-ish Metatype priority tiers.
	// This is intentionally conservative and can be tuned.
	if (!ispath(species_type, /datum/species))
		return "E"

	// SR5 Core Metatypes
	switch(species_type)
		if (/datum/species/human)
			return "E"  // Human: Priority E minimum
		if (/datum/species/elf)
			return "D"  // Elf: Priority D minimum
		if (/datum/species/dwarf)
			return "C"  // Dwarf: Priority C minimum
		if (/datum/species/ork)
			return "C"  // Ork: Priority C minimum
		if (/datum/species/troll)
			return "B"  // Troll: Priority B minimum

	// Legacy species mappings for backward compatibility
	switch(species_type)
		if (/datum/species/lizard, /datum/species/moth, /datum/species/fly, /datum/species/pod, /datum/species/jelly, /datum/species/teshari)
			return "D"
		if (/datum/species/vox)
			return "C"
		if (/datum/species/android, /datum/species/ipc)
			return "C"
		if (/datum/species/abductor, /datum/species/shadow)
			return "A"

	// Default for any other roundstart-eligible species.
	return "D"

/datum/preference/blob/shadowrun_chargen/proc/get_metatype_attribute_bounds(species_type)
	// Returns a mapping of stat_id string -> list(min,max).
	// Human defaults to 1/6 for all core stats.
	// SR5 Metatype Attribute Limits from Core Rulebook
	var/list/bounds = list()
	for (var/stat_path in get_core_stat_paths())
		bounds["[stat_path]"] = list(1, 6)

	switch(species_type)
		if (/datum/species/elf)
			// SR5 Elf: AGI 2/7, CHA 3/8, others 1/6
			bounds["[/datum/rpg_stat/agility]"] = list(2, 7)
			bounds["[/datum/rpg_stat/charisma]"] = list(3, 8)

		if (/datum/species/dwarf)
			// SR5 Dwarf: BOD 1/7, REA 1/5, STR 1/8, WIL 2/7
			bounds["[/datum/rpg_stat/body]"] = list(1, 7)
			bounds["[/datum/rpg_stat/reaction]"] = list(1, 5)
			bounds["[/datum/rpg_stat/strength]"] = list(1, 8)
			bounds["[/datum/rpg_stat/willpower]"] = list(2, 7)

		if (/datum/species/ork)
			// SR5 Ork: BOD 4/9, STR 3/8, LOG 1/5, CHA 1/5
			bounds["[/datum/rpg_stat/body]"] = list(4, 9)
			bounds["[/datum/rpg_stat/strength]"] = list(3, 8)
			bounds["[/datum/rpg_stat/logic]"] = list(1, 5)
			bounds["[/datum/rpg_stat/charisma]"] = list(1, 5)

		if (/datum/species/troll)
			// SR5 Troll: BOD 5/10, AGI 1/5, STR 5/10, LOG 1/5, INT 1/5, CHA 1/4
			bounds["[/datum/rpg_stat/body]"] = list(5, 10)
			bounds["[/datum/rpg_stat/agility]"] = list(1, 5)
			bounds["[/datum/rpg_stat/strength]"] = list(5, 10)
			bounds["[/datum/rpg_stat/logic]"] = list(1, 5)
			bounds["[/datum/rpg_stat/intuition]"] = list(1, 5)
			bounds["[/datum/rpg_stat/charisma]"] = list(1, 4)

	return bounds

/datum/preference/blob/shadowrun_chargen/proc/sanitize_awakening(raw_value, list/priorities)
	var/magic_letter = priorities["magic"]
	if (magic_letter == "E")
		return "mundane"

	if (!istext(raw_value))
		// Default to awakened if they didn't pick and they have magic.
		return (get_magic_rating(magic_letter) > 0) ? "mage" : "mundane"

	switch(raw_value)
		if ("mundane", "mage", "adept")
			return raw_value

	return "mundane"

/datum/preference/blob/shadowrun_chargen/proc/normalize_path_key(key, base_type)
	if (ispath(key, base_type))
		return "[key]"
	if (istext(key))
		var/path = text2path(key)
		if (ispath(path, base_type))
			return "[path]"
	return null

/datum/preference/blob/shadowrun_chargen/proc/sanitize_priorities(list/in_priorities)
	var/list/defaults = get_default_priorities()

	var/list/categories = get_priority_categories()
	var/list/letters = list("A", "B", "C", "D", "E")
	var/list/used = list()

	var/list/out = list()

	for (var/category as anything in categories)
		var/letter = in_priorities[category]
		if (!istext(letter) || !(letter in letters) || (letter in used))
			letter = defaults[category]
			if (!istext(letter) || !(letter in letters) || (letter in used))
				// Fallback to first unused letter.
				for (var/candidate in letters)
					if (!(candidate in used))
						letter = candidate
						break

		out[category] = letter
		used += letter

	return out

/datum/preference/blob/shadowrun_chargen/proc/get_attribute_points(letter)
	switch(letter)
		if("A") return 24
		if("B") return 20
		if("C") return 16
		if("D") return 14
		if("E") return 12
	return 12

/datum/preference/blob/shadowrun_chargen/proc/get_skill_points(letter)
	switch(letter)
		if("A") return 46
		if("B") return 36
		if("C") return 28
		if("D") return 22
		if("E") return 18
	return 18

/datum/preference/blob/shadowrun_chargen/proc/get_skill_group_points(letter)
	switch(letter)
		if("A") return 10
		if("B") return 5
		if("C") return 2
		if("D") return 0
		if("E") return 0
	return 0

/datum/preference/blob/shadowrun_chargen/proc/get_magic_rating(letter)
	switch(letter)
		if("A") return 6
		if("B") return 4
		if("C") return 3
		if("D") return 2
		if("E") return 0
	return 0

/datum/preference/blob/shadowrun_chargen/proc/get_resources_amount(letter)
	switch(letter)
		if("A") return 2000
		if("B") return 1500
		if("C") return 1000
		if("D") return 500
		if("E") return 200
	return 200

/datum/preference/blob/shadowrun_chargen/proc/get_metatype_special_points(letter)
	switch(letter)
		if("A") return 7
		if("B") return 4
		if("C") return 3
		if("D") return 1
		if("E") return 0
	return 0

/datum/preference/blob/shadowrun_chargen/proc/sanitize_attributes(list/in_attributes, list/priorities, metatype_species)
	var/allowed = get_attribute_points(priorities["attributes"])

	var/species_type = /datum/species/human
	if (ispath(metatype_species, /datum/species))
		species_type = metatype_species
	else if (istext(metatype_species))
		var/tmp = text2path(metatype_species)
		if (ispath(tmp, /datum/species))
			species_type = tmp

	var/list/bounds = get_metatype_attribute_bounds(species_type)

	var/list/out = list()
	var/total_spent = 0

	for (var/stat_path in get_core_stat_paths())
		var/key = "[stat_path]"

		var/list/range = bounds[key]
		var/min_value = islist(range) ? range[1] : 1
		var/max_value = islist(range) ? range[2] : 6

		var/raw_value
		// Allow input keys as either stringified typepaths or actual typepaths.
		if (key in in_attributes)
			raw_value = in_attributes[key]
		else
			raw_value = in_attributes[stat_path]

		var/desired = 1
		if (isnum(raw_value))
			desired = raw_value

		desired = clamp(round(desired), min_value, max_value)
		out[key] = desired
		total_spent += (desired - min_value)

	// If overspent, reduce highest attributes first.
	while (total_spent > allowed)
		var/highest_key = null
		var/highest_value = 0

		for (var/stat_key in out)
			var/value = out[stat_key]
			var/list/range = bounds[stat_key]
			var/min_value = islist(range) ? range[1] : 1
			if (value <= min_value)
				continue
			if (value > highest_value)
				highest_value = value
				highest_key = stat_key

		if (isnull(highest_key))
			break

		var/list/highest_range = bounds[highest_key]
		var/highest_min = islist(highest_range) ? highest_range[1] : 1
		var/new_value = max(highest_min, highest_value - 1)
		if (new_value >= highest_value)
			break
		out[highest_key] = new_value
		total_spent--

	return out

/datum/preference/blob/shadowrun_chargen/proc/sanitize_skills(list/in_skills, list/priorities)
	var/allowed = get_skill_points(priorities["skills"])

	var/list/out = list()
	var/total_spent = 0

	for (var/in_key in in_skills)
		var/normalized_key = normalize_path_key(in_key, /datum/rpg_skill)
		if (isnull(normalized_key))
			continue

		var/raw_value = in_skills[in_key]
		if (!isnum(raw_value))
			continue

		var/desired = clamp(round(raw_value), 0, 6)
		if (desired <= 0)
			continue

		out[normalized_key] = desired
		total_spent += desired

	// If overspent, reduce highest skills first.
	while (total_spent > allowed)
		var/highest_key = null
		var/highest_value = 0

		for (var/skill_key in out)
			var/value = out[skill_key]
			if (value > highest_value)
				highest_value = value
				highest_key = skill_key

		if (isnull(highest_key))
			break

		var/new_value = highest_value - 1
		if (new_value <= 0)
			out -= highest_key
		else
			out[highest_key] = new_value

		total_spent--

	return out

/datum/preference/blob/shadowrun_chargen/proc/sanitize_skill_groups(list/in_groups, list/priorities)
	var/allowed = get_skill_group_points(priorities["skills"])
	var/list/defs = get_skill_group_definitions()

	var/list/out = list()
	var/total_spent = 0

	for (var/in_key in in_groups)
		if (!istext(in_key) || !(in_key in defs))
			continue
		var/raw_value = in_groups[in_key]
		if (!isnum(raw_value))
			continue
		var/desired = clamp(round(raw_value), 0, 6)
		if (desired <= 0)
			continue
		out[in_key] = desired
		total_spent += desired

	while (total_spent > allowed)
		var/highest_key = null
		var/highest_value = 0
		for (var/group_id in out)
			var/value = out[group_id]
			if (value > highest_value)
				highest_value = value
				highest_key = group_id
		if (isnull(highest_key))
			break
		var/new_value = highest_value - 1
		if (new_value <= 0)
			out -= highest_key
		else
			out[highest_key] = new_value
		total_spent--

	return out

/datum/preference/blob/shadowrun_chargen/proc/get_skill_group_definitions()
	// A small but useful subset of SR5 skill groups. We keep this intentionally
	// conservative to avoid incorrect mappings.
	return list(
		"acting" = list(
			/datum/rpg_skill/con,
			/datum/rpg_skill/impersonation,
			/datum/rpg_skill/theatre,
		),
		"athletics" = list(
			/datum/rpg_skill/gymnastics,
			/datum/rpg_skill/swimming,
			/datum/rpg_skill/electric_body,
		),
		"cracking" = list(
			/datum/rpg_skill/cybercombat,
			/datum/rpg_skill/electronic_warfare,
			/datum/rpg_skill/hacking,
		),
		"close_combat" = list(
			/datum/rpg_skill/blades,
			/datum/rpg_skill/clubs,
			/datum/rpg_skill/bloodsport,
		),
		"electronics" = list(
			/datum/rpg_skill/computer,
			/datum/rpg_skill/hardware,
			/datum/rpg_skill/software,
		),
		"engineering" = list(
			/datum/rpg_skill/aeronautics_mechanic,
			/datum/rpg_skill/automotive_mechanic,
			/datum/rpg_skill/industrial_mechanic,
			/datum/rpg_skill/nautical_mechanic,
		),
		"firearms" = list(
			/datum/rpg_skill/pistols,
			/datum/rpg_skill/automatics,
			/datum/rpg_skill/longarms,
		),
		"influence" = list(
			/datum/rpg_skill/con,
			/datum/rpg_skill/etiquette,
			/datum/rpg_skill/leadership,
			/datum/rpg_skill/negotiation,
		),
		"biotech" = list(
			/datum/rpg_skill/anatomy,
			/datum/rpg_skill/medicine,
			/datum/rpg_skill/forensics,
		),
		"outdoors" = list(
			/datum/rpg_skill/navigation,
			/datum/rpg_skill/tracking,
			/datum/rpg_skill/knuckle_down,
		),
		"stealth" = list(
			/datum/rpg_skill/sneaking,
			/datum/rpg_skill/disguise,
			/datum/rpg_skill/fine_motor,
		),
	)

/datum/preference/blob/shadowrun_chargen/proc/get_skill_group_display_name(group_id)
	if (!istext(group_id))
		return "Skill Group"
	switch(group_id)
		if ("acting") return "Acting"
		if ("athletics") return "Athletics"
		if ("cracking") return "Cracking"
		if ("close_combat") return "Close Combat"
		if ("electronics") return "Electronics"
		if ("engineering") return "Engineering"
		if ("firearms") return "Firearms"
		if ("influence") return "Influence"
		if ("biotech") return "Biotech"
		if ("outdoors") return "Outdoors"
		if ("stealth") return "Stealth"
	return "Skill Group"

/datum/preference/blob/shadowrun_chargen/proc/get_skill_group_members(group_id)
	if (!istext(group_id))
		return null
	var/list/defs = get_skill_group_definitions()
	return defs[group_id]

/datum/preference/blob/shadowrun_chargen/proc/sanitize_special(list/in_special, list/priorities, awakening, schema_version)
	var/list/out = list()

	var/allowed = get_metatype_special_points(priorities["metatype"])

	var/magic_letter = priorities["magic"]
	var/is_awakened = (awakening != "mundane") && (magic_letter != "E")
	var/base_magic_from_priority = is_awakened ? get_magic_rating(magic_letter) : 0

	var/list/edge_meta = get_edge_meta()
	var/base_edge = edge_meta["base"]
	var/edge_max = edge_meta["max"]

	var/datum/rpg_stat/magic/tmp_magic = get_magic_meta_datum()
	var/magic_max = tmp_magic.max_value

	var/edge_key = "[/datum/rpg_stat/edge]"
	var/magic_key = "[/datum/rpg_stat/magic]"

	// Stored as bonuses in schema v2+ (but v1 stored absolute Edge total).
	var/edge_bonus = 0
	var/magic_bonus = 0

	var/raw_edge
	if (edge_key in in_special)
		raw_edge = in_special[edge_key]
	else
		raw_edge = in_special[/datum/rpg_stat/edge]

	if (isnum(raw_edge))
		if (schema_version < SHADOWRUN_CHARGEN_SCHEMA_VERSION)
			edge_bonus = round(raw_edge) - base_edge
		else
			edge_bonus = round(raw_edge)

	var/raw_magic
	if (magic_key in in_special)
		raw_magic = in_special[magic_key]
	else
		raw_magic = in_special[/datum/rpg_stat/magic]

	if (isnum(raw_magic))
		magic_bonus = round(raw_magic)

	// Clamp to per-stat caps based on base values.
	edge_bonus = clamp(edge_bonus, 0, max(0, edge_max - base_edge))
	if (!is_awakened)
		magic_bonus = 0
	else
		magic_bonus = clamp(magic_bonus, 0, max(0, magic_max - base_magic_from_priority))

	// Enforce pool budget.
	while ((edge_bonus + magic_bonus) > allowed)
		if (magic_bonus > edge_bonus && magic_bonus > 0)
			magic_bonus--
		else if (edge_bonus > 0)
			edge_bonus--
		else
			break

	out[edge_key] = edge_bonus
	out[magic_key] = magic_bonus

	return out

/datum/preference/blob/shadowrun_chargen/proc/get_edge_meta()
	// Avoid qdel() on temporary stat datums during preferences/UI compilation.
	// qdel() can cascade into signal cleanup and blow loop_checks under some conditions.
	var/static/datum/rpg_stat/edge/cached_edge
	if (isnull(cached_edge))
		cached_edge = new
	return list(
		"base" = cached_edge.value,
		"min" = cached_edge.min_value,
		"max" = cached_edge.max_value,
		"name" = cached_edge.name,
	)

/datum/preference/blob/shadowrun_chargen/proc/get_magic_meta_datum()
	var/static/datum/rpg_stat/magic/cached_magic
	if (isnull(cached_magic))
		cached_magic = new
	return cached_magic

// =============================================================================
// MAGIC SYSTEM SANITIZERS
// =============================================================================

/datum/preference/blob/shadowrun_chargen/proc/sanitize_tradition(raw_tradition, awakening)
	// Mundanes and technomancers don't have magical traditions
	if (awakening == "mundane" || awakening == "technomancer")
		return ""

	if (!istext(raw_tradition))
		return ""

	// Validate against known traditions
	for (var/trad_path in subtypesof(/datum/sr_tradition))
		if ("[trad_path]" == raw_tradition)
			return raw_tradition

	return ""

/datum/preference/blob/shadowrun_chargen/proc/sanitize_selected_spells(list/in_spells, list/priorities, awakening)
	// Only mages and mystic adepts can learn spells
	if (awakening != "mage" && awakening != "mystic_adept")
		return list()

	if (!islist(in_spells))
		return list()

	var/magic_letter = priorities["magic"]
	var/magic_rating = get_magic_rating(magic_letter)
	var/max_spells = magic_rating * 2

	var/list/out = list()
	var/list/valid_spell_paths = list()

	for (var/spell_path in subtypesof(/datum/sr_spell))
		valid_spell_paths += "[spell_path]"

	for (var/spell_id in in_spells)
		if (!istext(spell_id))
			continue
		if (!(spell_id in valid_spell_paths))
			continue
		if (spell_id in out)
			continue // No duplicates
		if (length(out) >= max_spells)
			break
		out += spell_id

	return out

/datum/preference/blob/shadowrun_chargen/proc/sanitize_selected_powers(list/in_powers, list/priorities, awakening)
	// Only adepts and mystic adepts can use adept powers
	if (awakening != "adept" && awakening != "mystic_adept")
		return list()

	if (!islist(in_powers))
		return list()

	var/magic_letter = priorities["magic"]
	var/max_pp = get_magic_rating(magic_letter)

	var/list/out = list()
	var/total_pp = 0

	// Build lookup for valid powers
	var/list/power_data = list()
	for (var/power_path in subtypesof(/datum/sr_adept_power))
		var/datum/sr_adept_power/tmp = new power_path
		power_data["[power_path]"] = list(
			"pp_cost" = tmp.pp_cost,
			"has_levels" = tmp.has_levels,
			"max_levels" = tmp.max_levels
		)
		qdel(tmp)

	for (var/power_id in in_powers)
		if (!istext(power_id))
			continue
		if (!(power_id in power_data))
			continue

		var/list/pdata = power_data[power_id]
		var/raw_level = in_powers[power_id]
		if (!isnum(raw_level))
			continue

		var/max_lvl = pdata["has_levels"] ? pdata["max_levels"] : 1
		var/level = clamp(round(raw_level), 1, max_lvl)
		var/cost = pdata["pp_cost"] * level

		if (total_pp + cost > max_pp)
			continue

		out[power_id] = level
		total_pp += cost

	return out

/datum/preference/blob/shadowrun_chargen/proc/sanitize_selected_complex_forms(list/in_forms, list/priorities, awakening)
	// Only technomancers can learn complex forms
	if (awakening != "technomancer")
		return list()

	if (!islist(in_forms))
		return list()

	var/magic_letter = priorities["magic"]
	var/resonance = get_magic_rating(magic_letter)
	var/max_forms = resonance * 2

	var/list/out = list()
	var/list/valid_form_paths = list()

	for (var/form_path in subtypesof(/datum/sr_complex_form))
		valid_form_paths += "[form_path]"

	for (var/form_id in in_forms)
		if (!istext(form_id))
			continue
		if (!(form_id in valid_form_paths))
			continue
		if (form_id in out)
			continue
		if (length(out) >= max_forms)
			break
		out += form_id

	return out

// =============================================================================
// KNOWLEDGE SYSTEM SANITIZERS
// =============================================================================

/datum/preference/blob/shadowrun_chargen/proc/sanitize_native_language(raw_lang)
	if (!istext(raw_lang))
		return ""

	for (var/lang_path in subtypesof(/datum/rpg_language))
		if ("[lang_path]" == raw_lang)
			return raw_lang

	return ""

/datum/preference/blob/shadowrun_chargen/proc/get_free_knowledge_points(list/attributes)
	// Free knowledge skill points = (INT + LOG) × 2
	var/int_key = "[/datum/rpg_stat/intuition]"
	var/log_key = "[/datum/rpg_stat/logic]"

	var/intuition = 1
	var/logic = 1

	if (islist(attributes))
		if (int_key in attributes)
			intuition = isnum(attributes[int_key]) ? attributes[int_key] : 1
		if (log_key in attributes)
			logic = isnum(attributes[log_key]) ? attributes[log_key] : 1

	return (intuition + logic) * 2

/datum/preference/blob/shadowrun_chargen/proc/sanitize_knowledge_skills(list/in_knowledge, list/attributes)
	if (!islist(in_knowledge))
		return list()

	var/max_points = get_free_knowledge_points(attributes)

	var/list/out = list()
	var/total_spent = 0

	var/list/valid_skill_paths = list()
	for (var/skill_path in subtypesof(/datum/rpg_knowledge_skill))
		valid_skill_paths += "[skill_path]"

	for (var/skill_id in in_knowledge)
		if (!istext(skill_id))
			continue
		if (!(skill_id in valid_skill_paths))
			continue

		var/raw_value = in_knowledge[skill_id]
		if (!isnum(raw_value))
			continue

		var/desired = clamp(round(raw_value), 0, 6)
		if (desired <= 0)
			continue

		if (total_spent + desired > max_points)
			desired = max_points - total_spent
			if (desired <= 0)
				break

		out[skill_id] = desired
		total_spent += desired

	return out

/datum/preference/blob/shadowrun_chargen/proc/sanitize_languages(list/in_languages, list/attributes, native_language)
	if (!islist(in_languages))
		return list()

	// Languages share the knowledge skill point pool
	var/max_points = get_free_knowledge_points(attributes)

	// Calculate points already spent on knowledge skills
	// (This is called after knowledge skills are sanitized, so we need to
	// pass in the already-sanitized knowledge skills to properly track the shared pool)
	// For now, languages get their own allocation - this is a simplification

	var/list/out = list()
	var/total_spent = 0

	var/list/valid_lang_paths = list()
	for (var/lang_path in subtypesof(/datum/rpg_language))
		valid_lang_paths += "[lang_path]"

	for (var/lang_id in in_languages)
		if (!istext(lang_id))
			continue
		if (!(lang_id in valid_lang_paths))
			continue
		// Native language doesn't need rating - it's automatically N
		if (lang_id == native_language)
			continue

		var/raw_value = in_languages[lang_id]
		if (!isnum(raw_value))
			continue

		var/desired = clamp(round(raw_value), 0, 6)
		if (desired <= 0)
			continue

		if (total_spent + desired > max_points)
			desired = max_points - total_spent
			if (desired <= 0)
				break

		out[lang_id] = desired
		total_spent += desired

	return out

// =============================================================================
// CONTACTS SYSTEM SANITIZER
// =============================================================================

/datum/preference/blob/shadowrun_chargen/proc/get_contact_points(list/attributes)
	// Contact points = CHA × 3
	var/cha_key = "[/datum/rpg_stat/charisma]"
	var/charisma = 1
	if (islist(attributes) && (cha_key in attributes))
		charisma = isnum(attributes[cha_key]) ? attributes[cha_key] : 1
	return charisma * 3

/// Sanitize augments, ensuring valid augment paths and essence budget.
/datum/preference/blob/shadowrun_chargen/proc/sanitize_augments(list/in_augments, metatype_species)
	if (!islist(in_augments))
		return list()

	var/datum/species/S = metatype_species
	if (ispath(S))
		S = new S()

	var/list/out = list()
	var/essence_spent = 0
	var/essence_max = 6.0 // Base essence

	for (var/slot in in_augments)
		var/aug_path = in_augments[slot]
		if (!istext(aug_path))
			continue

		// Find the augment item
		var/datum/augment_item/A = GLOB.augment_items[text2path(aug_path)]
		if (!A)
			continue

		// Check species compatibility
		if (!A.can_apply_to_species(S))
			continue

		// Get essence cost
		var/essence_cost = 0
		if (A.category == AUGMENT_CATEGORY_BODYPARTS)
			var/obj/item/bodypart/BP = A.path
			essence_cost = initial(BP.essence_base_cost)
		else if (A.category == AUGMENT_CATEGORY_ORGANS)
			var/obj/item/organ/O = A.path
			essence_cost = initial(O.essence_base_cost)

		// Check essence budget
		if (essence_spent + essence_cost > essence_max)
			continue

		out[slot] = aug_path
		essence_spent += essence_cost

	return out

/datum/preference/blob/shadowrun_chargen/proc/sanitize_contacts(list/in_contacts, list/attributes)
	if (!islist(in_contacts))
		return list()

	var/max_points = get_contact_points(attributes)

	// Build lookup for valid contact types
	var/list/valid_contact_paths = list()
	for (var/contact_path in subtypesof(/datum/sr_contact))
		valid_contact_paths += "[contact_path]"

	var/list/out = list()
	var/total_cost = 0

	// Contacts are stored as list of objects with type_id, connection, loyalty
	for (var/list/contact_data in in_contacts)
		if (!islist(contact_data))
			continue

		var/type_id = contact_data["type_id"]
		if (!istext(type_id) || !(type_id in valid_contact_paths))
			continue

		var/raw_connection = contact_data["connection"]
		var/raw_loyalty = contact_data["loyalty"]
		if (!isnum(raw_connection) || !isnum(raw_loyalty))
			continue

		var/connection = clamp(round(raw_connection), 1, 12)
		var/loyalty = clamp(round(raw_loyalty), 1, 6)
		var/cost = connection + loyalty

		if (total_cost + cost > max_points)
			continue

		out += list(list(
			"type_id" = type_id,
			"connection" = connection,
			"loyalty" = loyalty,
			"name" = contact_data["name"] // Custom name for the contact
		))
		total_cost += cost

	return out

#undef SHADOWRUN_CHARGEN_SOURCE

#undef SHADOWRUN_CHARGEN_SCHEMA_VERSION

#undef SHADOWRUN_CHARGEN_ENABLE_NONHUMAN_METATYPES

#undef METATYPE_PRIORITY_A
#undef METATYPE_PRIORITY_B
#undef METATYPE_PRIORITY_C
#undef METATYPE_PRIORITY_D
#undef METATYPE_PRIORITY_E
