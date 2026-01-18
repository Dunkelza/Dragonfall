GLOBAL_DATUM_INIT(success_roll, /datum/roll_result/success, new)
/**
 * Perform a Shadowrun 5e-style test, returning a roll result datum.
 *
 * In SR5, you roll a pool of d6; 5-6 are hits. Compare hits to a threshold.
 *
 * Args:
 * - requirement: threshold (hits needed). If a non-threshold value is passed, it is mapped to a coarse threshold.
 * - modifier: additional dice added to the pool.
 */
/mob/living/proc/stat_roll(requirement = STATS_BASELINE_VALUE, datum/rpg_skill/skill_path, modifier = 0, crit_fail_modifier = -10, mob/living/defender)
	RETURN_TYPE(/datum/roll_result)

	var/datum/rpg_skill/checked_skill_path = skill_path

	/// The entertainer specifically always uses Sock and Buskin because that's funny.
	if(skill_path && mind?.assigned_role?.title == JOB_CLOWN)
		checked_skill_path = /datum/rpg_skill/theatre

	// SR5 dice pools: roll N d6, 5-6 are hits; compare hits to a threshold.
	var/threshold = sr_threshold_from_3d6_requirement(requirement)

	var/skill_rating = checked_skill_path ? stats.get_skill_modifier(checked_skill_path) : 0
	var/attr_rating = checked_skill_path ? stats.get_stat_modifier(initial(checked_skill_path.parent_stat_type)) : 0
	var/dice_pool = max(0, skill_rating + attr_rating + modifier)

	// If a defender is provided, treat it as an opposed test.
	// Defender rolls the same skill + attribute; attacker needs >= (defender hits + threshold).
	if(defender && skill_path && defender.stats)
		var/def_skill = defender.stats.get_skill_modifier(skill_path)
		var/def_attr = defender.stats.get_stat_modifier(initial(skill_path.parent_stat_type))
		var/def_pool = max(0, def_skill + def_attr)
		var/datum/roll_result/def_result = roll_3d6(0, def_pool, crit_fail_modifier, skill_type_used = skill_path)
		threshold += def_result.roll

	return roll_3d6(threshold, dice_pool, crit_fail_modifier, skill_type_used = skill_path)

// SR5 dice pool roll.
// Args:
// * requirement: threshold (hits needed). If 0, always succeeds with 0 hits unless critical glitch.
// * modifier: dice pool size.
/proc/roll_3d6(requirement = 1, modifier, crit_fail_modifier = -10, datum/rpg_skill/skill_type_used)
	RETURN_TYPE(/datum/roll_result)

	var/dice_pool = max(0, round(modifier))
	var/threshold = max(0, round(requirement))

	// Special-case: extremely large pools are treated as guaranteed success (scripted outcomes).
	if(dice_pool >= 999)
		var/datum/roll_result/auto = new /datum/roll_result/success
		auto.dice_pool = dice_pool
		auto.requirement = threshold
		auto.skill_type_used = skill_type_used
		auto.calculate_probability()
		return auto

	var/hits = 0
	var/ones = 0
	for(var/i in 1 to dice_pool)
		var/d = rand(1, 6)
		if(d == 1)
			ones++
		else if(d >= 5)
			hits++

	// if(dice >= requirement)
	// 	var/list/out = list(
	// 		"ROLL: [dice] ([modifier >= 0 ? "+[modifier]" : "-[modifier]"])",
	// 		"SUCCESS PROB: %[round(dice_probability(3, 6, requirement - modifier), 0.01)]",
	// 		"CRIT SP: %[round(dice_probability(3, 6, crit_success), 0.01)]",
	// 		"MOD: [modifier]",
	// 		"LOWEST POSSIBLE: [3 + modifier]",
	// 		"HIGHEST POSSIBLE:[18 + modifier]",
	// 		"CRIT SUCCESS: [crit_success]",
	// 		"SUCCESS: [requirement]",
	// 		"FAIL: [requirement-1]",
	// 		"CRIT FAIL:[crit_fail]",
	// 		"~~~~~~~~~~~~~~~"
	// 	)
	// 	to_chat(world, span_adminnotice(jointext(out, "")))

	var/datum/roll_result/result = new()
	result.roll = hits
	result.ones = ones
	result.dice_pool = dice_pool
	result.modifier = 0
	result.requirement = threshold
	result.skill_type_used = skill_type_used
	result.calculate_probability()

	result.glitch = (dice_pool > 0) && (ones >= ceil(dice_pool / 2))
	result.critical_glitch = result.glitch && (hits <= 0)

	if(result.critical_glitch)
		result.outcome = CRIT_FAILURE
	else if(hits >= threshold)
		result.outcome = SUCCESS
	else
		result.outcome = FAILURE

	return result

/datum/roll_result
	/// Outcome of the roll, failure, success, etc.
	var/outcome
	/// The % chance to have rolled a success (0-100)
	var/success_prob
	/// The numerical value rolled.
	/// For SR5, this is the number of hits.
	var/roll
	/// The value required to pass the roll.
	/// For SR5, this is the threshold (hits needed).
	var/requirement
	/// The modifier attached to the roll.
	var/modifier

	/// For SR5: number of dice rolled.
	var/dice_pool
	/// For SR5: number of 1s rolled.
	var/ones
	/// For SR5: glitch state.
	var/glitch = FALSE
	/// For SR5: critical glitch state.
	var/critical_glitch = FALSE

	/// Typepath of the skill used. Optional.
	var/datum/rpg_skill/skill_type_used

	/// How many times this result was pulled from a result cache.
	var/cache_reads = 0

