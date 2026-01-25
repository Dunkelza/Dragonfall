/**
 * Shadowrun 5e Language Datums
 *
 * These are the actual /datum/language types that implement
 * the SR5 languages for in-game speech mechanics.
 *
 * Each language has:
 * - A key for speaking (e.g. ;j for Japanese)
 * - Syllables for scrambling speech to non-speakers
 * - An icon for the chat display
 */

// =============================================================================
// BASE SR5 LANGUAGE TYPE
// =============================================================================

/// Base type for all SR5 languages - provides common defaults
/datum/language/sr5
	abstract_type = /datum/language/sr5
	flags = NONE
	default_priority = 80

// =============================================================================
// COMMON WORLD LANGUAGES
// =============================================================================

/// English - The dominant corporate and UCAS/CAS language
/datum/language/sr5/english
	name = "English"
	desc = "The dominant language of the UCAS, CAS, and the primary corporate tongue."
	key = "e"
	flags = LANGUAGE_HIDE_ICON_IF_UNDERSTOOD
	default_priority = 100
	icon_state = "galcom"
	space_chance = 55
	sentence_chance = 5
	syllables = list(
		// Common English syllables
		"the", "and", "ing", "tion", "er", "ed", "es", "en", "al", "re",
		"on", "an", "in", "at", "ion", "ent", "is", "or", "ar", "it",
		"as", "com", "ment", "ter", "pro", "con", "per", "pre", "de", "dis",
		"un", "for", "to", "be", "of", "not", "but", "what", "all", "were",
		"we", "when", "your", "can", "said", "there", "use", "each", "which", "she",
		"do", "how", "their", "if", "will", "up", "oth", "out", "man", "has"
	)

/// Japanese - Megacorp language, official in Japan
/datum/language/sr5/japanese
	name = "Japanese"
	desc = "The official language of Japan and the primary tongue of many megacorporations."
	key = "j"
	flags = parent_type::flags | (LANGUAGE_SELECTABLE_SPEAK | LANGUAGE_SELECTABLE_UNDERSTAND)
	default_priority = 90
	icon_state = "galcom"
	space_chance = 30
	sentence_chance = 8
	syllables = list(
		// Japanese syllables (romanized)
		"ka", "ki", "ku", "ke", "ko", "sa", "shi", "su", "se", "so",
		"ta", "chi", "tsu", "te", "to", "na", "ni", "nu", "ne", "no",
		"ha", "hi", "fu", "he", "ho", "ma", "mi", "mu", "me", "mo",
		"ya", "yu", "yo", "ra", "ri", "ru", "re", "ro", "wa", "wo", "n",
		"ga", "gi", "gu", "ge", "go", "za", "ji", "zu", "ze", "zo",
		"da", "de", "do", "ba", "bi", "bu", "be", "bo", "pa", "pi", "pu", "pe", "po",
		"kya", "kyu", "kyo", "sha", "shu", "sho", "cha", "chu", "cho",
		"nya", "nyu", "nyo", "hya", "hyu", "hyo", "mya", "myu", "myo",
		"rya", "ryu", "ryo", "gya", "gyu", "gyo", "ja", "ju", "jo",
		"bya", "byu", "byo", "pya", "pyu", "pyo"
	)

