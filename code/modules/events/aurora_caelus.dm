/datum/round_event_control/aurora_caelus
	name = "Aurora Caelus"
	typepath = /datum/round_event/aurora_caelus
	max_occurrences = 1
	weight = 3
	earliest_start = 20 MINUTES

/datum/round_event_control/aurora_caelus/canSpawnEvent(players)
	if(!CONFIG_GET(flag/starlight))
		return FALSE
	return ..()

/datum/round_event/aurora_caelus
	announceWhen = 1
	startWhen = 9
	endWhen = 50
	var/list/aurora_colors = list("#A2FF80", "#A2FF8B", "#A2FF96", "#A2FFA5", "#A2FFB6", "#A2FFC7", "#A2FFDE", "#A2FFEE")
	var/aurora_progress = 0 //this cycles from 1 to 8, slowly changing colors from gentle green to gentle blue

/datum/round_event/aurora_caelus/announce()
	priority_announce(
		"[station_name()]: A geomagnetic storm is passing over the Seattle Metroplex. Renraku has approved a short break for all employees to relax and observe this rare event. During this time, city lights may flicker and the sky may shimmer in muted green-blue hues. Any staff who would like to view the lights for themselves may proceed to the nearest observation deck or atrium skylight. We hope you enjoy the lights.",
		"Seattle Metroplex Weather Service"
	)
	for(var/V in GLOB.player_list)
		var/mob/M = V
		if((M.client.prefs.toggles & SOUND_MIDI) && is_station_level(M.z))
			M.playsound_local(M, 'sound/ambience/aurora_caelus.ogg', 20, FALSE, pressure_affected = FALSE)

/datum/round_event/aurora_caelus/start()
	var/chosen_color = pick(aurora_colors)
	for(var/turf/open/space/S in world)
		var/area/A = S.loc
		if(A.area_flags & AREA_USES_STARLIGHT)
			S.set_light(l_power = S.light_power * 1.3, l_color = chosen_color)
		CHECK_TICK

/datum/round_event/aurora_caelus/end()
	priority_announce(
		"The aurora caelus event is now ending. Starlight conditions will slowly return to normal. When this has concluded, please return to your workplace and continue work as normal. Have a pleasant shift, [station_name()], and thank you for watching with us.",
		"Seattle Metroplex Weather Service"
	)
	for(var/turf/open/space/S in world)
		var/area/A = S.loc
		if(A.area_flags & AREA_USES_STARLIGHT)
			S.set_light(l_power = initial(S.light_power), l_color = global.starlight_color)
		CHECK_TICK

