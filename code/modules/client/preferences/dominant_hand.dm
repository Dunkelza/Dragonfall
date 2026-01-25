/**
 * Dominant Hand Preference
 *
 * Determines which hand is the character's dominant hand.
 * Using the non-dominant hand incurs penalties unless the character
 * has the Ambidextrous trait.
 *
 * In Shadowrun 5e, using your off-hand gives you a -2 dice pool penalty.
 * We translate this as:
 * - +15 spread on ranged weapons
 * - -15% damage on melee attacks
 */

#define DOMINANT_HAND_RIGHT "right"
#define DOMINANT_HAND_LEFT "left"

/datum/preference/choiced/dominant_hand
	explanation = "Dominant Hand"
	savefile_identifier = PREFERENCE_CHARACTER
	savefile_key = "dominant_hand"

/datum/preference/choiced/dominant_hand/init_possible_values()
	return list(DOMINANT_HAND_RIGHT, DOMINANT_HAND_LEFT)

/datum/preference/choiced/dominant_hand/create_default_value()
	// About 90% of population is right-handed
	return DOMINANT_HAND_RIGHT

/datum/preference/choiced/dominant_hand/apply_to_human(mob/living/carbon/human/target, value)
	target.dominant_hand = value

/// Returns TRUE if the mob is currently using their non-dominant hand
/mob/living/carbon/human/proc/is_using_offhand()
	// If ambidextrous, never using offhand
	if(HAS_TRAIT(src, TRAIT_AMBIDEXTROUS))
		return FALSE

	// Check which hand is active
	// In SS13: odd indexes (1, 3, 5...) are LEFT hands, even indexes (2, 4, 6...) are RIGHT hands
	var/using_right = IS_RIGHT_INDEX(active_hand_index)

	// Compare to dominant hand
	if(dominant_hand == DOMINANT_HAND_RIGHT)
		return !using_right // Offhand if using left
	else
		return using_right // Offhand if using right

/// Returns the offhand penalty multiplier for damage (1.0 = no penalty, 0.85 = 15% less damage)
/mob/living/carbon/human/proc/get_offhand_damage_multiplier()
	if(is_using_offhand())
		return 0.85 // 15% damage reduction for offhand
	return 1.0

/// Returns the offhand spread penalty for ranged weapons (0 = no penalty)
/mob/living/carbon/human/proc/get_offhand_spread_penalty()
	if(is_using_offhand())
		return 15 // +15 spread for offhand shots
	return 0

#undef DOMINANT_HAND_RIGHT
#undef DOMINANT_HAND_LEFT