/datum/roll_result/proc/calculate_probability()
	// SR5: P(hits >= threshold) where hits ~ Binomial(dice_pool, 1/3)
	if(!isnum(dice_pool) || dice_pool <= 0)
		success_prob = (requirement <= 0) ? 100 : 0
		return
	success_prob = round(sr_success_probability(dice_pool, requirement), 0.01)

/datum/roll_result/proc/create_tooltip(body, body_only = FALSE)
	if(!skill_type_used)
		if(outcome >= SUCCESS)
			body = span_statsgood(body)
		else
			body = span_statsbad(body)
		return body

	var/prob_string
	switch(success_prob)
		if(0 to 12)
			prob_string = "Impossible"
		if(13 to 24)
			prob_string = "Legendary"
		if(25 to 36)
			prob_string = "Formidable"
		if(37 to 48)
			prob_string = "Challenging"
		if(49 to 60)
			prob_string = "Hard"
		if(61 to 72)
			prob_string = "Medium"
		if(73 to 84)
			prob_string = "Easy"
		if(85 to 100)
			prob_string = "Trivial"

	var/success = ""
	switch(outcome)
		if(CRIT_SUCCESS)
			success = "Critical Success"
		if(SUCCESS)
			success = "Success"
		if(FAILURE)
			success = "Failure"
		if(CRIT_FAILURE)
			success = "Critical Failure"

	if(glitch)
		success = critical_glitch ? "Critical Glitch" : "Glitch"

	var/finished_prob_string = "<span style='color: #bbbbad;font-style: italic'>\[[prob_string]: [success]\]</span>"
	var/prefix
	if(outcome >= SUCCESS)
		prefix = "<span style='font-style: italic;color: #03fca1'>[uppertext(initial(skill_type_used.name))]</span> "
		body = span_statsgood(body)
	else
		prefix = "<span style='font-style: italic;color: #fc4b32'>[uppertext(initial(skill_type_used.name))]</span> "
		body = span_statsbad(body)

	var/result_color = (outcome >= SUCCESS) ? "#03fca1" : "#fc4b32"
	var/result_string = "Hits: <span style='font-weight: bold;color: [result_color]'><b>[roll]</b></span> | Pool: <b>[dice_pool]</b> | Ones: <b>[ones]</b>"
	var/tooltip_html = "[success_prob]% | [result_string] | Threshold: <b>[requirement]</b>"
	var/seperator = "<span style='color: #bbbbad;font-style: italic'>: </span>"

	if(body_only)
		return body
	return "[prefix]<span data-component=\"Tooltip\" data-innerhtml=\"[tooltip_html]\" class=\"tooltip\">[finished_prob_string]</span>[seperator][body]"

/// Play
/datum/roll_result/proc/do_skill_sound(mob/user)
	if(isnull(skill_type_used) || cache_reads)
		return

	var/datum/rpg_stat/stat_path = initial(skill_type_used.parent_stat_type)
	var/sound_path = initial(stat_path.sound)
	SEND_SOUND(user, sound(sound_path))

/datum/roll_result/success
	outcome = SUCCESS
	success_prob = 100
	roll = 999
	requirement = 0
	dice_pool = 999
	ones = 0

/datum/roll_result/critical_success
	outcome = CRIT_SUCCESS
	success_prob = 100
	roll = 999
	requirement = 0
	dice_pool = 999
	ones = 0

/datum/roll_result/critical_failure
	outcome = CRIT_FAILURE
	success_prob = 0
	roll = 0
	requirement = 1
	dice_pool = 1
	ones = 1

/// Map the requirement input into an SR5 threshold.
/// This is intentionally coarse: most call sites use a small set of difficulty buckets.
/proc/sr_threshold_from_3d6_requirement(requirement)
	if(!isnum(requirement))
		return 1
	// Lower requirement means easier, so map into a smaller threshold.
	if(requirement <= 3)
		return 0
	if(requirement <= 7)
		return 1
	if(requirement <= 10)
		return 2
	if(requirement <= 13)
		return 3
	if(requirement <= 15)
		return 4
	if(requirement <= 17)
		return 5
	return 6

/// nCk as a float, safe for small-ish n.
/proc/sr_choose(n, k)
	if(k < 0 || k > n)
		return 0
	if(k == 0 || k == n)
		return 1
	if(k > n - k)
		k = n - k
	var/result = 1.0
	for(var/i in 1 to k)
		result *= (n - (k - i)) / i
	return result

/// Probability (0-100) of rolling >= threshold hits on a dice pool.
/proc/sr_success_probability(dice_pool, threshold)
	if(dice_pool <= 0)
		return (threshold <= 0) ? 100 : 0
	if(threshold <= 0)
		return 100
	if(threshold > dice_pool)
		return 0
	var/p = 1.0 / 3.0
	var/q = 1.0 - p
	var/prob_sum = 0.0
	for(var/k in threshold to dice_pool)
		prob_sum += sr_choose(dice_pool, k) * (p ** k) * (q ** (dice_pool - k))
	return prob_sum * 100
