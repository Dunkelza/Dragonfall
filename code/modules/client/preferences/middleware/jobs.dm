/datum/preference_middleware/jobs
	action_delegations = list(
		"set_job_preference" = PROC_REF(set_job_preference),
		"set_job_title" = PROC_REF(set_job_title),
	)

/datum/preference_middleware/jobs/get_ui_data(mob/user)
	if (isnull(preferences) || isnull(user?.client))
		return list()

	var/list/job_bans = list()
	var/list/job_days_left = list()
	var/list/job_required_experience = list()

	if (!isnull(SSjob))
		for (var/datum/job/job as anything in SSjob.all_occupations)
			if (job.faction != FACTION_STATION)
				continue

			if (is_banned_from(user.client?.ckey, job.title))
				job_bans += job.title
				continue

			var/required_playtime_remaining = job.required_playtime_remaining(user.client)
			if (required_playtime_remaining)
				job_required_experience[job.title] = list(
					"experience_type" = job.get_exp_req_type(),
					"required_playtime" = required_playtime_remaining,
				)
				continue

			if (!job.player_old_enough(user.client))
				job_days_left[job.title] = job.available_in_days(user.client)

	var/datum/preference/P = GLOB.preference_entries[/datum/preference/blob/job_priority]
	var/list/data = list(
		"job_preferences" = preferences.read_preference(P.type),
		"job_alt_titles" = preferences.alt_job_titles,
	)

	if (length(job_bans))
		data["job_bans"] = job_bans

	if (length(job_days_left))
		data["job_days_left"] = job_days_left

	if (length(job_required_experience))
		data["job_required_experience"] = job_required_experience

	return data

/datum/preference_middleware/jobs/get_constant_data()
	var/list/departments = list()
	var/list/jobs = list()

	if (isnull(SSjob))
		return list(
			"departments" = departments,
			"jobs" = jobs,
		)

	for (var/datum/job/job as anything in SSjob.joinable_occupations)
		if (job.faction != FACTION_STATION)
			continue

		var/datum/job_department/department_type = job.department_for_prefs || job.departments_list?[1]
		if (isnull(department_type))
			continue

		var/job_desc = job.description
		if (isnull(job_desc))
			job_desc = ""

		var/department_name = initial(department_type.department_name)
		if (isnull(departments[department_name]))
			var/datum/job/department_head_type = initial(department_type.department_head)
			departments[department_name] = list(
				"head" = department_head_type && initial(department_head_type.title),
			)

		var/list/job_entry = list(
			"department" = department_name,
			"description" = job_desc,
		)

		if (length(job.alt_titles))
			job_entry["alt_titles"] = job.alt_titles

		jobs[job.title] = job_entry

	return list(
		"departments" = departments,
		"jobs" = jobs,
	)

/datum/preference_middleware/jobs/proc/set_job_preference(list/params, mob/user)
	if (isnull(preferences) || user?.client != preferences.parent)
		return FALSE

	if (shadowrun_should_lock_nonappearance_prefs(preferences))
		return FALSE

	var/job_title = params["job"]
	if (!istext(job_title) || isnull(SSjob))
		return FALSE

	var/datum/job/job = SSjob.GetJob(job_title)
	if (isnull(job) || job.faction != FACTION_STATION)
		return FALSE

	var/datum/preference/blob/job_priority/P = GLOB.preference_entries[/datum/preference/blob/job_priority]
	if (!P.can_play_job(preferences, job_title))
		return FALSE

	var/level = params["level"]
	if (istext(level))
		// Some callers may pass "null" as a string.
		if (level == "null")
			level = null
		else
			level = text2num(level)

	if (!isnull(level))
		if (!isnum(level) || !(level in list(JP_LOW, JP_MEDIUM, JP_HIGH)))
			return FALSE

	var/list/job_prefs = preferences.read_preference(P.type)

	if (level == JP_HIGH)
		var/datum/job/overflow_role = SSjob.overflow_role
		var/overflow_role_title = initial(overflow_role.title)

		for (var/other_job in job_prefs)
			if (job_prefs[other_job] == JP_HIGH)
				// Overflow role needs to go to NEVER, not medium!
				if (other_job == overflow_role_title)
					job_prefs[other_job] = null
				else
					job_prefs[other_job] = JP_MEDIUM

	if (isnull(level) || level == JP_NEVER)
		job_prefs -= job.title
	else
		job_prefs[job.title] = level

	return preferences.update_preference(P, job_prefs)

/datum/preference_middleware/jobs/proc/set_job_title(list/params, mob/user)
	if (isnull(preferences) || user?.client != preferences.parent)
		return FALSE

	if (shadowrun_should_lock_nonappearance_prefs(preferences))
		return FALSE

	var/job_title = params["job"]
	var/new_title = params["new_title"]

	if (!istext(job_title) || !istext(new_title) || isnull(SSjob))
		return FALSE

	var/datum/job/job = SSjob.GetJob(job_title)
	if (isnull(job) || !length(job.alt_titles))
		return FALSE

	if (!(new_title in job.alt_titles))
		new_title = job.alt_titles[1]

	preferences.alt_job_titles[job_title] = new_title
	preferences.character_preview_view?.update_body()

	return TRUE