/// Mandarin - Most spoken language worldwide
/datum/language/sr5/mandarin
	name = "Mandarin"
	desc = "The most widely spoken language in the world, dominant in China and the Pacific."
	key = "m"
	flags = parent_type::flags | (LANGUAGE_SELECTABLE_SPEAK | LANGUAGE_SELECTABLE_UNDERSTAND)
	default_priority = 90
	icon_state = "galcom"
	space_chance = 25
	sentence_chance = 10
	syllables = list(
		// Mandarin pinyin syllables
		"ba", "bai", "ban", "bang", "bao", "bei", "ben", "beng", "bi", "bian",
		"biao", "bie", "bin", "bing", "bo", "bu", "ca", "cai", "can", "cang",
		"cao", "ce", "cen", "ceng", "cha", "chai", "chan", "chang", "chao", "che",
		"chen", "cheng", "chi", "chong", "chou", "chu", "chua", "chuai", "chuan", "chuang",
		"chui", "chun", "chuo", "da", "dai", "dan", "dang", "dao", "de", "dei",
		"den", "deng", "di", "dian", "diao", "die", "ding", "diu", "dong", "dou",
		"du", "duan", "dui", "dun", "duo", "fa", "fan", "fang", "fei", "fen",
		"feng", "fo", "fou", "fu", "ga", "gai", "gan", "gang", "gao", "ge",
		"gei", "gen", "geng", "gong", "gou", "gu", "gua", "guai", "guan", "guang"
	)

/// Spanish - Common in Aztlan and CAS
/datum/language/sr5/spanish
	name = "Spanish"
	desc = "Common throughout Aztlan, the CAS, and much of the Americas."
	key = "p"
	flags = parent_type::flags | (LANGUAGE_SELECTABLE_SPEAK | LANGUAGE_SELECTABLE_UNDERSTAND)
	default_priority = 90
	icon_state = "galcom"
	space_chance = 50
	sentence_chance = 6
	syllables = list(
		// Spanish syllables
		"a", "al", "an", "ar", "as", "ba", "be", "bi", "bo", "bu",
		"ca", "ce", "ci", "co", "cu", "cha", "che", "chi", "cho", "chu",
		"da", "de", "di", "do", "du", "el", "en", "er", "es", "fa",
		"fe", "fi", "fo", "fu", "ga", "ge", "gi", "go", "gu", "ha",
		"he", "hi", "ho", "hu", "ja", "je", "ji", "jo", "ju", "la",
		"le", "li", "lo", "lu", "lla", "lle", "llo", "ma", "me", "mi",
		"mo", "mu", "na", "ne", "ni", "no", "nu", "ña", "ñe", "ño",
		"pa", "pe", "pi", "po", "pu", "que", "qui", "ra", "re", "ri",
		"ro", "ru", "rra", "rre", "rri", "rro", "rru", "sa", "se", "si",
		"so", "su", "ta", "te", "ti", "to", "tu", "va", "ve", "vi", "vo", "vu"
	)

/// German - Allied German States and S-K subsidiaries
/datum/language/sr5/german
	name = "German"
	desc = "The official language of the Allied German States and Saeder-Krupp subsidiaries."
	key = "d"
	flags = parent_type::flags | (LANGUAGE_SELECTABLE_SPEAK | LANGUAGE_SELECTABLE_UNDERSTAND)
	default_priority = 90
	icon_state = "galcom"
	space_chance = 45
	sentence_chance = 5
	syllables = list(
		// German syllables
		"ab", "ach", "auf", "aus", "be", "bei", "bin", "bis", "da", "das",
		"dem", "den", "der", "des", "die", "du", "durch", "ein", "er", "es",
		"für", "ge", "hab", "hat", "ich", "ihm", "ihn", "ihr", "im", "in",
		"ist", "ja", "kann", "keit", "lein", "lich", "los", "man", "mehr", "mein",
		"mir", "mit", "nach", "nich", "noch", "nun", "nur", "ob", "oder", "schaft",
		"schon", "sehr", "sein", "sich", "sie", "sind", "so", "über", "um", "und",
		"uns", "ver", "vom", "von", "vor", "war", "was", "weg", "wenn", "wer",
		"wie", "wir", "wird", "wo", "wohl", "zu", "zum", "zur", "ung", "haft"
	)

