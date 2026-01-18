/**
 * SR5 Special Attributes
 * - Edge (resource-like)
 * - Essence (derived from augmentation; currently conservative placeholder)
 * - Magic (awakening; currently conservative placeholder)
 */

/datum/rpg_stat/special
	abstract_type = /datum/rpg_stat/special

	/// Special attributes often have tighter caps than general attributes.
	var/min_value = 0
	var/max_value = 6

/datum/rpg_stat/special/get(mob/living/user, list/out_sources)
	. = ..()
	return clamp(., min_value, max_value)

/datum/rpg_stat/edge
	parent_type = /datum/rpg_stat/special
	name = "Edge"
	desc = "Luck, timing, and the ability to push past the odds."

	value = 2
	sound = 'sound/shadowrun/special_stats.ogg'

	ui_class = "edge"
	ui_sort_order = 9

	// SR5 default: metahuman Edge max is typically 6.
	max_value = 6
	min_value = 0

/datum/rpg_stat/essence
	parent_type = /datum/rpg_stat/special
	name = "Essence"
	desc = "Your remaining humanity. Reduced by cyberware and heavy augmentation."

	value = 6
	sound = 'sound/shadowrun/special_stats.ogg'

	ui_class = "essence"
	ui_sort_order = 10

	max_value = 6
	min_value = 0

/datum/rpg_stat/essence/get(mob/living/user, list/out_sources)
	var/base = initial(value)
	if(out_sources)
		out_sources["Base Essence"] = base

	var/raw_loss = 0
	if(iscarbon(user))
		var/mob/living/carbon/carbon_user = user
		raw_loss = carbon_user.get_sr_essence_loss(out_sources)

	var/capped_loss = clamp(raw_loss, 0, max_value)
	if(out_sources)
		out_sources["Total Essence loss"] = -capped_loss
	if(out_sources && raw_loss > capped_loss)
		// Reconcile the displayed breakdown with the capped final stat value.
		out_sources["Essence loss capped"] = (raw_loss - capped_loss)

	var/with_cyberware = base - capped_loss
	var/with_modifiers = with_cyberware + values_sum(modifiers)
	return clamp(with_modifiers, min_value, max_value)

/datum/rpg_stat/magic
	parent_type = /datum/rpg_stat/special
	name = "Magic"
	desc = "Awakened potential. 0 for mundanes; higher values indicate stronger magical talent."

	value = 0
	sound = 'sound/shadowrun/special_stats.ogg'

	ui_class = "magic"
	ui_sort_order = 11

	max_value = 6
	min_value = 0

/datum/rpg_stat/magic/get(mob/living/user, list/out_sources)
	// SR5: Essence loss reduces the maximum attainable Magic.
	var/base = initial(value) + values_sum(modifiers)
	var/cap = max_value
	if(user?.stats)
		cap = min(cap, user.stats.get_stat_modifier(/datum/rpg_stat/essence))
	return clamp(base, min_value, cap)

/// SR5 helper: compute total Essence loss from installed cyberware/augments.
/// Optionally populates `out_sources` with per-item contributions (negative values).
/// We intentionally key off `essence_cost` (not `organ_flags`) to avoid false positives.
/mob/living/carbon/proc/get_sr_essence_loss(list/out_sources)
	// Synthetic species (e.g. IPCs) shouldn't be penalized for their baseline chassis.
	if(mob_biotypes & MOB_ROBOTIC)
		return 0

	var/loss = 0
	for(var/obj/item/bodypart/B as anything in bodyparts)
		if(!B)
			continue
		if(B.essence_cost)
			loss += B.essence_cost
			if(out_sources)
				var/source = "Bodypart: [B.name]"
				if(!isnull(out_sources[source]))
					var/i = 2
					while(!isnull(out_sources["[source] ([i])"]))
						i++
					source = "[source] ([i])"
				out_sources[source] = -B.essence_cost
	for(var/obj/item/organ/O as anything in organs)
		if(!O)
			continue
		if(O.cosmetic_only)
			continue
		if(O.essence_cost)
			// If a bodypart is already robotic, don't double-charge Essence for implants installed into that body zone.
			if(istype(O, /obj/item/organ/cyberimp) && (O.zone == BODY_ZONE_L_ARM || O.zone == BODY_ZONE_R_ARM || O.zone == BODY_ZONE_L_LEG || O.zone == BODY_ZONE_R_LEG || O.zone == BODY_ZONE_CHEST || O.zone == BODY_ZONE_HEAD))
				var/obj/item/bodypart/limb = get_bodypart(O.zone)
				if(limb && (limb.bodytype & BODYTYPE_ROBOTIC))
					continue
			loss += O.essence_cost
			if(out_sources)
				var/source = "Organ: [O.name]"
				if(!isnull(out_sources[source]))
					var/i = 2
					while(!isnull(out_sources["[source] ([i])"]))
						i++
					source = "[source] ([i])"
				out_sources[source] = -O.essence_cost
	return loss
