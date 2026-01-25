// Shadowrun 5e Negative Qualities
// These qualities provide karma but come with significant drawbacks
// Karma values are positive because negative qualities GIVE karma

/datum/quirk/addiction_mild
	name = "Addiction (Mild)"
	desc = "You have a mild addiction to a substance. Periodic cravings cause minor discomfort."
	icon = "pills"
	quirk_genre = QUIRK_GENRE_BANE
	karma_value = 4 // SR5: 4 karma
	quirk_flags = QUIRK_HUMAN_ONLY|QUIRK_PROCESSES
	gain_text = "<span class='warning'>You feel a craving gnawing at you.</span>"
	lose_text = "<span class='notice'>The cravings finally subside.</span>"
	medical_record_text = "Patient has documented substance dependency (mild)."
	var/next_craving = 0
	var/craving_interval = 10 MINUTES

/datum/quirk/addiction_mild/process(delta_time)
	if(world.time < next_craving)
		return
	next_craving = world.time + craving_interval
	if(DT_PROB(15, delta_time))
		to_chat(quirk_holder, span_warning("You feel a familiar craving..."))
		quirk_holder.adjust_jitter(5 SECONDS)

/datum/quirk/addiction_moderate
	name = "Addiction (Moderate)"
	desc = "You have a moderate addiction. Withdrawal causes physical discomfort, jitters, and distraction."
	icon = "syringe"
	quirk_genre = QUIRK_GENRE_BANE
	karma_value = 9 // SR5: 9 karma
	quirk_flags = QUIRK_HUMAN_ONLY|QUIRK_PROCESSES
	gain_text = "<span class='warning'>Your body demands its fix.</span>"
	lose_text = "<span class='notice'>You've finally kicked the habit.</span>"
	medical_record_text = "Patient has documented substance dependency (moderate)."
	var/next_craving = 0
	var/craving_interval = 5 MINUTES

/datum/quirk/addiction_moderate/process(delta_time)
	if(world.time < next_craving)
		return
	next_craving = world.time + craving_interval
	if(DT_PROB(25, delta_time))
		to_chat(quirk_holder, span_warning("Your body aches for a fix..."))
		quirk_holder.adjust_jitter(10 SECONDS)
		quirk_holder.adjust_dizzy(5 SECONDS)

/datum/quirk/addiction_severe
	name = "Addiction (Severe)"
	desc = "You have a severe addiction. Withdrawal causes significant physical and mental distress, stuttering, and confusion."
	icon = "skull-crossbones"
	quirk_genre = QUIRK_GENRE_BANE
	karma_value = 15 // SR5: 15 karma
	quirk_flags = QUIRK_HUMAN_ONLY|QUIRK_PROCESSES
	gain_text = "<span class='boldwarning'>Your addiction claws at your very soul.</span>"
	lose_text = "<span class='notice'>Against all odds, you've broken free.</span>"
	medical_record_text = "Patient has documented severe substance dependency. Monitor closely."
	var/next_craving = 0
	var/craving_interval = 3 MINUTES

/datum/quirk/addiction_severe/process(delta_time)
	if(world.time < next_craving)
		return
	next_craving = world.time + craving_interval
	if(DT_PROB(35, delta_time))
		to_chat(quirk_holder, span_boldwarning("Your entire being screams for a fix!"))
		quirk_holder.adjust_jitter(20 SECONDS)
		quirk_holder.adjust_stutter(10 SECONDS)
		quirk_holder.adjust_confusion(3 SECONDS)

/datum/quirk/allergy_uncommon
	name = "Allergy (Uncommon)"
	desc = "You have an allergy to an uncommon substance. Exposure causes discomfort and reactions."
	icon = "allergies"
	quirk_genre = QUIRK_GENRE_BANE
	karma_value = 5 // SR5: 5 karma (mild/uncommon)
	gain_text = "<span class='warning'>You feel your immune system is oversensitive.</span>"
	lose_text = "<span class='notice'>Your allergy seems to have cleared up.</span>"
	medical_record_text = "Patient has documented allergy to uncommon allergen."

