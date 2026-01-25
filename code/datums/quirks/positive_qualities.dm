// Shadowrun 5e Positive Qualities
// These qualities cost karma to acquire and provide benefits
// Karma values are negative because positive qualities COST karma

/datum/quirk/ambidextrous
	name = "Ambidextrous"
	desc = "You can use both hands with equal skill. You do not suffer off-hand penalties."
	icon = "hands"
	quirk_genre = QUIRK_GENRE_BOON
	karma_value = -4 // SR5: 4 karma
	mob_trait = TRAIT_AMBIDEXTROUS
	gain_text = "<span class='notice'>Both of your hands feel equally capable.</span>"
	lose_text = "<span class='notice'>Your off-hand coordination fades.</span>"
	medical_record_text = "Patient demonstrates equal dexterity in both hands."

// Ambidexterity is handled via TRAIT_AMBIDEXTROUS checks in combat code

/datum/quirk/analytical_mind
	name = "Analytical Mind"
	desc = "You have a knack for logical analysis and problem-solving. +15% bonus to research and hacking speeds."
	icon = "brain"
	quirk_genre = QUIRK_GENRE_BOON
	karma_value = -5 // SR5: 5 karma
	mob_trait = TRAIT_ANALYTICAL_MIND
	gain_text = "<span class='notice'>Your thoughts feel sharper and more organized.</span>"
	lose_text = "<span class='notice'>Your analytical edge dulls.</span>"
	medical_record_text = "Patient demonstrates above-average analytical capabilities."

// Analytical Mind provides research/hacking bonuses - checked via TRAIT_ANALYTICAL_MIND

/datum/quirk/catlike
	name = "Catlike"
	desc = "You have natural grace and balance. You take 50% less damage from falling and make less noise when moving."
	icon = "cat"
	quirk_genre = QUIRK_GENRE_BOON
	karma_value = -7 // SR5: 7 karma
	mob_trait = TRAIT_CATLIKE
	gain_text = "<span class='notice'>You feel light on your feet.</span>"
	lose_text = "<span class='notice'>Your natural grace fades.</span>"
	medical_record_text = "Patient demonstrates exceptional balance and coordination."

/datum/quirk/catlike/add()
	RegisterSignal(quirk_holder, COMSIG_MOB_APPLY_DAMAGE_MODIFIERS, PROC_REF(catlike_fall_protection))

/datum/quirk/catlike/remove()
	UnregisterSignal(quirk_holder, COMSIG_MOB_APPLY_DAMAGE_MODIFIERS)

/datum/quirk/catlike/proc/catlike_fall_protection(datum/source, list/damage_mods, damage_amount, damagetype, def_zone, sharpness, attack_direction, obj/item/attacking_item)
	SIGNAL_HANDLER
	// Reduce fall damage (typically comes from gravity/falling)
	if(damagetype == BRUTE && !attacking_item)
		damage_mods += 0.5 // 50% damage reduction from falls/environmental

/datum/quirk/guts
	name = "Guts"
	desc = "You have nerves of steel. Fear effects are less likely to affect you, and you resist intimidation."
	icon = "fist-raised"
	quirk_genre = QUIRK_GENRE_BOON
	karma_value = -10 // SR5: 10 karma
	mob_trait = TRAIT_FEARLESS
	gain_text = "<span class='notice'>You feel unshakeable courage in your heart.</span>"
	lose_text = "<span class='notice'>Your courage wavers.</span>"
	medical_record_text = "Patient shows remarkable resistance to stress and fear."

// TRAIT_FEARLESS is already checked in phobia code and intimidation

/datum/quirk/high_pain_tolerance
	name = "High Pain Tolerance"
	desc = "You can push through pain that would cripple others. You enter soft crit at lower health thresholds."
	icon = "shield-heart"
	quirk_genre = QUIRK_GENRE_BOON
	karma_value = -7 // SR5: 7 karma
	mob_trait = TRAIT_HIGH_PAIN_TOLERANCE
	gain_text = "<span class='notice'>Pain feels like a distant memory.</span>"
	lose_text = "<span class='notice'>Pain becomes more immediate again.</span>"
	medical_record_text = "Patient demonstrates unusually high pain threshold."

/datum/quirk/high_pain_tolerance/add()
	var/mob/living/L = quirk_holder
	L.crit_threshold -= 25 // Can take 25 more damage before entering crit

