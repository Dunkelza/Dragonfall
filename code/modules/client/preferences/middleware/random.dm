/datum/preference_middleware/random

/datum/preference_middleware/random/get_constant_data()
	var/list/randomizable = list()

	for (var/preference_type in GLOB.preference_entries)
		var/datum/preference/preference = GLOB.preference_entries[preference_type]
		if (preference.savefile_identifier != PREFERENCE_CHARACTER)
			continue
		if (!preference.can_randomize)
			continue

		randomizable += preference.savefile_key

	return list(
		"randomizable" = randomizable,
	)
