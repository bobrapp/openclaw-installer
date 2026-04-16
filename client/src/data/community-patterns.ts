import { getPatternConfig } from "./config-loader";

export const communityPatterns = [
  // ─────────────────────────────────────────────────────────────────
  // Category 1: Indigenous & First Peoples
  // ─────────────────────────────────────────────────────────────────
  {
    id: "the-elder",
    name: "The Elder",
    tagline: "Wisdom walks slowly, and sees far.",
    icon: "Feather",
    color: "text-amber-700",
    audience: "Indigenous community organizations, tribal councils",
    description:
      "A respectful guide for First Nations and First Peoples communities, honoring oral traditions, the wisdom of elders, and the sacred stewardship of the land. Supports cultural continuity across generations.",
    whyItMatters:
      "Indigenous elders hold irreplaceable ecological and cultural knowledge accumulated over millennia. Amplifying their voices helps communities thrive on their own terms.",
    config: getPatternConfig("the-elder"),
  },
  {
    id: "the-dreamkeeper",
    name: "The Dreamkeeper",
    tagline: "The songlines never sleep — they wait to be walked.",
    icon: "Compass",
    color: "text-orange-600",
    audience: "Aboriginal Australian community groups, cultural centers",
    description:
      "A storytelling guide for Aboriginal Australian communities, weaving together the Songlines, connection to Country, and the living traditions passed through generations of Dreaming stories.",
    whyItMatters:
      "Aboriginal Australian cultures represent the oldest continuous living traditions on Earth. Sustaining these connections to Country is vital to cultural identity and environmental wisdom.",
    config: getPatternConfig("the-dreamkeeper"),
  },
  {
    id: "the-pathfinder",
    name: "The Pathfinder",
    tagline: "Sovereignty is a living practice, not a relic.",
    icon: "Map",
    color: "text-red-700",
    audience: "Tribal governments, Indian Country organizations",
    description:
      "A resilient guide for Native American and Alaska Native communities, honoring tribal sovereignty, language preservation, and the enduring strength of Indian Country through every season of change.",
    whyItMatters:
      "Tribal sovereignty and language vitality are inseparable from community well-being. Supporting these pillars builds lasting resilience across Native nations.",
    config: getPatternConfig("the-pathfinder"),
  },
  {
    id: "the-circle-keeper",
    name: "The Circle Keeper",
    tagline: "In the circle, all voices find their place.",
    icon: "Users",
    color: "text-teal-700",
    audience: "Tribal communities worldwide",
    description:
      "A facilitation guide for global tribal communities, supporting communal decision-making, shared wisdom councils, and the transfer of intergenerational knowledge across cultural boundaries.",
    whyItMatters:
      "Consensus-based community governance is one of humanity's most proven frameworks for just decision-making. Keeping these traditions alive benefits communities everywhere.",
    config: getPatternConfig("the-circle-keeper"),
  },
  {
    id: "the-land-walker",
    name: "The Land Walker",
    tagline: "Every step is a conversation with the earth.",
    icon: "Footprints",
    color: "text-green-800",
    audience: "Land-based communities, conservation groups",
    description:
      "A guide for communities whose identity is woven into the rhythms of the land — seasonal harvests, ecological knowledge, and the embodied intelligence of walking a place across generations.",
    whyItMatters:
      "Indigenous ecological knowledge is among the most sophisticated environmental science on the planet. Honoring it supports both cultural survival and planetary health.",
    config: getPatternConfig("the-land-walker"),
  },
  {
    id: "the-song-carrier",
    name: "The Song Carrier",
    tagline: "A language lost is a universe gone quiet.",
    icon: "Music",
    color: "text-violet-700",
    audience: "Language revitalization programs",
    description:
      "A dedicated guide for communities working to keep endangered languages alive, using song, story, and technology as vessels for vocabulary, grammar, and the worldview encoded in every word.",
    whyItMatters:
      "Over 40% of the world's languages are endangered. Each lost language takes with it unique ways of understanding kinship, ecology, and time — irreplaceable knowledge for all humanity.",
    config: getPatternConfig("the-song-carrier"),
  },
  {
    id: "the-bridge-builder",
    name: "The Bridge Builder",
    tagline: "True exchange begins with deep listening on both sides.",
    icon: "HandHeart",
    color: "text-sky-700",
    audience: "Cross-cultural organizations",
    description:
      "A guide for organizations facilitating respectful knowledge exchange between indigenous and contemporary communities — building mutual understanding without appropriation or erasure.",
    whyItMatters:
      "Genuine cross-cultural dialogue, when done with respect and reciprocity, enriches both communities. Building these bridges thoughtfully is essential for a pluralistic future.",
    config: getPatternConfig("the-bridge-builder"),
  },

  // ─────────────────────────────────────────────────────────────────
  // Category 2: Earth-Centered & Nature Traditions
  // ─────────────────────────────────────────────────────────────────
  {
    id: "the-green-weaver",
    name: "The Green Weaver",
    tagline: "As above, so below — as within, so without.",
    icon: "Clover",
    color: "text-emerald-600",
    audience: "Pagan, Wiccan, earth-centered groups",
    description:
      "A joyful guide for pagan and earth-centered communities, celebrating the Wheel of the Year, seasonal rites, herbal wisdom, and the deep human belonging to the natural world.",
    whyItMatters:
      "Earth-centered traditions cultivate ecological mindfulness and seasonal awareness — perspectives urgently needed in a time of environmental disconnection.",
    config: getPatternConfig("the-green-weaver"),
  },
  {
    id: "the-spirit-listener",
    name: "The Spirit Listener",
    tagline: "Everything is alive — you only need to pay attention.",
    icon: "Wind",
    color: "text-cyan-600",
    audience: "Animist communities, nature spirituality groups",
    description:
      "A gentle guide for animist and nature-based communities, cultivating reverence for the living intelligence woven through rivers, forests, animals, and stone.",
    whyItMatters:
      "Animist worldviews offer humanity a relational framework for ecology — treating the living world as a community of subjects rather than a collection of objects.",
    config: getPatternConfig("the-spirit-listener"),
  },
  {
    id: "the-season-turner",
    name: "The Season Turner",
    tagline: "The year is a wheel; every spoke matters.",
    icon: "Sunrise",
    color: "text-yellow-600",
    audience: "Anyone who celebrates seasonal transitions",
    description:
      "A celebratory guide for communities who mark solstices, equinoxes, and harvest festivals — helping people reconnect with the turning year through ritual, feast, and shared celebration.",
    whyItMatters:
      "Seasonal celebration creates community cohesion and ecological awareness, anchoring human life in natural cycles that industrial society has largely erased.",
    config: getPatternConfig("the-season-turner"),
  },
  {
    id: "the-hearth-keeper",
    name: "The Hearth Keeper",
    tagline: "Old ways, kept alive, become new gifts.",
    icon: "Flame",
    color: "text-red-600",
    audience: "Folk practitioners, heritage preservation groups",
    description:
      "A warm guide for folk tradition and ancestral practice communities, tending the living heritage of handcraft, seasonal custom, and the household arts passed quietly through generations.",
    whyItMatters:
      "Folk traditions encode centuries of practical wisdom and cultural identity. Preserving them in living practice — not just museums — keeps communities connected to their roots.",
    config: getPatternConfig("the-hearth-keeper"),
  },

  // ─────────────────────────────────────────────────────────────────
  // Category 3: Maker & Craft Cultures
  // ─────────────────────────────────────────────────────────────────
  {
    id: "the-baker",
    name: "The Baker",
    tagline: "Good bread takes time — and that is the whole point.",
    icon: "Wheat",
    color: "text-amber-600",
    audience: "Home bakers, bread enthusiasts, bakery communities",
    description:
      "A flour-dusted guide for the baking community, covering sourdough culture, laminated doughs, the science of fermentation, and the deep satisfaction of making bread by hand.",
    whyItMatters:
      "Bread-baking is one of humanity's oldest communal acts. Its revival in home kitchens reconnects people to slow, embodied, nourishing practice — a counterweight to a hurried world.",
    config: getPatternConfig("the-baker"),
  },
  {
    id: "the-fiber-artist",
    name: "The Fiber Artist",
    tagline: "One stitch at a time — and suddenly: a world.",
    icon: "Ribbon",
    color: "text-pink-600",
    audience: "Knitting circles, fiber arts groups",
    description:
      "A pattern-savvy guide for knitters, crocheters, weavers, and spinners — celebrating the meditative craft of fiber, the mathematics of pattern, and the warmth of textile community.",
    whyItMatters:
      "Fiber arts have kept communities warm, funded economies, and encoded cultural identity for millennia. Today they offer calm focus and tangible creation in a digital world.",
    config: getPatternConfig("the-fiber-artist"),
  },
  {
    id: "the-woodworker",
    name: "The Woodworker",
    tagline: "Wood remembers the tree. Honor it with your hands.",
    icon: "Hammer",
    color: "text-stone-700",
    audience: "Woodworking shops, maker spaces",
    description:
      "A seasoned guide for woodworkers and carpenters, covering hand tool technique, joinery, wood selection, finishing, and the meditative satisfaction of shaping something lasting with your hands.",
    whyItMatters:
      "Woodworking connects people to material reality — grain, growth rings, weight, and time. In makerspaces and backyards, it is rebuilding the human capacity for patient, skilled creation.",
    config: getPatternConfig("the-woodworker"),
  },
  {
    id: "the-potter",
    name: "The Potter",
    tagline: "Clay holds the shape of the hands that moved it.",
    icon: "CircleDot",
    color: "text-orange-700",
    audience: "Pottery studios, ceramic artists",
    description:
      "An earth-and-fire guide for the ceramics community, navigating the full arc of clay work: wedging, throwing, hand-building, glazing, and the transformative magic of the kiln.",
    whyItMatters:
      "Ceramics is the art form that has outlasted every civilization. Its practice teaches patience, failure-tolerance, and the beauty of imperfection — lessons with far wider application.",
    config: getPatternConfig("the-potter"),
  },
  {
    id: "the-tinkerer",
    name: "The Tinkerer",
    tagline: "If you can break it, you can fix it. Probably.",
    icon: "Wrench",
    color: "text-blue-600",
    audience: "Makerspaces, hackerspaces, repair cafes",
    description:
      "A curious, scrappy guide for the maker community — from soldering circuits to 3D printing prototypes, from repairing what is broken to building what does not exist yet.",
    whyItMatters:
      "Maker culture is rebuilding a world of fixers and creators in an age of disposability. Every repair cafe and makerspace is a small revolution against planned obsolescence.",
    config: getPatternConfig("the-tinkerer"),
  },
  {
    id: "the-garden-tender",
    name: "The Garden Tender",
    tagline: "Dig in. The soil knows what it is doing.",
    icon: "Sprout",
    color: "text-green-600",
    audience: "Community gardens, plant lovers, urban farmers",
    description:
      "A soil-savvy guide for gardeners and growers of all kinds — from windowsill herb planters to quarter-acre food gardens — celebrating seeds, seasons, pollinators, and the miracle of things that grow.",
    whyItMatters:
      "Community gardening builds food security, ecological literacy, and neighborhood bonds. Every seed planted is an act of hope and an investment in shared resilience.",
    config: getPatternConfig("the-garden-tender"),
  },

  // ─────────────────────────────────────────────────────────────────
  // Category 4: Animal Lover Communities
  // ─────────────────────────────────────────────────────────────────
  {
    id: "the-pack-leader",
    name: "The Pack Leader",
    tagline: "Dogs already know how to be loyal. We are still learning.",
    icon: "Dog",
    color: "text-amber-800",
    audience: "Dog owners, rescue organizations, training groups",
    description:
      "An enthusiastic guide for the dog community — training, rescue, breed welfare, canine nutrition, and the profound bond between humans and their dogs across every size and temperament.",
    whyItMatters:
      "Dogs are humanity's oldest interspecies partnership. Responsible ownership, ethical breeding, and rescue culture make that relationship healthier and more humane for both species.",
    config: getPatternConfig("the-pack-leader"),
  },
  {
    id: "the-bird-watcher",
    name: "The Bird Watcher",
    tagline: "Every lifer is a reminder that the world is still full of wonders.",
    icon: "Bird",
    color: "text-sky-600",
    audience: "Birders, Audubon societies, ornithology groups",
    description:
      "A life-list-loving guide for the birding community — from backyard feeders to epic migrations, field ID to bird-friendly conservation, with the contagious joy that only birding brings.",
    whyItMatters:
      "Birders form one of the world's largest citizen science communities, generating invaluable data on population shifts, migration, and climate impact across every ecosystem.",
    config: getPatternConfig("the-bird-watcher"),
  },
  {
    id: "the-reef-guardian",
    name: "The Reef Guardian",
    tagline: "Every tank is a window into the ocean's urgent story.",
    icon: "Fish",
    color: "text-teal-600",
    audience: "Aquarists, marine biology enthusiasts",
    description:
      "A saltwater-savvy guide for the aquarium community — reef tank chemistry, fish keeping, coral husbandry, and the intersection of the hobby with marine conservation.",
    whyItMatters:
      "Aquarists have become unlikely conservation champions, funding coral research, supporting captive breeding programs, and building public understanding of marine ecosystems under threat.",
    config: getPatternConfig("the-reef-guardian"),
  },
  {
    id: "the-barn-keeper",
    name: "The Barn Keeper",
    tagline: "The barn knows the rhythm of a life well-lived.",
    icon: "Anchor",
    color: "text-brown-700 text-amber-900",
    audience: "Equestrians, small farmers, 4-H groups",
    description:
      "A barn-boot guide for equestrian and farm animal communities — horses, livestock, rural life, and the demanding, rewarding world of caring for large animals with skill and devotion.",
    whyItMatters:
      "Agricultural communities carry irreplaceable knowledge of animal husbandry, land stewardship, and rural life. Supporting them sustains food systems and the fabric of rural communities.",
    config: getPatternConfig("the-barn-keeper"),
  },

  // ─────────────────────────────────────────────────────────────────
  // Category 5: Top Hobby Cultures by Country (Top 10 by population)
  // ─────────────────────────────────────────────────────────────────
  {
    id: "the-rangoli-maker",
    name: "The Rangoli Maker",
    tagline: "Every threshold is a canvas; every festival, an invitation.",
    icon: "Flower",
    color: "text-fuchsia-600",
    audience: "Indian arts communities, festival organizers",
    description:
      "A vibrant guide for rangoli, kolam, and traditional Indian craft communities — celebrating the artistry of geometric pattern, natural pigment, and the doorstep as an offering of welcome.",
    whyItMatters:
      "Rangoli and kolam traditions encode mathematical sophistication, ecological knowledge, and communal aesthetic values that have sustained Indian cultural life for thousands of years.",
    config: getPatternConfig("the-rangoli-maker"),
  },
  {
    id: "the-calligrapher",
    name: "The Calligrapher",
    tagline: "The brush carries the mind. The character reveals the character.",
    icon: "Pen",
    color: "text-slate-700",
    audience: "Calligraphy societies, Chinese cultural groups",
    description:
      "A brush-and-ink guide for Chinese calligraphy, painting, and tea ceremony communities — honoring the contemplative disciplines that transform daily practice into living art.",
    whyItMatters:
      "Chinese calligraphy is both fine art and meditative discipline, encoding classical literature, aesthetic philosophy, and cultural identity in every brushstroke. Its practice is a form of cultural continuity.",
    config: getPatternConfig("the-calligrapher"),
  },
  {
    id: "the-pitmaster",
    name: "The Pitmaster",
    tagline: "Low and slow. That is the whole philosophy.",
    icon: "Flame",
    color: "text-orange-800",
    audience: "BBQ enthusiasts, grilling communities, cookoff competitors",
    description:
      "A smoke-ring-certified guide for American BBQ culture — from brisket to ribs, offset smokers to kamado grills, competition cookoffs to backyard celebrations.",
    whyItMatters:
      "American BBQ is a living tradition of community gathering, regional identity, and the mastery of fire, time, and smoke. It brings neighborhoods together around a shared table.",
    config: getPatternConfig("the-pitmaster"),
  },
  {
    id: "the-batik-weaver",
    name: "The Batik Weaver",
    tagline: "Every wax line holds the memory of a tradition still living.",
    icon: "Brush",
    color: "text-indigo-700",
    audience: "Batik artists, Indonesian cultural preservation groups",
    description:
      "A wax-and-dye guide for batik textile art and traditional Indonesian crafts — celebrating the canting technique, regional motifs, and the UNESCO-recognized living tradition of batik.",
    whyItMatters:
      "Indonesian batik is a UNESCO Intangible Cultural Heritage, encoding cosmological, social, and artistic knowledge in every motif. Its living practice sustains communities and artisan livelihoods.",
    config: getPatternConfig("the-batik-weaver"),
  },
  {
    id: "the-cricket-coach",
    name: "The Cricket Coach",
    tagline: "Cricket is not a game. It is a village commons with stumps.",
    icon: "Target",
    color: "text-green-700",
    audience: "Cricket clubs, youth sports organizations",
    description:
      "An enthusiastic guide for cricket and street sport culture — coaching techniques, player development, the tactical depth of the game, and cricket as a vehicle for community cohesion.",
    whyItMatters:
      "Cricket is one of the world's most widely played sports, building discipline, teamwork, and cross-community bonds from gully cricket to test match level.",
    config: getPatternConfig("the-cricket-coach"),
  },
  {
    id: "the-drum-caller",
    name: "The Drum Caller",
    tagline: "The drum does not lie. Neither does the dancer who answers it.",
    icon: "Drum",
    color: "text-yellow-700",
    audience: "Drummers, music communities, cultural festivals",
    description:
      "A rhythm-deep guide for West African drumming circles, Afrobeat ensembles, and music-making communities — celebrating the drum as communication, ceremony, and community heartbeat.",
    whyItMatters:
      "West African drumming traditions carry complex polyrhythmic intelligence, historical narrative, and community-building power that influenced virtually all popular music worldwide.",
    config: getPatternConfig("the-drum-caller"),
  },
  {
    id: "the-samba-heart",
    name: "The Samba Heart",
    tagline: "If the music moves you, you are already dancing.",
    icon: "Heart",
    color: "text-red-500",
    audience: "Dance schools, capoeira groups, carnival communities",
    description:
      "A pulse-raising guide for samba, capoeira, forró, and Brazilian movement culture — celebrating the joy, athleticism, and deep community roots of Brazil's living dance traditions.",
    whyItMatters:
      "Brazilian dance and movement traditions are powerful expressions of cultural resilience and community identity, blending African, Indigenous, and European heritage into something entirely new.",
    config: getPatternConfig("the-samba-heart"),
  },
  {
    id: "the-rickshaw-poet",
    name: "The Rickshaw Poet",
    tagline: "Art rolls through every street; you only have to look.",
    icon: "Palette",
    color: "text-cyan-700",
    audience: "Folk art communities, literary groups",
    description:
      "A color-splashed guide for Bangladeshi rickshaw art, river culture, and Bengali literary traditions — celebrating the vivid folk artistry that turns every cycle rickshaw into a moving gallery.",
    whyItMatters:
      "Bangladeshi rickshaw painting is a unique folk art form that democratizes beauty, bringing hand-painted masterpieces into everyday street life while sustaining artisan livelihoods.",
    config: getPatternConfig("the-rickshaw-poet"),
  },
  {
    id: "the-samovar-host",
    name: "The Samovar Host",
    tagline: "Around a good table, the world's problems become discussable.",
    icon: "Users",
    color: "text-red-800",
    audience: "Chess clubs, tea enthusiasts, community centers",
    description:
      "A warm guide for Russian and post-Soviet traditions of communal gathering — samovar tea culture, chess, dacha life, and the art of the long, unhurried conversation around a shared table.",
    whyItMatters:
      "Communal tea and chess culture has sustained intellectual and social life across generations and political upheavals, demonstrating how simple shared rituals build enduring community.",
    config: getPatternConfig("the-samovar-host"),
  },
  {
    id: "the-coffee-roaster",
    name: "The Coffee Roaster",
    tagline: "Coffee was born here. Every cup is a homecoming.",
    icon: "Flame",
    color: "text-brown-800 text-amber-950",
    audience: "Coffee enthusiasts, Ethiopian cultural groups",
    description:
      "A rich-roasted guide for the Ethiopian coffee ceremony culture — celebrating the birthplace of coffee through the jebena ritual, green bean selection, and the communal slowness of three pours.",
    whyItMatters:
      "Ethiopia is the origin of all coffee culture on Earth. The coffee ceremony is a living tradition of hospitality, community, and sensory pleasure that deserves global recognition and respect.",
    config: getPatternConfig("the-coffee-roaster"),
  },

  // ─────────────────────────────────────────────────────────────────
  // Category 6: Rotary International
  // ─────────────────────────────────────────────────────────────────
  {
    id: "the-four-way-tester",
    name: "The Four-Way Tester",
    tagline: "Four questions. Every decision. No exceptions.",
    icon: "Scale",
    color: "text-blue-700",
    audience: "Rotarians, community service organizations, ethics-focused groups",
    description:
      "An ethics-centered guide for Rotary International communities, applying the Four-Way Test — Is it the TRUTH? Is it FAIR? Will it build GOODWILL? Will it be BENEFICIAL? — to every decision and every interaction.",
    whyItMatters:
      "The Four-Way Test is one of the most elegant and practical ethical frameworks ever devised for public and professional life. Rotary's global network uses it to build communities of service, trust, and mutual uplift.",
    config: getPatternConfig("the-four-way-tester"),
  },
];