/// Russian - Russian Republic and former Soviet territories
/datum/language/sr5/russian
	name = "Russian"
	desc = "Dominant throughout the Russian Republic and former Soviet territories."
	key = "r"
	flags = parent_type::flags | (LANGUAGE_SELECTABLE_SPEAK | LANGUAGE_SELECTABLE_UNDERSTAND)
	default_priority = 90
	icon_state = "galcom"
	space_chance = 40
	sentence_chance = 7
	syllables = list(
		// Russian syllables (romanized)
		"a", "ba", "va", "ga", "da", "ye", "zha", "za", "i", "ka",
		"la", "ma", "na", "o", "pa", "ra", "sa", "ta", "u", "fa",
		"kha", "tsa", "cha", "sha", "shcha", "y", "yu", "ya", "be", "ve",
		"ge", "de", "zhe", "ze", "ke", "le", "me", "ne", "pe", "re",
		"se", "te", "fe", "khe", "tse", "che", "she", "shche", "bi", "vi",
		"gi", "di", "zhi", "zi", "ki", "li", "mi", "ni", "pi", "ri",
		"si", "ti", "fi", "khi", "tsi", "chi", "shi", "shchi", "bo", "vo",
		"go", "do", "zho", "zo", "ko", "lo", "mo", "no", "po", "ro",
		"so", "to", "fo", "kho", "cho", "sho", "bu", "vu", "gu", "du"
	)

/// French - Quebec and European regions
/datum/language/sr5/french
	name = "French"
	desc = "The official language of Quebec and common across Europe and Africa."
	key = "f"
	flags = parent_type::flags | (LANGUAGE_SELECTABLE_SPEAK | LANGUAGE_SELECTABLE_UNDERSTAND)
	default_priority = 90
	icon_state = "galcom"
	space_chance = 50
	sentence_chance = 5
	syllables = list(
		// French syllables
		"a", "ai", "an", "au", "avec", "be", "bien", "bon", "ce", "ça",
		"cher", "ci", "comme", "con", "dans", "de", "des", "di", "donc", "du",
		"eau", "en", "est", "et", "eu", "faire", "fait", "foi", "ge", "gne",
		"il", "je", "la", "le", "les", "leur", "li", "lo", "lu", "ma",
		"mais", "me", "mer", "mes", "mi", "moi", "mon", "ner", "ni", "non",
		"nos", "notre", "nous", "on", "ou", "où", "par", "pas", "peu", "plus",
		"pour", "pre", "que", "quel", "qui", "ra", "re", "rien", "sa", "sans",
		"se", "ses", "si", "soi", "son", "sous", "sur", "ta", "te", "tes",
		"tion", "toi", "ton", "tous", "tout", "très", "trop", "tu", "un", "une"
	)

/// Arabic - Middle East and North Africa
/datum/language/sr5/arabic
	name = "Arabic"
	desc = "The dominant language of the Middle East and North Africa."
	key = "a"
	flags = parent_type::flags | (LANGUAGE_SELECTABLE_SPEAK | LANGUAGE_SELECTABLE_UNDERSTAND)
	default_priority = 90
	icon_state = "galcom"
	space_chance = 35
	sentence_chance = 8
	syllables = list(
		// Arabic syllables (romanized)
		"ab", "ad", "af", "ah", "ak", "al", "am", "an", "aq", "ar",
		"as", "at", "aw", "ay", "ba", "bi", "da", "di", "fa", "fi",
		"ha", "hi", "hu", "ja", "ji", "ka", "ki", "ku", "la", "li",
		"lu", "ma", "mi", "mu", "na", "ni", "nu", "qa", "qi", "qu",
		"ra", "ri", "ru", "sa", "si", "su", "sha", "shi", "shu", "ta",
		"ti", "tu", "tha", "thi", "thu", "wa", "wi", "wu", "ya", "yi",
		"yu", "za", "zi", "zu", "dha", "dhi", "dhu", "gha", "ghi", "ghu",
		"kha", "khi", "khu", "een", "oon", "aan", "iya", "awa", "ullah", "ibn"
	)

