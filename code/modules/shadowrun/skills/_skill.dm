/datum/rpg_skill
	abstract_type = /datum/rpg_skill

	var/name = ""
	var/desc = ""

	/// Base rating for this skill.
	var/value = 0
	var/list/modifiers

	/// All skills must have a valid parent stat type.
	var/parent_stat_type = null
	/// Affects the sort order in TGUI.
	var/ui_sort_order = 0

/datum/rpg_skill/proc/get(mob/living/user, list/out_sources)
	return value

/// Update the modified value with modifiers.
/datum/rpg_skill/proc/update_modifiers()
	SHOULD_NOT_OVERRIDE(TRUE)
	value = initial(value)
	value += values_sum(modifiers)