/datum/quirk/allergy_common
	name = "Allergy (Common)"
	desc = "You have an allergy to a common substance. Random allergic reactions cause jitters and sneezing."
	icon = "allergies"
	quirk_genre = QUIRK_GENRE_BANE
	karma_value = 10 // SR5: 10 karma (mild/common)
	quirk_flags = QUIRK_HUMAN_ONLY|QUIRK_PROCESSES
	gain_text = "<span class='warning'>Common substances make you feel unwell.</span>"
	lose_text = "<span class='notice'>Your allergy seems to have cleared up.</span>"
	medical_record_text = "Patient has documented severe allergy to common allergen."

/datum/quirk/allergy_common/process(delta_time)
	if(DT_PROB(2, delta_time))
		to_chat(quirk_holder, span_warning("Your allergies are acting up..."))
		quirk_holder.adjust_jitter(5 SECONDS)
		quirk_holder.emote("sneeze")

/datum/quirk/bad_luck
	name = "Bad Luck"
	desc = "Fortune never seems to favor you. Critical failures happen more often."
	icon = "dice"
	quirk_genre = QUIRK_GENRE_BANE
	karma_value = 12 // SR5: 12 karma
	mob_trait = TRAIT_BAD_LUCK
	gain_text = "<span class='warning'>You feel a sense of impending misfortune.</span>"
	lose_text = "<span class='notice'>The cloud of bad luck lifts.</span>"
	medical_record_text = "Patient reports persistent feelings of misfortune."

// TRAIT_BAD_LUCK increases glitch/crit fail chances in skill checks

/datum/quirk/item_quirk/blind
	name = "Blind"
	desc = "You cannot see. At all. The world exists only through sound, touch, and smell."
	icon = "eye-slash"
	quirk_genre = QUIRK_GENRE_BANE
	karma_value = 20 // Major disability
	gain_text = "<span class='warning'>Darkness surrounds you completely.</span>"
	lose_text = "<span class='notice'>Miraculously, your sight returns.</span>"
	medical_record_text = "Patient has total vision loss."
	quirk_flags = QUIRK_HUMAN_ONLY|QUIRK_CHANGES_APPEARANCE

/datum/quirk/item_quirk/blind/add_unique(client/client_source)
	give_item_to_holder(/obj/item/clothing/glasses/blindfold/white, list(LOCATION_EYES = ITEM_SLOT_EYES, LOCATION_BACKPACK = ITEM_SLOT_BACKPACK, LOCATION_HANDS = ITEM_SLOT_HANDS))

/datum/quirk/item_quirk/blind/add()
	quirk_holder.become_blind(QUIRK_TRAIT)

/datum/quirk/item_quirk/blind/remove()
	quirk_holder.cure_blind(QUIRK_TRAIT)

/datum/quirk/deaf
	name = "Deaf"
	desc = "You cannot hear. The world is silent to you."
	icon = "deaf"
	quirk_genre = QUIRK_GENRE_BANE
	karma_value = 15 // Major disability
	mob_trait = TRAIT_DEAF
	gain_text = "<span class='warning'>Silence envelops you completely.</span>"
	lose_text = "<span class='notice'>Sound returns to your world.</span>"
	medical_record_text = "Patient has total hearing loss."

/datum/quirk/combat_paralysis
	name = "Combat Paralysis"
	desc = "You freeze up in dangerous situations. When hurt, you may be briefly stunned."
	icon = "snowflake"
	quirk_genre = QUIRK_GENRE_BANE
	karma_value = 12 // SR5: 12 karma
	mob_trait = TRAIT_COMBAT_PARALYSIS
	gain_text = "<span class='warning'>You feel a chill when thinking about danger.</span>"
	lose_text = "<span class='notice'>You feel more confident facing threats.</span>"
	medical_record_text = "Patient exhibits acute stress response in threatening situations."

/datum/quirk/combat_paralysis/add()
	RegisterSignal(quirk_holder, COMSIG_MOB_AFTER_APPLY_DAMAGE, PROC_REF(check_freeze))

/datum/quirk/combat_paralysis/remove()
	UnregisterSignal(quirk_holder, COMSIG_MOB_AFTER_APPLY_DAMAGE)

/datum/quirk/combat_paralysis/proc/check_freeze(datum/source, damage_dealt, damagetype, def_zone)
	SIGNAL_HANDLER
	if(damage_dealt >= 10 && prob(25))
		INVOKE_ASYNC(src, PROC_REF(do_freeze))

