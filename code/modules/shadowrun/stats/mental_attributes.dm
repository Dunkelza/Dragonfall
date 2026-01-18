/**
 * SR5 Mental Attributes
 * - Willpower, Logic, Intuition, Charisma
 */
/datum/rpg_stat/willpower
	name = "Willpower"
	desc = "Mental fortitude, grit, and resistance to pressure."

	value = 3
	sound = 'sound/shadowrun/mental_attributes.ogg'

	ui_class = "willpower"
	ui_sort_order = 5

/datum/rpg_stat/logic
	name = "Logic"
	desc = "Reasoning, memory, and problem solving."

	value = 3
	sound = 'sound/shadowrun/mental_attributes.ogg'

	ui_class = "logic"
	ui_sort_order = 6

/datum/rpg_stat/logic/get(mob/living/user, list/out_sources)
	. = ..()
	if(!iscarbon(user))
		return

	var/mob/living/carbon/carbon_user = user
	var/obj/item/organ/brain/brain = carbon_user.getorganslot(ORGAN_SLOT_BRAIN)
	if(brain && (brain.damage >= (brain.maxHealth * brain.low_threshold)))
		. -= 2
		out_sources?["Brain damage"] = -2

/datum/rpg_stat/intuition
	name = "Intuition"
	desc = "Awareness, instinct, and pattern recognition."

	value = 3
	sound = 'sound/shadowrun/mental_attributes.ogg'

	ui_class = "intuition"
	ui_sort_order = 7

/datum/rpg_stat/charisma
	name = "Charisma"
	desc = "Presence, force of personality, and social sway."

	value = 3
	sound = 'sound/shadowrun/mental_attributes.ogg'

	ui_class = "charisma"
	ui_sort_order = 8
