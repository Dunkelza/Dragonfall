#define SR_LINK(str, cmd) "<a class='srTerminalLink' href='byond://?src=\ref[src];[cmd]'>[str]</a>"

#define NPP_TAB_MAIN "main"

/datum/new_player_panel
	var/mob/dead/new_player/parent
	var/active_tab = NPP_TAB_MAIN

/datum/new_player_panel/New(parent)
	src.parent = parent

/datum/new_player_panel/Destroy(force, ...)
	parent = null
	return ..()

/datum/new_player_panel/Topic(href, href_list[])
	if(parent != usr)
		return

	if(!parent.client)
		return


	if(href_list["verify"])
		show_otp_menu()
		return TRUE

	if(href_list["link_to_discord"])
		var/_link = CONFIG_GET(string/panic_bunker_discord_link)
		if(_link)
			parent << link(_link)
		return TRUE

	//Restricted clients can't do anything else.
	if(parent.client.restricted_mode)
		return TRUE

	if(href_list["npp_options"])
		var/datum/preferences/preferences = parent.client.prefs
		preferences.current_window = PREFERENCE_TAB_GAME_PREFERENCES
		preferences.update_static_data(usr)
		preferences.ui_interact(usr)
		return TRUE

	if(href_list["view_primer"])
		view_primer()
		return TRUE

	if(href_list["character_setup"])
		var/datum/preferences/preferences = parent.client.prefs
		// Open the TGUI character preferences window (Window.Character = 0).
		preferences.current_window = 0
		preferences.update_static_data(usr)
		preferences.ui_interact(usr)
		return TRUE

	if(href_list["ready"])
		var/tready = text2num(href_list["ready"])
		//Avoid updating ready if we're after PREGAME (they should use latejoin instead)
		//This is likely not an actual issue but I don't have time to prove that this
		//no longer is required
		if(SSticker.current_state <= GAME_STATE_PREGAME)
			if (tready == PLAYER_READY_TO_PLAY)
				var/datum/preferences/preferences = parent.client?.prefs
				if (!shadowrun_chargen_is_saved(preferences))
					to_chat(usr, span_warning("You must Save your Shadowrun character sheet before you can Ready. Open Character Setup → Core → Save Sheet."))
					parent.ready = PLAYER_NOT_READY
					update()
					return
			parent.ready = tready

		//if it's post initialisation and they're trying to observe we do the needful
		if(SSticker.current_state >= GAME_STATE_SETTING_UP && tready == PLAYER_READY_TO_OBSERVE)
			parent.ready = tready
			parent.make_me_an_observer()
			return

		update()
		return

	if(href_list["main_menu"])
		change_tab(NPP_TAB_MAIN)
		return

	if(href_list["refresh"])
		parent << browse(null, "window=playersetup") //closes the player setup window
		open()

	if(href_list["manifest"])
		show_crew_manifest(parent)
		return

	if(href_list["late_join"]) //This still exists for queue messages in chat
		if(!SSticker?.IsRoundInProgress())
			to_chat(usr, span_boldwarning("The round is either not ready, or has already finished..."))
			return
		LateChoices()
		return

	if(href_list["SelectedJob"])
		if(!SSticker?.IsRoundInProgress())
			to_chat(usr, span_danger("The round is either not ready, or has already finished..."))
			return

		var/datum/preferences/preferences = parent.client?.prefs
		if (!shadowrun_chargen_is_saved(preferences))
			to_chat(usr, span_warning("You must Save your Shadowrun character sheet before joining. Open Character Setup → Core → Save Sheet."))
			return

		if(SSlag_switch.measures[DISABLE_NON_OBSJOBS])
			to_chat(usr, span_notice("There is an administrative lock on entering the game!"))
			return

		//Determines Relevent Population Cap
		var/relevant_cap
		var/hpc = CONFIG_GET(number/hard_popcap)
		var/epc = CONFIG_GET(number/extreme_popcap)
		if(hpc && epc)
			relevant_cap = min(hpc, epc)
		else
			relevant_cap = max(hpc, epc)

		if(SSticker.queued_players.len && !(ckey(parent.key) in GLOB.admin_datums))
			if((living_player_count() >= relevant_cap) || (src != SSticker.queued_players[1]))
				to_chat(usr, span_warning("Server is full."))
				return

		parent.AttemptLateSpawn(href_list["SelectedJob"])
		return

	else if(!href_list["late_join"])
		update()

	if(href_list["showpoll"])
		parent.handle_player_polling()
		return

	if(href_list["viewpoll"])
		var/datum/poll_question/poll = locate(href_list["viewpoll"]) in GLOB.polls
		parent.poll_player(poll)

	if(href_list["votepollref"])
		var/datum/poll_question/poll = locate(href_list["votepollref"]) in GLOB.polls
		parent.vote_on_poll_handler(poll, href_list)

