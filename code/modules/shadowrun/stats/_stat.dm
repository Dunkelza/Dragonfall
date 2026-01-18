/datum/rpg_stat
	abstract_type = /datum/rpg_stat
	var/name = ""
	var/desc = ""

	/// Base rating for this attribute.
	var/value = STATS_MINIMUM_VALUE
	var/list/modifiers

	var/sound

	/// Used to assign css classes in TGUI.
	var/ui_class = ""
	/// Affects the sort order in TGUI.
	var/ui_sort_order = 0

/datum/rpg_stat/proc/get(mob/living/user, list/out_sources)
	return value

/// Update the modified value with modifiers.
/datum/rpg_stat/proc/update_modifiers()
	SHOULD_NOT_OVERRIDE(TRUE)
	value = initial(value)
	value += values_sum(modifiers)
