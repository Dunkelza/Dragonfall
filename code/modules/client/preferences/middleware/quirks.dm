/datum/preference_middleware/quirks
	action_delegations = list(
		"give_quirk" = PROC_REF(give_quirk),
		"remove_quirk" = PROC_REF(remove_quirk),
	)

/datum/preference_middleware/quirks/get_ui_data(mob/user)
	if (isnull(preferences))
		return list()

	return list(
		"selected_quirks" = preferences.read_preference(/datum/preference/blob/quirks),
	)

/datum/preference_middleware/quirks/get_constant_data()
	var/list/quirk_info = list()
	var/list/quirk_blacklist_names = list()

	if (!isnull(SSquirks))
		var/list/all_quirks = SSquirks.get_quirks()
		for (var/quirk_name as anything in all_quirks)
			var/datum/quirk/quirk_type = all_quirks[quirk_name]
			var/icon = initial(quirk_type.icon)
			if (isnull(icon) || !istext(icon) || !length(icon))
				icon = "question"

			// Build prerequisite data for SR5 quality filtering
			var/list/prereqs = list()

			// Allowed metatypes (convert paths to strings)
			var/list/allowed_meta = initial(quirk_type.allowed_metatypes)
			if (islist(allowed_meta) && length(allowed_meta))
				var/list/meta_strings = list()
				for (var/path in allowed_meta)
					meta_strings += "[path]"
				prereqs["allowed_metatypes"] = meta_strings

			// Forbidden metatypes
			var/list/forbidden_meta = initial(quirk_type.forbidden_metatypes)
			if (islist(forbidden_meta) && length(forbidden_meta))
				var/list/meta_strings = list()
				for (var/path in forbidden_meta)
					meta_strings += "[path]"
				prereqs["forbidden_metatypes"] = meta_strings

			// Required awakening types
			var/list/req_awaken = initial(quirk_type.required_awakening)
			if (islist(req_awaken) && length(req_awaken))
				prereqs["required_awakening"] = req_awaken

			// Forbidden awakening types
			var/list/forb_awaken = initial(quirk_type.forbidden_awakening)
			if (islist(forb_awaken) && length(forb_awaken))
				prereqs["forbidden_awakening"] = forb_awaken

			// Required quirks (other qualities that must be taken first)
			var/list/req_quirks = initial(quirk_type.required_quirks)
			if (islist(req_quirks) && length(req_quirks))
				prereqs["required_quirks"] = req_quirks

			// Incompatible quirks (mutual exclusions)
			var/list/incompat = initial(quirk_type.incompatible_quirks)
			if (islist(incompat) && length(incompat))
				prereqs["incompatible_quirks"] = incompat

			quirk_info[quirk_name] = list(
				"description" = initial(quirk_type.desc),
				"icon" = icon,
				"name" = quirk_name,
				"value" = initial(quirk_type.karma_value),
				"prerequisites" = prereqs,
			)

		for (var/list/blacklist as anything in SSquirks.quirk_blacklist)
			var/list/names = list()
			for (var/datum/quirk/quirk_type as anything in blacklist)
				names += initial(quirk_type.name)
			quirk_blacklist_names += list(names)

	return list(
		// This codebase historically did not enforce a positive/negative balance.
		// Keep behavior permissive by default; the UI can opt-in if desired.
		"enforce_balance" = FALSE,
		"max_positive_quirks" = 999,
		"quirk_blacklist" = quirk_blacklist_names,
		"quirk_info" = quirk_info,
	)

/datum/preference_middleware/quirks/proc/give_quirk(list/params, mob/user)
	if (isnull(preferences) || user?.client != preferences.parent)
		return FALSE

	if (shadowrun_should_lock_nonappearance_prefs(preferences))
		return FALSE

	var/quirk_name = params["quirk"]
	if (!istext(quirk_name) || isnull(SSquirks) || isnull(SSquirks.quirks[quirk_name]))
		return FALSE

	var/datum/preference/P = GLOB.preference_entries[/datum/preference/blob/quirks]
	var/list/user_quirks = preferences.read_preference(P.type)
	if (!(quirk_name in user_quirks))
		user_quirks += quirk_name

	return preferences.update_preference(P, user_quirks)

/datum/preference_middleware/quirks/proc/remove_quirk(list/params, mob/user)
	if (isnull(preferences) || user?.client != preferences.parent)
		return FALSE

	if (shadowrun_should_lock_nonappearance_prefs(preferences))
		return FALSE

	var/quirk_name = params["quirk"]
	if (!istext(quirk_name))
		return FALSE

	var/datum/preference/P = GLOB.preference_entries[/datum/preference/blob/quirks]
	var/list/user_quirks = preferences.read_preference(P.type)
	if (quirk_name in user_quirks)
		user_quirks -= quirk_name

	return preferences.update_preference(P, user_quirks)
