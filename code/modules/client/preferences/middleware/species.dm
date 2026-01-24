/datum/preference_middleware/species

/datum/preference_middleware/species/get_constant_data()
	var/list/species_data = list()

	// For now, allow testing with Human and Elf only.
	for (var/species_path in list(/datum/species/human, /datum/species/elf))
		var/datum/species/species = new species_path
		var/species_id = initial(species.id)

		var/display_name = initial(species.name)
		if (species_path == /datum/species/human)
			display_name = "Human"
		else if (species_path == /datum/species/elf)
			display_name = "Elf"

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