// =============================================================================
// REGIONAL LANGUAGES
// =============================================================================

/// Cantonese - Hong Kong and southern China
/datum/language/sr5/cantonese
	name = "Cantonese"
	desc = "Common in the Hong Kong Free Enterprise Zone and southern China."
	key = "t"
	flags = parent_type::flags | (LANGUAGE_SELECTABLE_SPEAK | LANGUAGE_SELECTABLE_UNDERSTAND)
	default_priority = 85
	icon_state = "galcom"
	space_chance = 25
	sentence_chance = 10
	syllables = list(
		"aa", "aai", "aak", "aam", "aan", "aang", "aap", "aat", "aau", "ai",
		"ak", "am", "an", "ang", "ap", "at", "au", "baa", "baai", "baak",
		"baan", "baang", "baat", "baau", "bai", "bak", "ban", "bang", "bat", "bau",
		"bei", "beng", "bik", "bin", "bing", "bit", "biu", "bo", "bok", "bong",
		"bou", "bui", "buk", "bun", "bung", "but", "caa", "caai", "caak", "caam",
		"caan", "caang", "caap", "caat", "caau", "cai", "cak", "cam", "can", "cang"
	)

/// Korean - Korea and Japanese megacorps
/datum/language/sr5/korean
	name = "Korean"
	desc = "The official language of Korea, common in Japanese megacorporate environments."
	key = "k"
	flags = parent_type::flags | (LANGUAGE_SELECTABLE_SPEAK | LANGUAGE_SELECTABLE_UNDERSTAND)
	default_priority = 85
	icon_state = "galcom"
	space_chance = 35
	sentence_chance = 8
	syllables = list(
		"ga", "na", "da", "ra", "ma", "ba", "sa", "a", "ja", "cha",
		"ka", "ta", "pa", "ha", "geo", "neo", "deo", "reo", "meo", "beo",
		"seo", "eo", "jeo", "cheo", "keo", "teo", "peo", "heo", "go", "no",
		"do", "ro", "mo", "bo", "so", "o", "jo", "cho", "ko", "to",
		"po", "ho", "gu", "nu", "du", "ru", "mu", "bu", "su", "u",
		"ju", "chu", "ku", "tu", "pu", "hu", "geu", "neu", "deu", "reu",
		"meu", "beu", "seu", "eu", "jeu", "cheu", "keu", "teu", "peu", "heu",
		"gi", "ni", "di", "ri", "mi", "bi", "si", "i", "ji", "chi"
	)

/// Italian - Italian Confederation
/datum/language/sr5/italian
	name = "Italian"
	desc = "The official language of the Italian Confederation."
	key = "i"
	flags = parent_type::flags | (LANGUAGE_SELECTABLE_SPEAK | LANGUAGE_SELECTABLE_UNDERSTAND)
	default_priority = 85
	icon_state = "galcom"
	space_chance = 50
	sentence_chance = 5
	syllables = list(
		"a", "al", "an", "be", "ca", "che", "chi", "ci", "co", "con",
		"da", "de", "del", "di", "do", "e", "fa", "fi", "fra", "ge",
		"ghi", "gi", "gli", "go", "gna", "gne", "gni", "gno", "gnu", "i",
		"il", "in", "io", "la", "le", "li", "lo", "lu", "ma", "me",
		"mi", "mo", "na", "ne", "ni", "no", "nu", "o", "pa", "pe",
		"per", "pi", "po", "pre", "pro", "qua", "que", "qui", "quo", "ra",
		"re", "ri", "ro", "ru", "sa", "sce", "sci", "se", "si", "so",
		"sta", "ste", "sti", "sto", "su", "ta", "te", "ti", "to", "tra",
		"tu", "u", "un", "va", "ve", "vi", "vo", "za", "ze", "zi", "zo"
	)