/datum/quirk/combat_paralysis/proc/do_freeze()
	to_chat(quirk_holder, span_danger("You freeze up in panic!"))
	quirk_holder.Stun(1.5 SECONDS)

/datum/quirk/distinctive_style
	name = "Distinctive Style"
	desc = "You have an unmistakable appearance. People remember you easily - forensics find you faster."
	icon = "star"
	quirk_genre = QUIRK_GENRE_BANE
	karma_value = 5 // SR5: 5 karma
	mob_trait = TRAIT_DISTINCTIVE
	gain_text = "<span class='warning'>You stand out in a crowd.</span>"
	lose_text = "<span class='notice'>You blend in better now.</span>"
	medical_record_text = "Patient has highly distinctive physical characteristics."

// TRAIT_DISTINCTIVE makes forensic evidence easier to trace

/datum/quirk/elf_poser
	name = "Elf Poser"
	desc = "You desperately wish you were an elf. Your attempts to act elven are obvious and embarrassing to real elves."
	icon = "leaf"
	quirk_genre = QUIRK_GENRE_BANE
	karma_value = 6 // SR5: 6 karma
	gain_text = "<span class='warning'>You feel an inexplicable longing for elvish grace.</span>"
	lose_text = "<span class='notice'>You come to terms with who you are.</span>"
	medical_record_text = "Patient exhibits species dysphoria (elvish idealization)."

// Social roleplay quality - elves may react negatively

/datum/quirk/ork_poser
	name = "Ork Poser"
	desc = "You desperately wish you were an ork. Your attempts to act orkish are obvious and offensive to real orks."
	icon = "fist-raised"
	quirk_genre = QUIRK_GENRE_BANE
	karma_value = 6 // SR5: 6 karma
	gain_text = "<span class='warning'>You feel an inexplicable longing for orkish strength.</span>"
	lose_text = "<span class='notice'>You come to terms with who you are.</span>"
	medical_record_text = "Patient exhibits species dysphoria (orkish idealization)."

// Social roleplay quality - orks may react negatively

/datum/quirk/gremlins
	name = "Gremlins"
	desc = "Technology malfunctions around you. Electronics have a chance to fail when you use them."
	icon = "bug"
	quirk_genre = QUIRK_GENRE_BANE
	karma_value = 4 // SR5: 4 karma (rank 1)
	mob_trait = TRAIT_GREMLINS
	gain_text = "<span class='warning'>Technology seems to shudder in your presence.</span>"
	lose_text = "<span class='notice'>Devices stop acting up around you.</span>"
	medical_record_text = "Patient reports persistent technology failures. Possibly psychosomatic."

// TRAIT_GREMLINS is checked in electronics use code to cause random failures

/datum/quirk/incompetent
	name = "Incompetent"
	desc = "You are notably bad at a particular category of tasks. -2 dice to a chosen skill group."
	icon = "thumbs-down"
	quirk_genre = QUIRK_GENRE_BANE
	karma_value = 5 // SR5: 5 karma
	mob_trait = TRAIT_INCOMPETENT
	gain_text = "<span class='warning'>You feel a distinct lack of ability.</span>"
	lose_text = "<span class='notice'>Your incompetence fades.</span>"
	medical_record_text = "Patient demonstrates significant skill deficiency."

// TRAIT_INCOMPETENT applies penalty to chosen skill group

/datum/quirk/insomnia
	name = "Insomnia"
	desc = "You have difficulty sleeping. Rest takes longer and is less effective."
	icon = "bed"
	quirk_genre = QUIRK_GENRE_BANE
	karma_value = 4 // SR5: 4 karma
	mob_trait = TRAIT_INSOMNIA
	gain_text = "<span class='warning'>Sleep seems to elude you.</span>"
	lose_text = "<span class='notice'>You can finally rest properly.</span>"
	medical_record_text = "Patient has documented chronic insomnia."

// TRAIT_INSOMNIA is checked in sleep/rest code

/datum/quirk/low_pain_tolerance
	name = "Low Pain Tolerance"
	desc = "Pain affects you more severely. You enter critical condition sooner."
	icon = "heart-crack"
	quirk_genre = QUIRK_GENRE_BANE
	karma_value = 9 // SR5: 9 karma
	mob_trait = TRAIT_LOW_PAIN_TOLERANCE
	gain_text = "<span class='warning'>Every ache feels magnified.</span>"
	lose_text = "<span class='notice'>Pain becomes more manageable.</span>"
	medical_record_text = "Patient has abnormally low pain threshold."

