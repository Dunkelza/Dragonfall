/**
 * # Emote Panel
 *
 * A TGUI panel that displays a grid of emotes organized by category.
 * Replaces the verb-based emote system with a clickable UI.
 *
 * Shown in the top-right green panel area.
 */
/datum/emote_panel
	/// The mob this panel belongs to
	var/mob/living/owner

	/// Is the panel currently open?
	var/panel_open = FALSE

	/// Cached emote list
	var/list/cached_emotes

/datum/emote_panel/New(mob/living/owner)
	. = ..()
	src.owner = owner
	build_emote_cache()

/datum/emote_panel/Destroy()
	owner = null
	cached_emotes = null
	return ..()

/datum/emote_panel/proc/build_emote_cache()
	cached_emotes = list()

	// Define emote categories with display order
	var/list/categories = list(
		"Social" = list(),
		"Expression" = list(),
		"Physical" = list(),
		"Sound" = list(),
		"Other" = list()
	)

	// Categorize emotes
	for(var/key in GLOB.emote_list)
		for(var/datum/emote/emote as anything in GLOB.emote_list[key])
			if(!emote.can_player_use)
				continue
			if(!emote.can_run_emote(owner, FALSE, FALSE))
				continue

			var/category = categorize_emote(emote)
			var/list/emote_data = list(
				"key" = emote.key,
				"name" = capitalize(emote.key),
				"desc" = emote.message,
				"type" = emote.emote_type == EMOTE_AUDIBLE ? "audible" : "visible"
			)

			// Avoid duplicates
			var/found = FALSE
			for(var/list/existing in categories[category])
				if(existing["key"] == emote.key)
					found = TRUE
					break
			if(!found)
				categories[category] += list(emote_data)

	cached_emotes = categories

/datum/emote_panel/proc/categorize_emote(datum/emote/emote)
	// Social emotes
	var/list/social_keys = list("wave", "hug", "handshake", "salute", "bow", "nod", "dap", "highfive")
	if(emote.key in social_keys)
		return "Social"

	// Expression emotes
	var/list/expression_keys = list("smile", "frown", "grin", "glare", "blush", "eyebrow", "wink", "pout", "smug")
	if(emote.key in expression_keys)
		return "Expression"

	// Physical emotes
	var/list/physical_keys = list("collapse", "flip", "spin", "jump", "sit", "lay", "shrug", "stretch", "dance", "twitch")
	if(emote.key in physical_keys)
		return "Physical"

	// Sound emotes (audible)
	if(emote.emote_type == EMOTE_AUDIBLE)
		return "Sound"

	return "Other"

/datum/emote_panel/proc/toggle_panel(mob/user)
	if(panel_open)
		SStgui.close_uis(src)
		panel_open = FALSE
	else
		ui_interact(user)
		panel_open = TRUE

/datum/emote_panel/ui_interact(mob/user, datum/tgui/ui)
	ui = SStgui.try_update_ui(user, src, ui)
	if(!ui)
		ui = new(user, src, "EmotePanel", "Emotes")
		ui.open()

/datum/emote_panel/ui_state(mob/user)
	return GLOB.always_state

/datum/emote_panel/ui_close(mob/user)
	. = ..()
	panel_open = FALSE

/datum/emote_panel/ui_static_data(mob/user)
	var/list/data = list()

	// Rebuild cache if needed
	if(!cached_emotes)
		build_emote_cache()

	data["categories"] = cached_emotes

	// Quick emote shortcuts (shown in the main grid)
	var/list/quick_emotes = list(
		// Row 1
		list("key" = "slap", "name" = "Slap"),
		list("key" = "kiss", "name" = "Kiss"),
		list("key" = "nod", "name" = "Nod"),
		list("key" = "lick", "name" = "Lick Lips"),
		list("key" = "praise", "name" = "Praise"),
		list("key" = "cough", "name" = "Cough"),
		list("key" = "hug", "name" = "Hug"),
		list("key" = "spit", "name" = "Spit on Someone"),
		list("key" = "bow", "name" = "Bow"),
		list("key" = "yawn", "name" = "Yawn"),
		// Row 2
		list("key" = "scream", "name" = "Scream"),
		list("key" = "wink", "name" = "Wink"),
		list("key" = "whisper", "name" = "Whisper"),
		list("key" = "grumble", "name" = "Grumble"),
		list("key" = "laugh", "name" = "Laugh"),
		list("key" = "cry", "name" = "Cry"),
		list("key" = "sigh", "name" = "Sigh"),
		list("key" = "hem", "name" = "Hem"),
		list("key" = "clearThroat", "name" = "Clearth Throat"),
		list("key" = "smile", "name" = "Smile"),
		list("key" = "collapse", "name" = "Collapse")
	)

	data["quick_emotes"] = quick_emotes

	return data

/datum/emote_panel/ui_data(mob/user)
	var/list/data = list()

	// Current state info
	data["can_emote"] = !owner.stat

	return data

/datum/emote_panel/ui_act(action, params)
	. = ..()
	if(.)
		return

	switch(action)
		if("emote")
			var/emote_key = params["key"]
			var/target = params["target"]
			if(emote_key)
				owner.emote(emote_key, intentional = TRUE, target = target)
			return TRUE

/// Helper proc to add this to a living mob
/mob/living
	var/datum/emote_panel/emote_panel

/mob/living/Login()
	. = ..()
	if(!emote_panel)
		emote_panel = new(src)

/mob/living/Destroy()
	QDEL_NULL(emote_panel)
	return ..()