/// Portuguese - Amazonia
/datum/language/sr5/portuguese
	name = "Portuguese"
	desc = "The official language of Amazonia."
	key = "b"
	flags = parent_type::flags | (LANGUAGE_SELECTABLE_SPEAK | LANGUAGE_SELECTABLE_UNDERSTAND)
	default_priority = 85
	icon_state = "galcom"
	space_chance = 50
	sentence_chance = 5
	syllables = list(
		"a", "ão", "ar", "as", "ba", "be", "bo", "ca", "ção", "ce",
		"cha", "che", "cho", "ci", "co", "com", "da", "de", "di", "do",
		"e", "em", "en", "er", "es", "fa", "fe", "fi", "fo", "fu",
		"ga", "ge", "gi", "go", "gu", "ha", "ho", "i", "im", "in",
		"ja", "je", "ji", "jo", "ju", "la", "le", "lha", "lhe", "lho",
		"li", "lo", "lu", "ma", "me", "men", "mi", "mo", "mu", "na",
		"nha", "nhe", "nho", "ni", "no", "nu", "o", "os", "pa", "pe",
		"po", "por", "pre", "pro", "qua", "que", "qui", "ra", "re", "ri",
		"ro", "ru", "sa", "se", "si", "so", "su", "ta", "te", "ti", "to"
	)

/// Hindi - Indian Union
/datum/language/sr5/hindi
	name = "Hindi"
	desc = "One of the major languages of the Indian Union."
	key = "n"
	flags = parent_type::flags | (LANGUAGE_SELECTABLE_SPEAK | LANGUAGE_SELECTABLE_UNDERSTAND)
	default_priority = 85
	icon_state = "galcom"
	space_chance = 40
	sentence_chance = 7
	syllables = list(
		"a", "aa", "i", "ee", "u", "oo", "e", "ai", "o", "au",
		"ka", "kha", "ga", "gha", "cha", "chha", "ja", "jha", "ta", "tha",
		"da", "dha", "na", "pa", "pha", "ba", "bha", "ma", "ya", "ra",
		"la", "wa", "sha", "sa", "ha", "kya", "gya", "tra", "jña", "shri",
		"pra", "kra", "dra", "bra", "gra", "mein", "hai", "hain", "ki", "ka",
		"ke", "ko", "se", "par", "aur", "bhi", "nahin", "yeh", "woh", "kya",
		"kar", "ho", "tha", "thi", "the", "ek", "do", "teen", "chaar", "paanch"
	)

// =============================================================================
// NATIVE AMERICAN LANGUAGES
// =============================================================================

/// Lakota - Sioux Nation
/datum/language/sr5/lakota
	name = "Lakota"
	desc = "The official language of the Sioux Nation."
	key = "x"
	flags = parent_type::flags | (LANGUAGE_SELECTABLE_SPEAK | LANGUAGE_SELECTABLE_UNDERSTAND)
	default_priority = 85
	icon_state = "galcom"
	space_chance = 45
	sentence_chance = 6
	syllables = list(
		"a", "an", "be", "bla", "ble", "blu", "cha", "che", "chi", "cho",
		"chu", "e", "gla", "gle", "gli", "glo", "glu", "ha", "he", "hi",
		"ho", "hu", "i", "ka", "ke", "ki", "ko", "ku", "kha", "khe",
		"khi", "kho", "khu", "la", "le", "li", "lo", "lu", "ma", "me",
		"mi", "mo", "mu", "na", "ne", "ni", "no", "nu", "o", "pa",
		"pe", "pi", "po", "pu", "pha", "phe", "phi", "pho", "phu", "sa",
		"se", "si", "so", "su", "sha", "she", "shi", "sho", "shu", "ta",
		"te", "ti", "to", "tu", "tha", "the", "thi", "tho", "thu", "u",
		"wa", "we", "wi", "wo", "wu", "ya", "ye", "yi", "yo", "yu",
		"za", "ze", "zi", "zo", "zu", "zha", "zhe", "zhi", "zho", "zhu"
	)