/datum/quirk/low_pain_tolerance/add()
	var/mob/living/L = quirk_holder
	L.crit_threshold += 15 // Enter crit 15 damage sooner

/datum/quirk/low_pain_tolerance/remove()
	var/mob/living/L = quirk_holder
	L.crit_threshold -= 15

/datum/quirk/item_quirk/nearsighted
	name = "Nearsighted"
	desc = "Your vision is blurry without corrective lenses. You need glasses to see clearly at distance."
	icon = "glasses"
	quirk_genre = QUIRK_GENRE_BANE
	karma_value = 3 // Minor disability, correctable
	gain_text = "<span class='warning'>Things in the distance become blurry.</span>"
	lose_text = "<span class='notice'>Your vision clears.</span>"
	medical_record_text = "Patient requires corrective lenses for myopia."
	quirk_flags = QUIRK_HUMAN_ONLY|QUIRK_CHANGES_APPEARANCE
	var/glasses

/datum/quirk/item_quirk/nearsighted/add_unique(client/client_source)
	glasses = client_source?.prefs.read_preference(/datum/preference/choiced/glasses) || "Regular"
	switch(glasses)
		if ("Thin")
			glasses = /obj/item/clothing/glasses/regular/thin
		if ("Circle")
			glasses = /obj/item/clothing/glasses/regular/circle
		if ("Hipster")
			glasses = /obj/item/clothing/glasses/regular/hipster
		else
			glasses = /obj/item/clothing/glasses/regular

	give_item_to_holder(glasses, list(LOCATION_EYES = ITEM_SLOT_EYES, LOCATION_BACKPACK = ITEM_SLOT_BACKPACK, LOCATION_HANDS = ITEM_SLOT_HANDS))

/datum/quirk/item_quirk/nearsighted/add()
	quirk_holder.become_nearsighted(QUIRK_TRAIT)

/datum/quirk/item_quirk/nearsighted/remove()
	quirk_holder.cure_nearsighted(QUIRK_TRAIT)

/datum/quirk/paraplegic
	name = "Paraplegic"
	desc = "You have lost the use of your legs. You require a wheelchair to move."
	icon = "wheelchair"
	quirk_genre = QUIRK_GENRE_BANE
	karma_value = 25 // Severe disability
	quirk_flags = QUIRK_HUMAN_ONLY
	gain_text = null
	lose_text = null
	medical_record_text = "Patient has irreversible lower body paralysis."

/datum/quirk/paraplegic/add_unique(client/client_source)
	if(quirk_holder.buckled)
		quirk_holder.buckled.unbuckle_mob(quirk_holder)

	var/turf/holder_turf = get_turf(quirk_holder)
	var/obj/structure/chair/spawn_chair = locate() in holder_turf

	var/obj/vehicle/ridden/wheelchair/wheels = new(holder_turf)
	if(spawn_chair)
		wheels.setDir(spawn_chair.dir)

	wheels.buckle_mob(quirk_holder)

	for(var/obj/item/dropped_item in holder_turf)
		if(dropped_item.fingerprintslast == quirk_holder.ckey)
			quirk_holder.put_in_hands(dropped_item)

/datum/quirk/paraplegic/add()
	var/mob/living/carbon/human/human_holder = quirk_holder
	human_holder.gain_trauma(/datum/brain_trauma/severe/paralysis/paraplegic, TRAUMA_RESILIENCE_ABSOLUTE)

/datum/quirk/paraplegic/remove()
	var/mob/living/carbon/human/human_holder = quirk_holder
	human_holder.cure_trauma_type(/datum/brain_trauma/severe/paralysis/paraplegic, TRAUMA_RESILIENCE_ABSOLUTE)

/datum/quirk/prejudiced
	name = "Prejudiced"
	desc = "You harbor strong negative feelings toward a particular group. This affects your social interactions."
	icon = "angry"
	quirk_genre = QUIRK_GENRE_BANE
	karma_value = 5 // SR5: 5 karma (biased level)
	mob_trait = TRAIT_PREJUDICED
	gain_text = "<span class='warning'>You feel a deep-seated resentment.</span>"
	lose_text = "<span class='notice'>Your prejudice begins to fade.</span>"
	medical_record_text = "Patient exhibits biased attitudes. Recommend counseling."

