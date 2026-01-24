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
/// Only lock during active rounds - job selection is always allowed.
/proc/shadowrun_should_lock_nonappearance_prefs(datum/preferences/preferences)
	if (!isnull(SSticker) && SSticker.IsRoundInProgress())
		return TRUE
	return FALSE // Allow job/quirk selection even after sheet is saved

/// Returns TRUE if character creation (stats, metatype, etc.) should be locked.
/// Lock during active rounds AND after sheet is saved.
/proc/shadowrun_should_lock_chargen(datum/preferences/preferences)
	if (!isnull(SSticker) && SSticker.IsRoundInProgress())
		return TRUE
	return shadowrun_chargen_is_saved(preferences)

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

	// During active rounds we still need to allow players in the lobby to set up
	// or fix their sheet for latejoin. Keep the "saved" lock semantics, but don't
	// blanket-reject updates.
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

	var/was_saved = !!current["saved"]
	if (!was_saved)
		return sanitized

	// Once saved: do not allow edits.
	// Only allow unlock by a full reset that also clears the saved flag.
	if (!!sanitized["saved"])
		return current

	if (!is_full_reset_state(sanitized))
		return current

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
		// NOTE: These values are in Nuyen (¥) and are intentionally modest.
		"resources" = list("A" = 2000, "B" = 1500, "C" = 1000, "D" = 500, "E" = 200),
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

	data["metatype_choices"] = metatype_choices
	data["metatype_attribute_bounds"] = metatype_attribute_bounds

	data["awakening_choices"] = list(
		list("id" = "mundane", "name" = "Mundane"),
		list("id" = "mage", "name" = "Mage"),
		list("id" = "adept", "name" = "Adept"),
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
	return TRUE

/datum/preference/blob/shadowrun_chargen/proc/sanitize_metatype_species(raw_value, list/priorities)
	var/species_path = null
	if (ispath(raw_value, /datum/species))
		species_path = raw_value
	else if (istext(raw_value))
		species_path = text2path(raw_value)

	if (!ispath(species_path, /datum/species))
		species_path = /datum/species/human

	// Only allow Human and Elf for now.
	if (!(species_path in list(/datum/species/human, /datum/species/elf)))
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

	if (species_type == /datum/species/human)
		return "E"

	if (species_type == /datum/species/elf)
		return "D"

	// "Common" metas.
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
	var/list/bounds = list()
	for (var/stat_path in get_core_stat_paths())
		bounds["[stat_path]"] = list(1, 6)

	if (species_type == /datum/species/elf)
		// SR5 Elf: AGI 2/7, CHA 3/8, others 1/6.
		bounds["[/datum/rpg_stat/agility]"] = list(2, 7)
		bounds["[/datum/rpg_stat/charisma]"] = list(3, 8)

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

#undef SHADOWRUN_CHARGEN_SOURCE

#undef SHADOWRUN_CHARGEN_SCHEMA_VERSION

#undef SHADOWRUN_CHARGEN_ENABLE_NONHUMAN_METATYPES

#undef METATYPE_PRIORITY_A
#undef METATYPE_PRIORITY_B
#undef METATYPE_PRIORITY_C
#undef METATYPE_PRIORITY_D
#undef METATYPE_PRIORITY_E