/// Salish - Salish-Shidhe Council
/datum/language/sr5/salish
	name = "Salish"
	desc = "The official language of the Salish-Shidhe Council."
	key = "q"
	flags = parent_type::flags | (LANGUAGE_SELECTABLE_SPEAK | LANGUAGE_SELECTABLE_UNDERSTAND)
	default_priority = 85
	icon_state = "galcom"
	space_chance = 40
	sentence_chance = 7
	syllables = list(
		"a", "e", "i", "o", "u", "ax", "ex", "ix", "ox", "ux",
		"ch", "ch'", "ts", "ts'", "tl", "tl'", "kw", "kw'", "xw", "qw",
		"qw'", "sq", "st", "sk", "sp", "sw", "sx", "sxw", "lh", "hw",
		"ya", "wa", "la", "ma", "na", "pa", "ta", "ka", "qa", "xa",
		"ye", "we", "le", "me", "ne", "pe", "te", "ke", "qe", "xe",
		"yi", "wi", "li", "mi", "ni", "pi", "ti", "ki", "qi", "xi",
		"yo", "wo", "lo", "mo", "no", "po", "to", "ko", "qo", "xo",
		"yu", "wu", "lu", "mu", "nu", "pu", "tu", "ku", "qu", "xu"
	)

/// Diné Bizaad (Navajo) - Pueblo Corporate Council
/datum/language/sr5/dine
	name = "Diné Bizaad"
	desc = "The Navajo language, common in the Pueblo Corporate Council."
	key = "v"
	flags = parent_type::flags | (LANGUAGE_SELECTABLE_SPEAK | LANGUAGE_SELECTABLE_UNDERSTAND)
	default_priority = 85
	icon_state = "galcom"
	space_chance = 45
	sentence_chance = 6
	syllables = list(
		"a", "aa", "e", "ee", "i", "ii", "o", "oo", "ba", "bi",
		"baa", "bee", "bii", "boo", "da", "di", "daa", "dee", "dii", "doo",
		"ga", "gi", "gaa", "gee", "gii", "goo", "ha", "hi", "haa", "hee",
		"hii", "hoo", "ja", "ji", "jaa", "jee", "jii", "joo", "ka", "ki",
		"kaa", "kee", "kii", "koo", "la", "li", "laa", "lee", "lii", "loo",
		"ma", "mi", "maa", "mee", "mii", "moo", "na", "ni", "naa", "nee",
		"nii", "noo", "sa", "si", "saa", "see", "sii", "soo", "sha", "shi",
		"shaa", "shee", "shii", "shoo", "ta", "ti", "taa", "tee", "tii", "too",
		"tsa", "tsi", "tsaa", "tsee", "tsii", "tsoo", "ya", "yi", "yaa", "yee"
	)

// =============================================================================
// MAGICAL / METATYPE LANGUAGES
// =============================================================================

/// Sperethiel - The elven language, revived after the Awakening
/datum/language/sr5/sperethiel
	name = "Sperethiel"
	desc = "The ancient elven language, revived after the Awakening. Spoken with ethereal grace."
	key = "1"
	flags = parent_type::flags | (LANGUAGE_SELECTABLE_SPEAK | LANGUAGE_SELECTABLE_UNDERSTAND)
	default_priority = 85
	icon_state = "plant"
	space_chance = 35
	sentence_chance = 4
	syllables = list(
		// Elvish-style syllables with flowing sounds
		"ae", "ai", "al", "an", "ar", "as", "ath", "awn", "aer", "ael",
		"el", "en", "er", "eth", "eil", "eir", "ean", "ear", "eon", "elan",
		"il", "in", "ir", "ith", "iel", "ien", "ior", "ial", "ion", "ith",
		"ol", "on", "or", "oth", "oel", "oer", "oan", "oril", "oth", "orn",
		"ul", "un", "ur", "uth", "uel", "uen", "uin", "uil", "uor", "urn",
		"la", "le", "li", "lo", "lu", "lan", "len", "lin", "lor", "lun",
		"na", "ne", "ni", "no", "nu", "nan", "nen", "nin", "nor", "nun",
		"ra", "re", "ri", "ro", "ru", "ran", "ren", "rin", "ron", "run",
		"sa", "se", "si", "so", "su", "san", "sen", "sin", "sor", "sun",
		"ta", "te", "ti", "to", "tu", "tan", "ten", "tin", "tor", "tun",
		"tha", "the", "thi", "tho", "thu", "val", "vel", "vir", "vor", "vul"
	)

