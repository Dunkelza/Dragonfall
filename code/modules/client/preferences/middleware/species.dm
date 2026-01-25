/datum/preference_middleware/species

/datum/preference_middleware/species/get_constant_data()
	var/list/species_data = list()

	// SR5 Metatypes: Human, Elf, Dwarf, Ork, Troll
	var/list/sr5_metatypes = list(
		/datum/species/human,
		/datum/species/elf,
		/datum/species/dwarf,
		/datum/species/ork,
		/datum/species/troll
	)

	for (var/species_path in sr5_metatypes)
		var/datum/species/species = new species_path
		var/species_id = initial(species.id)

		var/display_name = initial(species.name)
		switch(species_path)
			if (/datum/species/human)
				display_name = "Human"
			if (/datum/species/elf)
				display_name = "Elf"
			if (/datum/species/dwarf)
				display_name = "Dwarf"
			if (/datum/species/ork)
				display_name = "Ork"
			if (/datum/species/troll)
				display_name = "Troll"

		var/list/enabled_features = list()
		var/list/features = species.get_features()
		for (var/feature_key in features)
			enabled_features += feature_key

		species_data[species_id] = list(
			"name" = display_name,
			"desc" = species.get_species_mechanics(),
			"diet" = species.get_species_diet(),
			"enabled_features" = enabled_features,
			// The UI expects a CSS class name here; using id keeps it stable.
			"icon" = species_id,
			"lore" = species.get_species_lore(),
			"perks" = list(
				"positive" = list(),
				"neutral" = list(),
				"negative" = list(),
			),
			"sexes" = species.sexes,
			"use_skintones" = species.use_skintones,
		)

		qdel(species)

	return species_data
