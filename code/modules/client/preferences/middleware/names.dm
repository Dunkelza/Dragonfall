/datum/preference_middleware/names

/datum/preference_middleware/names/get_constant_data()
	var/list/types = list()

	for (var/preference_type in GLOB.preference_entries)
		var/datum/preference/preference = GLOB.preference_entries[preference_type]
		if (!istype(preference, /datum/preference/name))
			continue

		var/datum/preference/name/name_preference = preference
		types[name_preference.savefile_key] = list(
			"can_randomize" = name_preference.can_randomize,
			"explanation" = name_preference.explanation,
			"group" = name_preference.group,
		)

	return list(
		"types" = types,
	)
