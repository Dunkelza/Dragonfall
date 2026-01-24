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

			quirk_info[quirk_name] = list(
				"description" = initial(quirk_type.desc),
				"icon" = icon,
				"name" = quirk_name,
				"value" = initial(quirk_type.quirk_genre),
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