/// Or'zet - The ork language, symbol of cultural pride
/datum/language/sr5/orzet
	name = "Or'zet"
	desc = "The ork underground language, a symbol of ork cultural identity and pride."
	key = "2"
	flags = parent_type::flags | (LANGUAGE_SELECTABLE_SPEAK | LANGUAGE_SELECTABLE_UNDERSTAND)
	default_priority = 85
	icon_state = "galuncom"
	space_chance = 40
	sentence_chance = 8
	syllables = list(
		// Orcish-style syllables with harsh, guttural sounds
		"ak", "ag", "akh", "agh", "arg", "ark", "az", "azh", "atz", "ach",
		"bak", "bag", "bar", "baz", "bol", "bor", "brak", "bruk", "bur", "buz",
		"dak", "dag", "dar", "daz", "dol", "dor", "drak", "druk", "dur", "duz",
		"gak", "gag", "gar", "gaz", "gol", "gor", "grak", "gruk", "gur", "guz",
		"hak", "hag", "har", "haz", "hol", "hor", "hrak", "hruk", "hur", "huz",
		"kak", "kag", "kar", "kaz", "kol", "kor", "krak", "kruk", "kur", "kuz",
		"mak", "mag", "mar", "maz", "mol", "mor", "mrak", "mruk", "mur", "muz",
		"nak", "nag", "nar", "naz", "nol", "nor", "nrak", "nruk", "nur", "nuz",
		"ok", "og", "okh", "ogh", "org", "ork", "oz", "ozh", "otz", "och",
		"uk", "ug", "ukh", "ugh", "urg", "urk", "uz", "uzh", "utz", "uch",
		"rak", "rag", "rar", "raz", "rol", "ror", "rrak", "rruk", "rur", "ruz",
		"tak", "tag", "tar", "taz", "tol", "tor", "trak", "truk", "tur", "tuz",
		"zak", "zag", "zar", "zaz", "zol", "zor", "zrak", "zruk", "zur", "zuz"
	)

/// Latin - Academic and magical traditions
/datum/language/sr5/latin
	name = "Latin"
	desc = "The classical language used in academia and various magical traditions."
	key = "3"
	flags = parent_type::flags | (LANGUAGE_SELECTABLE_SPEAK | LANGUAGE_SELECTABLE_UNDERSTAND)
	default_priority = 85
	icon_state = "shadow"
	space_chance = 50
	sentence_chance = 5
	syllables = list(
		// Latin syllables
		"ab", "ac", "ad", "ae", "af", "ag", "al", "am", "an", "ap",
		"ar", "as", "at", "au", "av", "ax", "ba", "be", "bi", "bo",
		"bus", "ca", "ce", "ci", "co", "con", "cu", "cum", "da", "de",
		"di", "do", "du", "dux", "e", "ec", "ed", "ef", "eg", "em",
		"en", "ep", "er", "es", "et", "ex", "fa", "fe", "fi", "fo",
		"fu", "fum", "ga", "ge", "gi", "go", "gu", "ha", "he", "hi",
		"ho", "hu", "i", "ia", "ib", "ic", "id", "ie", "ig", "il",
		"im", "in", "io", "ip", "ir", "is", "it", "iu", "ix", "la",
		"le", "li", "lo", "lu", "lum", "ma", "me", "mi", "mo", "mu",
		"na", "ne", "ni", "no", "nu", "nus", "o", "ob", "oc", "od"
	)