/datum/quirk/high_pain_tolerance/remove()
	var/mob/living/L = quirk_holder
	L.crit_threshold += 25

/datum/quirk/natural_athlete
	name = "Natural Athlete"
	desc = "Your body is naturally conditioned for physical activity. +10% movement speed and faster stamina recovery."
	icon = "running"
	quirk_genre = QUIRK_GENRE_BOON
	karma_value = -7 // SR5: 7 karma
	mob_trait = TRAIT_ATHLETE
	gain_text = "<span class='notice'>Your body feels primed for action.</span>"
	lose_text = "<span class='notice'>Your natural athleticism fades.</span>"
	medical_record_text = "Patient is in exceptional physical condition."

/datum/quirk/natural_athlete/add()
	quirk_holder.add_movespeed_modifier(/datum/movespeed_modifier/sr5_athlete)

/datum/quirk/natural_athlete/remove()
	quirk_holder.remove_movespeed_modifier(/datum/movespeed_modifier/sr5_athlete)

/datum/movespeed_modifier/sr5_athlete
	slowdown = -0.15 // 15% speed boost (negative = faster)

/datum/quirk/quick_healer
	name = "Quick Healer"
	desc = "Your body heals faster than normal. Wounds heal 25% faster and medical treatment is more effective."
	icon = "heart-pulse"
	quirk_genre = QUIRK_GENRE_BOON
	karma_value = -3 // SR5: 3 karma
	mob_trait = TRAIT_QUICK_HEALER
	gain_text = "<span class='notice'>Your wounds seem to close faster.</span>"
	lose_text = "<span class='notice'>Your accelerated healing slows.</span>"
	medical_record_text = "Patient demonstrates accelerated healing response."

// TRAIT_QUICK_HEALER is checked in wound healing code

/datum/quirk/toughness
	name = "Toughness"
	desc = "You're built like a brick wall. You have +15 maximum health."
	icon = "shield-alt"
	quirk_genre = QUIRK_GENRE_BOON
	karma_value = -9 // SR5: 9 karma
	mob_trait = TRAIT_TOUGHNESS
	gain_text = "<span class='notice'>You feel solid and resilient.</span>"
	lose_text = "<span class='notice'>You feel more fragile.</span>"
	medical_record_text = "Patient has unusually dense bone and muscle structure."

/datum/quirk/toughness/add()
	var/mob/living/L = quirk_holder
	L.maxHealth += 15
	L.updatehealth()

/datum/quirk/toughness/remove()
	var/mob/living/L = quirk_holder
	L.maxHealth -= 15
	L.updatehealth()

/datum/quirk/will_to_live
	name = "Will to Live"
	desc = "Your sheer determination keeps you alive. You can survive longer in critical condition and resist death."
	icon = "heart"
	quirk_genre = QUIRK_GENRE_BOON
	karma_value = -3 // SR5: 3 karma per rank, this is rank 1
	mob_trait = TRAIT_WILL_TO_LIVE
	gain_text = "<span class='notice'>A fierce will to survive burns within you.</span>"
	lose_text = "<span class='notice'>Your desperate will to survive fades.</span>"
	medical_record_text = "Patient demonstrates remarkable survival instinct."

/datum/quirk/will_to_live/add()
	var/mob/living/L = quirk_holder
	L.crit_threshold -= 15 // More room before hard crit
	L.hardcrit_threshold -= 30 // Much more room before dying

/datum/quirk/will_to_live/remove()
	var/mob/living/L = quirk_holder
	L.crit_threshold += 15
	L.hardcrit_threshold += 30

/datum/quirk/biocompatibility
	name = "Biocompatibility"
	desc = "Your body accepts augmentations more readily. Cyberware and bioware have reduced essence costs for you."
	icon = "microchip"
	quirk_genre = QUIRK_GENRE_BOON
	karma_value = -10 // SR5: 10 karma
	mob_trait = TRAIT_BIOCOMPATIBLE
	gain_text = "<span class='notice'>Your body feels receptive to modification.</span>"
	lose_text = "<span class='notice'>Your biocompatibility normalizes.</span>"
	medical_record_text = "Patient shows reduced rejection response to implants."

// TRAIT_BIOCOMPATIBLE is checked in augment installation code to reduce essence cost by 10%