/datum/quirk/simsense_vertigo
	name = "Simsense Vertigo"
	desc = "Virtual reality and simsense make you sick. AR/VR use causes nausea and disorientation."
	icon = "vr-cardboard"
	quirk_genre = QUIRK_GENRE_BANE
	karma_value = 5 // SR5: 5 karma
	mob_trait = TRAIT_SIMSENSE_VERTIGO
	gain_text = "<span class='warning'>The thought of VR makes you queasy.</span>"
	lose_text = "<span class='notice'>Virtual spaces no longer bother you.</span>"
	medical_record_text = "Patient has severe adverse reaction to simsense/VR technology."

/datum/quirk/sinner
	name = "SINner"
	desc = "You have a legal SIN on record. While this grants legal status, it also makes you easily trackable."
	icon = "id-card"
	quirk_genre = QUIRK_GENRE_BANE
	karma_value = 5 // SR5: 5 karma (national SIN)
	mob_trait = TRAIT_SINNER
	gain_text = "<span class='warning'>Your identity is on record. Everywhere.</span>"
	lose_text = "<span class='notice'>Your SIN has been erased from the system.</span>"
	medical_record_text = "Patient has verified SIN on corporate/government record."

/datum/quirk/social_stress
	name = "Social Stress"
	desc = "Social situations cause you significant anxiety. Being around 3+ people causes stuttering."
	icon = "users-slash"
	quirk_genre = QUIRK_GENRE_BANE
	karma_value = 8 // SR5: 8 karma (moderate)
	mob_trait = TRAIT_SOCIAL_ANXIETY
	quirk_flags = QUIRK_HUMAN_ONLY|QUIRK_PROCESSES
	gain_text = "<span class='warning'>People make you nervous.</span>"
	lose_text = "<span class='notice'>Social situations feel easier.</span>"
	medical_record_text = "Patient has documented social anxiety disorder."

/datum/quirk/social_stress/process(delta_time)
	var/people_nearby = 0
	for(var/mob/living/L in view(3, quirk_holder))
		if(L != quirk_holder)
			people_nearby++

	if(people_nearby >= 3 && DT_PROB(5, delta_time))
		to_chat(quirk_holder, span_warning("There are so many people around..."))
		quirk_holder.adjust_stutter(5 SECONDS)

/datum/quirk/spirit_bane
	name = "Spirit Bane"
	desc = "Spirits are hostile to you. Summoned spirits may attack you on sight."
	icon = "ghost"
	quirk_genre = QUIRK_GENRE_BANE
	karma_value = 7 // SR5: 7 karma
	mob_trait = TRAIT_SPIRIT_BANE
	gain_text = "<span class='warning'>You feel a chill from the astral.</span>"
	lose_text = "<span class='notice'>Spirits no longer seem to despise you.</span>"
	medical_record_text = "Patient reports negative interactions with spiritual entities."

// TRAIT_SPIRIT_BANE is checked in spirit/summon code

/datum/quirk/uncouth
	name = "Uncouth"
	desc = "You have no social graces. -2 dice penalty to all social skill checks."
	icon = "hand-middle-finger"
	quirk_genre = QUIRK_GENRE_BANE
	karma_value = 8 // SR5: 8 karma
	mob_trait = TRAIT_UNCOUTH
	gain_text = "<span class='warning'>Subtlety was never your strong suit.</span>"
	lose_text = "<span class='notice'>You develop some social awareness.</span>"
	medical_record_text = "Patient demonstrates poor social skills."

// TRAIT_UNCOUTH applies -2 dice penalty to social skills

/datum/quirk/unsteady_hands
	name = "Unsteady Hands"
	desc = "Your hands tremble slightly. Surgery and precision tasks take longer."
	icon = "hand-sparkles"
	quirk_genre = QUIRK_GENRE_BANE
	karma_value = 4 // Minor disability
	mob_trait = TRAIT_UNSTEADY_HANDS
	quirk_flags = QUIRK_HUMAN_ONLY|QUIRK_PROCESSES
	gain_text = "<span class='warning'>Your hands won't stay still.</span>"
	lose_text = "<span class='notice'>Your hands steady.</span>"
	medical_record_text = "Patient exhibits essential tremor."