// =============================================================================
// SPECIAL LANGUAGES
// =============================================================================

/// Cityspeak - Street pidgin mixing many languages
/datum/language/sr5/cityspeak
	name = "Cityspeak"
	desc = "A pidgin language common in sprawl streets, mixing elements of many tongues."
	key = "4"
	flags = parent_type::flags | (LANGUAGE_SELECTABLE_SPEAK | LANGUAGE_SELECTABLE_UNDERSTAND)
	default_priority = 85
	icon_state = "spacer"
	space_chance = 50
	sentence_chance = 10
	syllables = list(
		// Mixed pidgin syllables from various languages
		"choom", "omae", "kono", "drek", "frag", "hoi", "neh", "oi", "ey", "hey",
		"wiz", "null", "nova", "preem", "slot", "scan", "ice", "ace", "biz", "cred",
		"chip", "jack", "deck", "run", "sam", "corp", "sec", "tek", "net", "grid",
		"ya", "da", "na", "wa", "ka", "ma", "ta", "ra", "la", "sa",
		"yo", "no", "mo", "to", "ko", "so", "ro", "lo", "po", "go",
		"che", "que", "muy", "mas", "por", "con", "sin", "para", "pero", "nada",
		"hai", "nai", "shi", "ne", "yo", "zo", "ga", "wa", "de", "ni",
		"sehr", "gut", "ja", "nein", "und", "mit", "das", "ist", "was", "nicht"
	)

/// ASL - American Sign Language
/datum/language/sr5/asl
	name = "ASL"
	desc = "American Sign Language, a complete visual language with its own grammar."
	key = "5"
	flags = parent_type::flags | (LANGUAGE_SELECTABLE_SPEAK | LANGUAGE_SELECTABLE_UNDERSTAND | LANGUAGE_OVERRIDE_SAY_MOD)
	default_priority = 85
	icon_state = "sign"

/// Override for ASL - it's a visual language so scrambling doesn't apply the same way
/datum/language/sr5/asl/speech_not_understood(atom/movable/source, raw_message, spans, list/message_mods, quote)
	spans |= "italics"
	spans |= "emote"
	message_mods[MODE_NO_QUOTE] = TRUE
	return span_emote("makes intricate gestures with [source.p_their()] hands.")

/datum/language/sr5/asl/speech_understood(atom/movable/source, raw_message, spans, list/message_mods, quote)
	var/static/regex/remove_tone = regex("\[?!\]", "g")
	raw_message = remove_tone.Replace(raw_message, ".")
	while(length(raw_message) > 1 && raw_message[length(raw_message)] == ".")
		if(length(raw_message) == 1 || raw_message[length(raw_message) - 1] != ".")
			break
		raw_message = copytext(raw_message, 1, length(raw_message))
	raw_message = capitalize(lowertext(raw_message))
	return ..()

/datum/language/sr5/asl/before_speaking(atom/movable/speaker, message)
	if(!iscarbon(speaker))
		return message
	var/mob/living/carbon/signer = speaker
	switch(signer.check_signables_state())
		if(SIGN_ONE_HAND, SIGN_CUFFED)
			return stars(message)
		if(SIGN_HANDS_FULL)
			to_chat(signer, span_warning("Your hands are full."))
			return
		if(SIGN_ARMLESS)
			to_chat(signer, span_warning("You can't sign with no hands."))
			return
		if(SIGN_TRAIT_BLOCKED)
			to_chat(signer, span_warning("You can't sign at the moment."))
			return
	return message

/datum/language/sr5/asl/can_speak_language(atom/movable/speaker, silent, ignore_mute)
	return TRUE // Speaking is handled by before_speaking