/datum/quirk/perfect_time
	name = "Perfect Time"
	desc = "You have an innate sense of timing. You always know approximately what time it is without checking."
	icon = "clock"
	quirk_genre = QUIRK_GENRE_BOON
	karma_value = -2 // Minor quality
	mob_trait = TRAIT_PERFECT_TIME
	gain_text = "<span class='notice'>You can feel the passage of time instinctively.</span>"
	lose_text = "<span class='notice'>Your internal clock becomes unreliable.</span>"
	medical_record_text = "Patient demonstrates accurate internal time perception."

/datum/quirk/perfect_time/post_add()
	to_chat(quirk_holder, span_noticealien("Your internal clock tells you the time is [stationtime2text()]."))

// Players with TRAIT_PERFECT_TIME can check time without a watch

/datum/quirk/photographic_memory
	name = "Photographic Memory"
	desc = "You have exceptional recall. You can remember faces, names, and details with perfect clarity."
	icon = "camera"
	quirk_genre = QUIRK_GENRE_BOON
	karma_value = -6 // SR5: 6 karma
	mob_trait = TRAIT_PHOTOGRAPHIC_MEMORY
	gain_text = "<span class='notice'>Every detail seems crystal clear in your memory.</span>"
	lose_text = "<span class='notice'>Your exceptional memory fades.</span>"
	medical_record_text = "Patient demonstrates eidetic memory capabilities."

// TRAIT_PHOTOGRAPHIC_MEMORY allows remembering examined mob details

/datum/quirk/resistance_toxins
	name = "Resistance to Toxins"
	desc = "Your body processes toxins more efficiently. Poisons and drugs affect you 25% less severely."
	icon = "flask"
	quirk_genre = QUIRK_GENRE_BOON
	karma_value = -8 // SR5: 8 karma
	mob_trait = TRAIT_TOXIN_RESISTANT
	gain_text = "<span class='notice'>Your body feels resistant to harmful substances.</span>"
	lose_text = "<span class='notice'>Your toxin resistance normalizes.</span>"
	medical_record_text = "Patient shows enhanced liver function and toxin processing."

/datum/quirk/resistance_toxins/add()
	RegisterSignal(quirk_holder, COMSIG_MOB_APPLY_DAMAGE_MODIFIERS, PROC_REF(toxin_resistance))

/datum/quirk/resistance_toxins/remove()
	UnregisterSignal(quirk_holder, COMSIG_MOB_APPLY_DAMAGE_MODIFIERS)

/datum/quirk/resistance_toxins/proc/toxin_resistance(datum/source, list/damage_mods, damage_amount, damagetype, def_zone, sharpness, attack_direction, obj/item/attacking_item)
	SIGNAL_HANDLER
	if(damagetype == TOX)
		damage_mods += 0.75 // 25% toxin damage reduction

/datum/quirk/item_quirk/first_aid
	name = "First Aid Training"
	desc = "You've received proper first aid training. Medical items are 20% more effective when you use them, and you spawn with a medkit."
	icon = "medkit"
	quirk_genre = QUIRK_GENRE_BOON
	karma_value = -5 // Custom: minor quality
	mob_trait = TRAIT_FIRST_AID
	gain_text = "<span class='notice'>Your medical training comes to mind.</span>"
	lose_text = "<span class='notice'>Your first aid knowledge fades.</span>"
	medical_record_text = "Patient has documented first aid certification."

/datum/quirk/item_quirk/first_aid/add_unique(client/client_source)
	give_item_to_holder(/obj/item/storage/medkit/regular, list(LOCATION_BACKPACK = ITEM_SLOT_BACKPACK, LOCATION_HANDS = ITEM_SLOT_HANDS))

// TRAIT_FIRST_AID is checked in medical item code to boost healing effectiveness

// ============================================================================
// METATYPE-SPECIFIC QUALITIES
// ============================================================================

/datum/quirk/thermographic_vision
	name = "Thermographic Vision"
	desc = "You can see heat signatures, allowing vision in darkness. Standard for Dwarves, Orks, and Trolls."
	icon = "eye"
	quirk_genre = QUIRK_GENRE_BOON
	karma_value = 0 // Free for applicable metatypes
	mob_trait = TRAIT_THERMOGRAPHIC
	allowed_metatypes = list(/datum/species/dwarf, /datum/species/ork, /datum/species/troll)
	gain_text = "<span class='notice'>The world glows with heat signatures.</span>"
	lose_text = "<span class='notice'>Your thermal vision fades to normal.</span>"
	medical_record_text = "Patient has natural thermographic vision capability."