/datum/quirk/unsteady_hands/process(delta_time)
	if(DT_PROB(3, delta_time))
		quirk_holder.adjust_jitter(2 SECONDS)

/datum/quirk/weak_immune_system
	name = "Weak Immune System"
	desc = "Your immune system is compromised. You take 25% more toxin damage."
	icon = "biohazard"
	quirk_genre = QUIRK_GENRE_BANE
	karma_value = 5 // Minor disability
	mob_trait = TRAIT_WEAK_IMMUNE
	gain_text = "<span class='warning'>You feel vulnerable to illness.</span>"
	lose_text = "<span class='notice'>Your immune system strengthens.</span>"
	medical_record_text = "Patient has documented immunodeficiency."

/datum/quirk/weak_immune_system/add()
	RegisterSignal(quirk_holder, COMSIG_MOB_APPLY_DAMAGE_MODIFIERS, PROC_REF(weak_immunity))

/datum/quirk/weak_immune_system/remove()
	UnregisterSignal(quirk_holder, COMSIG_MOB_APPLY_DAMAGE_MODIFIERS)

/datum/quirk/weak_immune_system/proc/weak_immunity(datum/source, list/damage_mods, damage_amount, damagetype, def_zone, sharpness, attack_direction, obj/item/attacking_item)
	SIGNAL_HANDLER
	if(damagetype == TOX)
		damage_mods += 1.25 // 25% more toxin damage

/datum/quirk/flashbacks
	name = "Flashbacks"
	desc = "Traumatic memories occasionally surface, causing brief stuns and confusion."
	icon = "bolt"
	quirk_genre = QUIRK_GENRE_BANE
	karma_value = 6 // Moderate disability
	quirk_flags = QUIRK_HUMAN_ONLY|QUIRK_PROCESSES
	gain_text = "<span class='warning'>Dark memories lurk at the edge of your consciousness.</span>"
	lose_text = "<span class='notice'>The flashbacks finally stop.</span>"
	medical_record_text = "Patient exhibits symptoms of PTSD. Recommend trauma counseling."

/datum/quirk/flashbacks/process(delta_time)
	if(quirk_holder.stat >= UNCONSCIOUS)
		return

	if(DT_PROB(1, delta_time))
		to_chat(quirk_holder, span_boldwarning("A traumatic memory flashes before your eyes!"))
		quirk_holder.Stun(1 SECONDS)
		quirk_holder.adjust_confusion(3 SECONDS)

// Legacy quirks for compatibility with existing code

/datum/quirk/heterochromatic
	name = "Heterochromia Iridum"
	desc = "Your eyes are two different colors."
	icon = "eye"
	quirk_genre = QUIRK_GENRE_NEUTRAL
	quirk_flags = QUIRK_HUMAN_ONLY|QUIRK_CHANGES_APPEARANCE
	gain_text = "<span class='notice'>You see the world through mismatched eyes.</span>"
	lose_text = "<span class='notice'>Your eyes match again.</span>"
	medical_record_text = "Patient has heterochromia iridum."
	var/color

/datum/quirk/heterochromatic/add_unique(client/client_source)
	color = client_source?.prefs?.read_preference(/datum/preference/color/heterochromatic)
	link_to_holder()

/datum/quirk/heterochromatic/proc/link_to_holder()
	if(!ishuman(quirk_holder))
		return
	var/mob/living/carbon/human/human_holder = quirk_holder
	if(color)
		human_holder.eye_color_right = color
		human_holder.update_body()

/datum/quirk/item_quirk/allergic
	name = "Extreme Allergy"
	desc = "You are extremely allergic to a specific chemical. Exposure causes severe reactions."
	icon = "allergies"
	quirk_genre = QUIRK_GENRE_BANE
	karma_value = 15 // Severe allergy
	quirk_flags = QUIRK_HUMAN_ONLY|QUIRK_PROCESSES
	gain_text = "<span class='warning'>You feel your immune system on high alert.</span>"
	lose_text = "<span class='notice'>Your extreme allergy fades.</span>"
	medical_record_text = "Patient has documented severe chemical allergy."
	var/list/allergies
	var/allergy_string

/datum/quirk/item_quirk/allergic/add_unique(client/client_source)
	allergies = list()
	allergy_string = "None documented"
