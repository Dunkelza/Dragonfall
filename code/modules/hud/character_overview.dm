/**
 * # Character Overview Panel
 *
 * A persistent TGUI panel that displays character status information
 * on the right side of the screen. Designed to replace/supplement the
 * old statpanel tabs with a more immersive, always-visible display.
 *
 * Shows:
 * - Bodypart status (health per limb)
 * - Character identity (name, blood type)
 * - Character details (age, favorite drink)
 * - Vice/traits
 * - Status effects and conditions
 * - Toggleable status buttons (Awake/Eyes/Teach)
 */
/datum/character_overview
	/// The mob this overview belongs to
	var/mob/living/carbon/human/owner

	/// Is the panel currently open?
	var/panel_open = FALSE

	/// Recent action log messages (cries, screams, etc.)
	var/list/action_log = list()

	/// Maximum action log entries to keep
	var/max_log_entries = 20

/datum/character_overview/New(mob/living/carbon/human/owner)
	. = ..()
	src.owner = owner

/datum/character_overview/Destroy()
	owner = null
	action_log.Cut()
	return ..()

/datum/character_overview/proc/toggle_panel(mob/user)
	if(panel_open)
		SStgui.close_uis(src)
		panel_open = FALSE
	else
		ui_interact(user)
		panel_open = TRUE

/datum/character_overview/proc/add_action_log(message)
	action_log += list(list(
		"message" = message,
		"time" = world.time
	))
	if(length(action_log) > max_log_entries)
		action_log.Cut(1, 2)
	SStgui.update_uis(src)

/datum/character_overview/ui_interact(mob/user, datum/tgui/ui)
	ui = SStgui.try_update_ui(user, src, ui)
	if(!ui)
		ui = new(user, src, "CharacterOverview", "Character Overview")
		ui.open()
		ui.set_autoupdate(TRUE)

/datum/character_overview/ui_state(mob/user)
	return GLOB.always_state

/datum/character_overview/ui_close(mob/user)
	. = ..()
	panel_open = FALSE

/datum/character_overview/ui_data(mob/user)
	var/list/data = list()

	if(!owner)
		return data

	// Character identity
	data["name"] = owner.real_name
	data["blood_type"] = owner.dna?.blood_type || "Unknown"

	// Character details
	data["age"] = owner.age
	data["favorite_drink"] = owner.favorite_drink || "None"

	// Vice/trait info
	var/list/vices = list()
	if(owner.mind)
		for(var/datum/quirk/quirk as anything in owner.quirks)
			vices += list(list(
				"name" = quirk.name,
				"desc" = quirk.desc,
				"positive" = quirk.value > 0
			))
	data["vices"] = vices

	// Bodypart status
	var/list/bodyparts = list()
	for(var/obj/item/bodypart/BP as anything in owner.bodyparts)
		var/list/bp_data = list(
			"name" = BP.name,
			"zone" = BP.body_zone,
			"missing" = FALSE
		)

		var/list/statuses = list()

		// Brute damage
		if(BP.brute_dam > 0)
			var/severity = BP.brute_dam > 30 ? 2 : 1
			statuses["Brute Damage"] = severity

		// Burn damage
		if(BP.burn_dam > 0)
			var/severity = BP.burn_dam > 30 ? 2 : 1
			statuses["Burn Damage"] = severity

		// Bleeding
		if(BP.generic_bleedstacks > 0)
			statuses["Bleeding"] = 2

		// Broken
		if(BP.bone_status == BONE_FLAG_BROKEN)
			statuses["Broken"] = 2
		else if(BP.bone_status == BONE_FLAG_SPLINTED)
			statuses["Splinted"] = 1

		bp_data["statuses"] = statuses
		bodyparts += list(bp_data)

	// Check for missing limbs
	var/list/expected_zones = list(BODY_ZONE_HEAD, BODY_ZONE_CHEST, BODY_ZONE_L_ARM, BODY_ZONE_R_ARM, BODY_ZONE_L_LEG, BODY_ZONE_R_LEG)
	var/list/present_zones = list()
	for(var/obj/item/bodypart/BP as anything in owner.bodyparts)
		present_zones += BP.body_zone

	for(var/zone in expected_zones)
		if(!(zone in present_zones))
			bodyparts += list(list(
				"name" = zone,
				"zone" = zone,
				"missing" = TRUE,
				"statuses" = list()
			))

	data["bodyparts"] = bodyparts

	// General mob statuses
	var/list/mob_statuses = list()

	// Check consciousness
	if(owner.stat == DEAD)
		mob_statuses["Dead"] = 2
	else if(owner.stat == UNCONSCIOUS)
		mob_statuses["Unconscious"] = 2
	else if(owner.stat == SOFT_CRIT)
		mob_statuses["Critical"] = 2

	// Hunger
	if(owner.nutrition < NUTRITION_LEVEL_STARVING)
		mob_statuses["Starving"] = 2
	else if(owner.nutrition < NUTRITION_LEVEL_HUNGRY)
		mob_statuses["Hungry"] = 1

	// Thirst (if applicable)
	if(owner.hydration < HYDRATION_LEVEL_DEHYDRATED)
		mob_statuses["Dehydrated"] = 2
	else if(owner.hydration < HYDRATION_LEVEL_THIRSTY)
		mob_statuses["Thirsty"] = 1

	// Temperature
	if(owner.bodytemperature < owner.get_body_temp_cold_damage_limit())
		mob_statuses["Freezing"] = 2
	else if(owner.bodytemperature > owner.get_body_temp_heat_damage_limit())
		mob_statuses["Overheating"] = 2

	// Toxins
	if(owner.getToxLoss() > 30)
		mob_statuses["Poisoned"] = 2
	else if(owner.getToxLoss() > 10)
		mob_statuses["Toxins"] = 1

	// Oxygen
	if(owner.getOxyLoss() > 30)
		mob_statuses["Suffocating"] = 2
	else if(owner.getOxyLoss() > 10)
		mob_statuses["Low Oxygen"] = 1

	data["mob_statuses"] = mob_statuses

	// Status toggles (for the bottom buttons)
	data["is_awake"] = owner.stat == CONSCIOUS
	data["eyes_status"] = owner.is_blind() ? "Blind" : "OK"
	data["can_speak"] = !owner.silent

	// Action log
	data["action_log"] = action_log

	return data

/datum/character_overview/ui_act(action, params)
	. = ..()
	if(.)
		return

	switch(action)
		if("toggle_rest")
			owner.toggle_resting()
			return TRUE
		if("resist")
			owner.resist()
			return TRUE

/// Helper proc to add this to a human mob
/mob/living/carbon/human
	var/datum/character_overview/character_overview

/mob/living/carbon/human/Login()
	. = ..()
	if(!character_overview)
		character_overview = new(src)

/mob/living/carbon/human/Destroy()
	QDEL_NULL(character_overview)
	return ..()