/datum/new_player_panel/proc/update()
	change_tab(active_tab)

/datum/new_player_panel/proc/open()
	if(parent.client?.restricted_mode)
		restricted_client_panel()
		return

	active_tab = NPP_TAB_MAIN

	var/list/output = list()
	output += npp_header()
	output += "<div id='content'>"
	output += npp_main()
	output += "</div>"

	var/datum/browser/popup = new(parent, "playersetup", "", 400, 320)
	popup.set_window_options("can_close=0;focus=false;can_resize=0")
	popup.set_content(output.Join())
	popup.open(FALSE)

/datum/new_player_panel/proc/change_tab(new_tab)
	var/content
	if(parent.client?.restricted_mode)
		restricted_client_panel()
		return

	switch(new_tab)
		if(NPP_TAB_MAIN)
			content = npp_main()
			active_tab = NPP_TAB_MAIN
		else
			return

	parent << output(url_encode(content), "playersetup.browser:update_content")

/datum/new_player_panel/proc/npp_header()
	return {"
		<style>
			@import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500;600&family=Libre+Baskerville:wght@400;700&display=swap');

			body {
				font-family: 'Jost', sans-serif;
				background: linear-gradient(135deg, #0a0a0c 0%, #151520 50%, #0d0d12 100%);
				margin: 0;
				padding: 8px;
			}

			.srTerminalPane {
				background: linear-gradient(180deg, rgba(0,0,0,0.85), rgba(10,10,15,0.95));
				border: 2px solid rgba(202, 165, 61, 0.4);
				border-left: 4px solid #caa53d;
				box-shadow: 0 0 20px rgba(0,0,0,0.5), inset 0 0 30px rgba(0,0,0,0.3);
				padding: 1rem;
				margin-bottom: 0.5rem;
			}

			.srTerminalHeader {
				font-family: 'Libre Baskerville', serif;
				color: #caa53d;
				font-size: 18px;
				letter-spacing: 0.05em;
				text-transform: uppercase;
				margin-bottom: 1rem;
				padding-bottom: 0.5rem;
				border-bottom: 1px solid rgba(202, 165, 61, 0.3);
				text-shadow: 0 0 10px rgba(202, 165, 61, 0.3);
			}

			.srTerminalContent {
				color: rgba(255,255,255,0.85);
				font-size: 14px;
				line-height: 1.8;
			}

			.srTerminalLink {
				color: rgba(255,255,255,0.7);
				text-decoration: none;
				background: linear-gradient(135deg, rgba(40,40,45,0.8), rgba(25,25,30,0.9));
				border: 1px solid rgba(255,255,255,0.15);
				padding: 0.4em 0.8em;
				margin: 0.25em 0;
				display: inline-block;
				border-radius: 2px;
				transition: all 0.15s ease;
				font-family: 'Jost', sans-serif;
			}

			.srTerminalLink:hover {
				color: #fff;
				border-color: rgba(202, 165, 61, 0.5);
				background: linear-gradient(135deg, rgba(50,50,55,0.9), rgba(35,35,40,0.95));
				box-shadow: 0 0 8px rgba(202, 165, 61, 0.2);
				text-shadow: 0 0 5px rgba(202, 165, 61, 0.3);
			}

			.srTerminalBtn {
				color: rgba(255,255,255,0.85);
				text-decoration: none;
				background: linear-gradient(135deg, rgba(40,40,45,0.9), rgba(25,25,30,0.95));
				border: 1px solid rgba(255,255,255,0.2);
				padding: 0.5em 1.2em;
				margin: 0 0.25em;
				border-radius: 2px;
				font-family: 'Jost', sans-serif;
				text-transform: uppercase;
				letter-spacing: 0.05em;
				font-size: 13px;
				transition: all 0.15s ease;
			}

			.srTerminalBtn:hover {
				color: #fff;
				border-color: rgba(202, 165, 61, 0.6);
				box-shadow: 0 0 10px rgba(202, 165, 61, 0.25);
			}

			.srTerminalBtn.active {
				background: linear-gradient(135deg, rgba(202, 165, 61, 0.3), rgba(150, 120, 40, 0.2));
				border-color: rgba(202, 165, 61, 0.7);
				color: #caa53d;
				text-shadow: 0 0 5px rgba(202, 165, 61, 0.4);
			}

			.srCharacterName {
				color: #caa53d;
				font-family: 'Libre Baskerville', serif;
				font-size: 16px;
			}

			.srStatusLabel {
				color: rgba(255,255,255,0.5);
				font-size: 12px;
				text-transform: uppercase;
				letter-spacing: 0.1em;
			}

			.srStatusValue {
				color: rgba(255,255,255,0.8);
			}

			.srDivider {
				border: none;
				border-top: 1px solid rgba(255,255,255,0.08);
				margin: 0.75rem 0;
			}

			.srReadyBar {
				display: flex;
				justify-content: center;
				gap: 0.5rem;
				padding: 0.75rem;
				background: rgba(0,0,0,0.3);
				border-radius: 2px;
			}
		</style>
		<script type='text/javascript'>
			function fillInput(text){
				const elem = document.getElementById('input');
				if(elem) elem.innerHTML = text;
			}

			function update_content(data){
				document.getElementById('content').innerHTML = data;
			}

			function byondCall(cmd){
				window.location = 'byond://?src=[ref(src)];' + cmd;
			}
		</script>
	"}

/datum/new_player_panel/proc/npp_main()
	var/list/output = list()
	var/name = parent.client?.prefs.read_preference(/datum/preference/name/real_name)

	var/poll = playerpolls()
	if(!is_guest_key(parent.client.key) && poll)
		poll = "<div style='margin-top: 0.5rem'>[SR_LINK(poll, "showpoll=1")]</div>"

	var/status_text = "Idle"
	var/status_class = ""
	if(SSticker.current_state <= GAME_STATE_PREGAME)
		switch(parent.ready)
			if(PLAYER_NOT_READY)
				status_text = "Not Ready"
			if(PLAYER_READY_TO_PLAY)
				status_text = "Ready"
				status_class = "color: #03fca1;"
			if(PLAYER_READY_TO_OBSERVE)
				status_text = "Observing"
				status_class = "color: #615b7d;"

	output += {"
		<div class='srTerminalPane'>
			<div class='srTerminalHeader'>
				Runner Terminal
			</div>
			<div class='srTerminalContent'>
				<div style='margin-bottom: 0.75rem'>
					<span class='srStatusLabel'>Identity:</span>
					<span class='srCharacterName'>[name]</span>
				</div>
				<div style='margin-bottom: 0.75rem'>
					<span class='srStatusLabel'>Status:</span>
					<span class='srStatusValue' style='[status_class]'>[status_text]</span>
				</div>
				<hr class='srDivider'>
				<div style='display: flex; flex-direction: column; gap: 0.25rem'>
					[SR_LINK("&#9654; Character Dossier", "character_setup=1")]
					[SR_LINK("&#9881; Game Options", "npp_options=1")]
					[SR_LINK("&#9432; Location Briefing", "view_primer=1")]
				</div>
				[poll]
			</div>
		</div>
	"}

	output += join_or_ready()

	return jointext(output, "")

/datum/new_player_panel/proc/join_or_ready()
	var/list/output = list()

	if(SSticker.current_state > GAME_STATE_PREGAME)
		output += {"
			<div class='srReadyBar'>
				[SR_LINK("Join Game", "late_join=1")]
				[SR_LINK("Observe", "ready=[PLAYER_READY_TO_OBSERVE]")]
				[SR_LINK("View Manifests", "manifest=1")]
			</div>
		"}
	else
		output += "<div class='srReadyBar'>"
		switch(parent.ready)
			if(PLAYER_NOT_READY)
				output += "<a class='srTerminalBtn' href='byond://?src=\ref[src];ready=[PLAYER_READY_TO_PLAY]'>Ready</a>"
				output += "<a class='srTerminalBtn active' href='byond://?src=\ref[src];ready=[PLAYER_NOT_READY]'>Not Ready</a>"
				output += "<a class='srTerminalBtn' href='byond://?src=\ref[src];ready=[PLAYER_READY_TO_OBSERVE]'>Observe</a>"
			if(PLAYER_READY_TO_PLAY)
				output += "<a class='srTerminalBtn active' href='byond://?src=\ref[src];ready=[PLAYER_READY_TO_PLAY]'>Ready</a>"
				output += "<a class='srTerminalBtn' href='byond://?src=\ref[src];ready=[PLAYER_NOT_READY]'>Not Ready</a>"
				output += "<a class='srTerminalBtn' href='byond://?src=\ref[src];ready=[PLAYER_READY_TO_OBSERVE]'>Observe</a>"
			if(PLAYER_READY_TO_OBSERVE)
				output += "<a class='srTerminalBtn' href='byond://?src=\ref[src];ready=[PLAYER_READY_TO_PLAY]'>Ready</a>"
				output += "<a class='srTerminalBtn' href='byond://?src=\ref[src];ready=[PLAYER_NOT_READY]'>Not Ready</a>"
				output += "<a class='srTerminalBtn active' href='byond://?src=\ref[src];ready=[PLAYER_READY_TO_OBSERVE]'>Observe</a>"
		output += "</div>"

	return jointext(output, "")

/datum/new_player_panel/proc/restricted_client_panel()
	var/content = {"
		[npp_header()]
		<div class='srTerminalPane'>
			<div class='srTerminalHeader'>
				Access Restricted
			</div>
			<div class='srTerminalContent' style='text-align: center'>
				<p>Welcome to the Renraku Arcology Test Server</p>
				<p style='color: rgba(255,255,255,0.6)'>Discord verification is required to access this host.</p>
				<div style='margin-top: 1rem'>
					[SR_LINK("Verify Identity", "verify=1")]
				</div>
			</div>
		</div>
	"}

	var/datum/browser/popup = new(parent, "playersetup", "", 480, 280)
	popup.set_window_options("can_close=0;focus=false;can_resize=0")
	popup.set_content(content)
	popup.open(FALSE)

/datum/new_player_panel/proc/show_otp_menu()
	if(!parent.client)
		return

	if(!CONFIG_GET(flag/sql_enabled))
		alert(parent.client, "No database to link to, bud. Scream at the host.", "Writing to Nowhere.")
		return

	if(isnull(parent.client.linked_discord_account))
		alert(parent.client, "You haven't fully loaded, please wait...", "Please Wait")
		return

	if(parent.client.linked_discord_account?.valid)
		alert(parent.client, "Your discord account is already linked.\nIf you believe this is in error, please contact staff.\nLinked ID: [parent.client.linked_discord_account.discord_id]", "Already Linked")
		return

	var/discord_otp = parent.client.discord_get_or_generate_one_time_token_for_ckey(parent.ckey)
	var/discord_prefix = CONFIG_GET(string/discordbotcommandprefix)
	var/browse_body = {"
		<center>
		<span style='color:red'>Your One-Time-Password is:<br> [discord_otp]</span>
		<br><br>
		To link your Discord account, head to the Discord Server and make an entry ticket if you have not already. Then, paste the following into any channel:
		<hr/>
		</center>
		<code>
			[discord_prefix]verify [discord_otp]
		</code>
		<hr/>
		<center>[button_element(src, "Discord", "link_to_discord=1")]
		<br>
	"}

	var/datum/browser/popup = new(parent, "discordauth", "<center><div>Verification</div></center>", 660, 270)
	//If we aren't in restricted mode, let them close the window.
	popup.set_window_options("can_close=[!parent.client.restricted_mode];focus=true;can_resize=0")
	popup.set_content(browse_body)
	popup.open()

/datum/new_player_panel/proc/view_primer()
	var/content = {"
	<div class='newspaper' style='height: 600px'>
		<div class='newspaper_header'>
			The Colony Echo
		</div>
		<div class='newspaper_headline'>
			FEDERATION SIEZES CONTROL OF [uppertext(station_name())]
		</div>
		<div class='content'>
			<div class='columns'>
				<div class='column'>
					<div class='headline'>
						The Federation Menace
					</div>
					<div class='headline subhead'>
						An ill omen of what is to come?
					</div>
					The Minervan Federation has come aboard our humble remote colony and declared a state of emergency. They brought with them
					a <u>praetorian guard</u> in the form of mercenaries from the Mars People's Coalition. Their "Superintendent" proclaims himself the representative of the Federation's will.
					Not more than 72 hours ago were we enjoying peace on our station, what does this mean for our people?
				</div>
				<div class='column'>
					<div class='headline'>
						Our Humble Colony
					</div>
					<div class='headline subhead'>
						By Stage Hand
					</div>
					Many years have passed since the old company pulled out of the colony, such that not one soul remembers their name nor iconography.
					Now we may enjoy our seclusion and the privacy it bestows, fresh faces only arriving on trade shuttles that venture out to the pool's edge.
				</div>
			</div>
		</div>
	</div>
	"}

	var/datum/browser/popup = new(parent, "primer", "", 900, 600)
	popup.set_content(content)
	popup.add_stylesheet("roundend", 'html/browser/primer.css')

	var/google_font_shim = {"
	<link rel="preconnect" href="https://fonts.googleapis.com">
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
	<link href="https://fonts.googleapis.com/css2?family=Notable&family=Pirata+One&family=Playfair+Display:ital,wght@0,400..900;1,400..900&family=Quantico:ital,wght@0,400;0,700;1,400;1,700&family=Special+Elite&display=swap" rel="stylesheet">
	"}
	popup.add_head_content(google_font_shim)
	popup.open()

/datum/new_player_panel/proc/playerpolls()
	if (!SSdbcore.Connect())
		return

	var/isadmin = FALSE
	if(parent.client?.holder)
		isadmin = TRUE

	var/datum/db_query/query_get_new_polls = SSdbcore.NewQuery({"
		SELECT id FROM [format_table_name("poll_question")]
		WHERE (adminonly = 0 OR :isadmin = 1)
		AND Now() BETWEEN starttime AND endtime
		AND deleted = 0
		AND id NOT IN (
			SELECT pollid FROM [format_table_name("poll_vote")]
			WHERE ckey = :ckey
			AND deleted = 0
		)
		AND id NOT IN (
			SELECT pollid FROM [format_table_name("poll_textreply")]
			WHERE ckey = :ckey
			AND deleted = 0
		)
	"}, list("isadmin" = isadmin, "ckey" = parent.ckey))

	if(!query_get_new_polls.Execute())
		qdel(query_get_new_polls)
		return

	if(query_get_new_polls.NextRow())
		. = "polls.exe (new!)"
	else
		. = "polls.exe"

	qdel(query_get_new_polls)
	if(QDELETED(src))
		return null

	return .

/datum/new_player_panel/proc/LateChoices()
	var/list/dat = list()
	if(SSlag_switch.measures[DISABLE_NON_OBSJOBS])
		dat += "<div class='notice red' style='font-size: 125%'>Only Observers may join at this time.</div><br>"

	dat += "<div class='notice'>Round Duration: [DisplayTimeText(world.time - SSticker.round_start_time)]</div>"

	if(SSshuttle.emergency)
		switch(SSshuttle.emergency.mode)
			if(SHUTTLE_ESCAPE)
				dat += "<div class='notice red'>The station has been evacuated.</div><br>"
			if(SHUTTLE_CALL)
				if(!SSshuttle.canRecall())
					dat += "<div class='notice red'>The station is currently undergoing evacuation procedures.</div><br>"

	for(var/datum/job/prioritized_job in SSjob.prioritized_jobs)
		if(prioritized_job.current_positions >= prioritized_job.total_positions)
			SSjob.prioritized_jobs -= prioritized_job

	var/department_counter = 0
	var/list/column_list = list(list())
	for(var/datum/job_department/department as anything in SSjob.departments)
		if(department.exclude_from_latejoin)
			continue

		var/list/current_column = column_list[length(column_list)]
		var/list/dept_data = list()

		var/department_color = department.latejoin_color
		dept_data += {"
			<fieldset style='border: 2px solid [department_color];'>
				<legend align='center' style='color: [department_color]'>[department.department_name]</legend>
				<div class='flexColumn'>
		"}


		var/list/job_data = list()
		for(var/datum/job/job_datum as anything in department.department_jobs)
			if(parent.IsJobUnavailable(job_datum.title, TRUE) != JOB_AVAILABLE)
				continue

			var/command_bold = ""
			if(job_datum.departments_bitflags & DEPARTMENT_BITFLAG_COMPANY_LEADER)
				command_bold = " command"

			if(job_datum in SSjob.prioritized_jobs)
				job_data += "<a class='genericLink job[command_bold]' href='byond://?src=[REF(src)];SelectedJob=[job_datum.title]'><span class='priority'>[job_datum.title] ([job_datum.current_positions])</span></a>"
			else
				job_data += "<a class='genericLink job[command_bold]' href='byond://?src=[REF(src)];SelectedJob=[job_datum.title]'>[job_datum.title] ([job_datum.current_positions])</a>"

		if(length(job_data))
			dept_data += job_data
		else
			dept_data += "<div class='nopositions'>No positions open.</div>"

		dept_data += "</div></fieldset>"
		current_column += dept_data.Join()

		department_counter++
		if(department_counter > 0 && (department_counter % 3 == 0))
			column_list[++column_list.len] = list()

	dat += {"
		<div style='display: grid; grid-template-columns: repeat(auto-fill, [round(100 / length(column_list), 1)]%);justify-content: center;'>
	"}
	for(var/list/column_data in column_list)
		if(!length(column_data))
			break

		dat += {"
			<div class='flexColumn'>
				[column_data.Join()]
			</div>
		"}

	dat += {"
		</div>
		"}

	var/datum/browser/popup = new(parent, "latechoices", "Choose Profession", 680, 580)
	popup.add_stylesheet("playeroptions", 'html/browser/playeroptions.css')
	popup.set_content(jointext(dat, ""))
	popup.open(FALSE) // 0 is passed to open so that it doesn't use the onclose() proc

#undef SR_LINK
#undef NPP_TAB_MAIN