/datum/quirk/low_light_vision
	name = "Low-Light Vision"
	desc = "You can see clearly in low-light conditions. Standard for Elves and Dwarves."
	icon = "moon"
	quirk_genre = QUIRK_GENRE_BOON
	karma_value = 0 // Free for applicable metatypes
	mob_trait = TRAIT_LOW_LIGHT
	allowed_metatypes = list(/datum/species/elf, /datum/species/dwarf)
	gain_text = "<span class='notice'>Darkness becomes less of an obstacle.</span>"
	lose_text = "<span class='notice'>Your enhanced night vision fades.</span>"
	medical_record_text = "Patient has natural low-light vision capability."

/datum/quirk/dermal_deposits
	name = "Dermal Deposits"
	desc = "Your skin has natural bone-like armor deposits. +5% damage reduction. Troll only."
	icon = "shield"
	quirk_genre = QUIRK_GENRE_BOON
	karma_value = 0 // Free for trolls
	allowed_metatypes = list(/datum/species/troll)
	gain_text = "<span class='notice'>Your thick hide feels even more protective.</span>"
	lose_text = "<span class='notice'>Your dermal armor softens.</span>"
	medical_record_text = "Patient has pronounced dermal bone deposits."

/datum/quirk/dermal_deposits/add()
	var/mob/living/carbon/human/H = quirk_holder
	if(!istype(H) || !H.physiology)
		return
	H.physiology.damage_resistance += 5 // 5% flat damage reduction

/datum/quirk/dermal_deposits/remove()
	var/mob/living/carbon/human/H = quirk_holder
	if(!istype(H) || !H.physiology)
		return
	H.physiology.damage_resistance -= 5

/datum/quirk/reach
	name = "Reach"
	desc = "Your long arms give you extended melee range. Troll only."
	icon = "arrows-alt-h"
	quirk_genre = QUIRK_GENRE_BOON
	karma_value = 0 // Free for trolls
	mob_trait = TRAIT_REACH
	allowed_metatypes = list(/datum/species/troll)
	gain_text = "<span class='notice'>Your long arms give you an advantage in melee.</span>"
	lose_text = "<span class='notice'>Your reach returns to normal.</span>"
	medical_record_text = "Patient has extended limb proportions."

/datum/quirk/toxin_resistance
	name = "Toxin Resistance (Racial)"
	desc = "Dwarves have natural resistance to toxins and pathogens. 25% reduction in toxin damage."
	icon = "flask-vial"
	quirk_genre = QUIRK_GENRE_BOON
	karma_value = 0 // Free for dwarves
	mob_trait = TRAIT_DWARF_TOXIN_RESIST
	allowed_metatypes = list(/datum/species/dwarf)
	gain_text = "<span class='notice'>Your dwarven constitution protects you from poisons.</span>"
	lose_text = "<span class='notice'>Your natural toxin resistance fades.</span>"
	medical_record_text = "Patient has enhanced toxin resistance (dwarven physiology)."

/datum/quirk/toxin_resistance/add()
	RegisterSignal(quirk_holder, COMSIG_MOB_APPLY_DAMAGE_MODIFIERS, PROC_REF(dwarf_toxin_resistance))

/datum/quirk/toxin_resistance/remove()
	UnregisterSignal(quirk_holder, COMSIG_MOB_APPLY_DAMAGE_MODIFIERS)

/datum/quirk/toxin_resistance/proc/dwarf_toxin_resistance(datum/source, list/damage_mods, damage_amount, damagetype, def_zone, sharpness, attack_direction, obj/item/attacking_item)
	SIGNAL_HANDLER
	if(damagetype == TOX)
		damage_mods += 0.75 // 25% toxin damage reduction

/datum/quirk/human_edge
	name = "Human Adaptability"
	desc = "Humans have unmatched adaptability. You gain +1 Edge at character creation."
	icon = "star"
	quirk_genre = QUIRK_GENRE_BOON
	karma_value = 0 // Free for humans
	allowed_metatypes = list(/datum/species/human)
	gain_text = "<span class='notice'>Your human adaptability shines through.</span>"
	lose_text = "<span class='notice'>Your exceptional luck fades.</span>"
	medical_record_text = "Patient demonstrates remarkable human adaptability."
