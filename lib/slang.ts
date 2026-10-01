// A hand-picked Gen Z slang deck. Urban Dictionary (the PRD's suggested source) is
// unfiltered and often explicit, so instead every term here is written and reviewed by
// hand: what it means, the vibe, a natural example and where it's safe to use.

export type Register = "friends" | "online" | "casual";
export type SlangTerm = { term: string; meaning: string; vibe: string[]; example: string; register: Register; note: string };

export const REGISTER_LABEL: Record<Register, string> = {
  friends: "friends only",
  online: "online & texts",
  casual: "casual anywhere",
};

export const SLANG: SlangTerm[] = [
  { term: "delulu", meaning: "Short for “delusional” — happily believing something unrealistic, usually about yourself.", vibe: ["playful", "self-aware"], example: "I'm going delulu and applying for the senior role anyway.", register: "friends", note: "Fine with friends, never in a cover letter." },
  { term: "rizz", meaning: "Charm, especially the ability to flirt or win people over.", vibe: ["teasing", "complimentary"], example: "He talked his way into the sold-out show — unreal rizz.", register: "friends", note: "Oxford's Word of the Year 2023, but still strictly casual." },
  { term: "no cap", meaning: "“No lie” — what I'm saying is completely true.", vibe: ["emphatic", "sincere"], example: "That was the best pizza I've ever had, no cap.", register: "friends", note: "“Cap” on its own means a lie: “that's cap.”" },
  { term: "bet", meaning: "“OK”, “deal” or “sounds good” — agreeing to a plan.", vibe: ["chill", "agreeable"], example: "“Pick you up at seven?” “Bet.”", register: "online", note: "A one-word reply; can read as curt to older colleagues." },
  { term: "slay", meaning: "To do something brilliantly, or look amazing.", vibe: ["hype", "complimentary"], example: "You slayed that presentation.", register: "casual", note: "Warm and positive — usually safe in friendly settings." },
  { term: "ate", meaning: "Did something perfectly — often “ate and left no crumbs.”", vibe: ["hype", "complimentary"], example: "Her outfit at the premiere? She ate.", register: "friends", note: "Past tense only in this sense: “she ate,” not “she eats.”" },
  { term: "mid", meaning: "Mediocre; average and a bit disappointing.", vibe: ["dismissive", "blunt"], example: "Everyone hyped that sequel, but honestly it was mid.", register: "casual", note: "Mildly rude about someone's work — fine about films and food." },
  { term: "lowkey", meaning: "Quietly, a little, or secretly — softening what follows.", vibe: ["understated", "honest"], example: "I lowkey want to skip the party and sleep.", register: "casual", note: "Its opposite is “highkey”: openly, very much." },
  { term: "highkey", meaning: "Openly and strongly — no hiding it.", vibe: ["emphatic", "honest"], example: "I highkey love this song.", register: "casual", note: "Pairs with “lowkey” — the two are often contrasted." },
  { term: "it's giving", meaning: "It has the feel or energy of something — “it's giving vintage.”", vibe: ["playful", "descriptive"], example: "Those curtains? It's giving grandma's living room.", register: "friends", note: "Sometimes just “it's giving” alone means “it's great.”" },
  { term: "main character energy", meaning: "Acting like the star of your own film — confident, a bit dramatic.", vibe: ["playful", "confident"], example: "Walking in the rain with headphones on is pure main character energy.", register: "casual", note: "Can be a compliment or a gentle tease." },
  { term: "situationship", meaning: "A romantic relationship that's more than friends but never officially defined.", vibe: ["wry", "relatable"], example: "Three months of dates and no label — it's a situationship.", register: "casual", note: "Common in articles and podcasts, not just texts." },
  { term: "touch grass", meaning: "Go outside — you've been online too long and lost perspective.", vibe: ["teasing", "blunt"], example: "You're arguing with strangers about fonts at 2 a.m. Touch grass.", register: "online", note: "A put-down; joke with friends, don't aim it at strangers." },
  { term: "understood the assignment", meaning: "Got exactly what was needed and delivered it perfectly.", vibe: ["complimentary", "hype"], example: "The wedding theme was 1920s and every guest understood the assignment.", register: "casual", note: "Friendly enough for a team chat." },
  { term: "rent free", meaning: "Something you can't stop thinking about — it “lives in your head rent free.”", vibe: ["wry", "relatable"], example: "That awkward thing I said in 2019 lives in my head rent free.", register: "casual", note: "Also used for rivals: “I live in their head rent free.”" },
  { term: "caught in 4K", meaning: "Caught red-handed, with clear proof.", vibe: ["teasing", "dramatic"], example: "He said he was sick, then posted from the concert — caught in 4K.", register: "friends", note: "4K = ultra-high-definition video." },
  { term: "glow up", meaning: "A big positive transformation in looks, confidence or life.", vibe: ["complimentary", "uplifting"], example: "Her glow up since college is incredible.", register: "casual", note: "Also a verb: “he really glowed up.”" },
  { term: "NPC", meaning: "Someone acting robotically, like a background character in a video game.", vibe: ["teasing", "dismissive"], example: "I was so tired I just stood in the queue like an NPC.", register: "friends", note: "Fine about yourself; insulting about others." },
  { term: "the ick", meaning: "A sudden feeling of being put off by someone, often over something small.", vibe: ["dramatic", "relatable"], example: "He clapped when the plane landed and I got the ick.", register: "casual", note: "Usually “get the ick” or “give someone the ick.”" },
  { term: "beige flag", meaning: "A harmless quirk in a partner that's odd rather than good or bad.", vibe: ["playful", "wry"], example: "Beige flag: he names all his houseplants.", register: "casual", note: "A spin on “red flag” and “green flag.”" },
  { term: "red flag", meaning: "A warning sign that something or someone may be bad news.", vibe: ["serious", "warning"], example: "Being rude to waiters is a huge red flag.", register: "casual", note: "Widely used beyond Gen Z — even at work." },
  { term: "green flag", meaning: "A good sign — a quality that shows someone is healthy or trustworthy.", vibe: ["positive", "warm"], example: "He remembered my coffee order — green flag.", register: "casual", note: "The opposite of a red flag." },
  { term: "era", meaning: "A phase of life defined by a mood or habit — “my gym era.”", vibe: ["playful", "self-aware"], example: "I'm in my early-to-bed era and I love it.", register: "casual", note: "Popularised by Taylor Swift's Eras Tour." },
  { term: "-core", meaning: "A suffix for an aesthetic or vibe — cottagecore, gorpcore, normcore.", vibe: ["descriptive", "trendy"], example: "Linen, sourdough and wildflowers — very cottagecore.", register: "casual", note: "Attach it to almost anything: “Monday-core.”" },
  { term: "Roman Empire", meaning: "Something you think about surprisingly often.", vibe: ["playful", "relatable"], example: "That one goal from the 2014 World Cup is my Roman Empire.", register: "casual", note: "From a viral trend asking men how often they think about Rome." },
  { term: "gatekeep", meaning: "To keep something good (a place, a tip) to yourself.", vibe: ["teasing", "playful"], example: "Tell me where you got that jacket — don't gatekeep.", register: "casual", note: "Often joked: “gaslight, gatekeep, girlboss.”" },
  { term: "yap", meaning: "To talk a lot, often about nothing much.", vibe: ["teasing", "casual"], example: "Sorry for the voice note, I was yapping for six minutes.", register: "friends", note: "“Yapper” = someone who talks constantly." },
  { term: "aura", meaning: "The cool, impressive vibe someone gives off — gain or lose “aura points.”", vibe: ["playful", "hype"], example: "Tripping on stage cost me serious aura.", register: "friends", note: "Often counted jokingly: “+1000 aura.”" },
  { term: "cooked", meaning: "Doomed or in serious trouble.", vibe: ["dramatic", "relatable"], example: "Exam's tomorrow and I haven't opened the book. I'm cooked.", register: "friends", note: "Different from “let him cook,” which is positive." },
  { term: "let him cook", meaning: "Let them carry on — they might be onto something brilliant.", vibe: ["supportive", "playful"], example: "His plan sounds wild, but let him cook.", register: "casual", note: "Works for anyone: “let her cook.”" },
  { term: "locked in", meaning: "Fully focused and determined.", vibe: ["motivated", "intense"], example: "Phone's off, coffee's ready — I'm locked in.", register: "casual", note: "Safe in a team chat about deadlines." },
  { term: "brain rot", meaning: "Low-quality online content, or the dulled feeling from scrolling too much.", vibe: ["self-aware", "wry"], example: "Two hours of short videos and now I have brain rot.", register: "casual", note: "Oxford's Word of the Year 2024." },
  { term: "glazing", meaning: "Praising someone excessively — over-the-top flattery.", vibe: ["teasing", "skeptical"], example: "Stop glazing the coach — we lost by three.", register: "friends", note: "Calling out praise as too much." },
  { term: "W / L", meaning: "Win / loss — a quick verdict on anything.", vibe: ["blunt", "quick"], example: "Free upgrade to first class? Massive W.", register: "online", note: "“Take the L” = accept the loss." },
  { term: "ratio", meaning: "When a reply gets more likes than the post it answers — the reply “won.”", vibe: ["competitive", "online"], example: "His hot take got ratioed in an hour.", register: "online", note: "Mostly about social media." },
  { term: "based", meaning: "Confidently holding your own opinion, regardless of what's popular.", vibe: ["approving", "bold"], example: "Pineapple on pizza and not apologising? Based.", register: "online", note: "Approval of boldness, not necessarily agreement." },
  { term: "cheugy", meaning: "Trying to be trendy but a few years out of date.", vibe: ["teasing", "dismissive"], example: "“Live, laugh, love” wall art is a bit cheugy now.", register: "friends", note: "Itself became slightly cheugy." },
  { term: "iykyk", meaning: "“If you know, you know” — an inside reference.", vibe: ["mysterious", "playful"], example: "That café's secret menu, iykyk.", register: "online", note: "Written, rarely said aloud." },
  { term: "fr", meaning: "“For real” — agreeing strongly or stressing truth.", vibe: ["emphatic", "agreeable"], example: "This weather is unbearable fr.", register: "online", note: "“Fr fr” doubles the emphasis." },
  { term: "tea", meaning: "Gossip or juicy news — “spill the tea.”", vibe: ["curious", "playful"], example: "You saw them argue? Spill the tea.", register: "friends", note: "From drag culture, now mainstream." },
  { term: "sending me", meaning: "Making me laugh really hard.", vibe: ["amused", "playful"], example: "The dog in a raincoat is sending me.", register: "friends", note: "Similar: “I'm dead” = that's hilarious." },
  { term: "hits different", meaning: "Feels unusually good or special in this moment.", vibe: ["nostalgic", "warm"], example: "Chai on a rainy evening just hits different.", register: "casual", note: "Grammatically “wrong” on purpose." },
  { term: "GOAT", meaning: "“Greatest of all time.”", vibe: ["hype", "admiring"], example: "Messi is the GOAT, don't argue.", register: "casual", note: "Very widely used, including by sports media." },
  { term: "vibe check", meaning: "A quick read of someone's mood or a place's energy.", vibe: ["playful", "casual"], example: "Vibe check before the meeting: is everyone stressed?", register: "casual", note: "“Passed the vibe check” = all good." },
  { term: "bussin", meaning: "Really delicious (mostly food).", vibe: ["hype", "enthusiastic"], example: "This biryani is bussin.", register: "friends", note: "Comes from African American English." },
  { term: "sus", meaning: "Suspicious or shady.", vibe: ["skeptical", "playful"], example: "He's being very nice today — kinda sus.", register: "casual", note: "Popularised by the game Among Us." },
  { term: "salty", meaning: "Bitter or annoyed, usually over something small.", vibe: ["teasing", "petty"], example: "Still salty that I lost the quiz by one point.", register: "casual", note: "Older slang that Gen Z kept." },
  { term: "extra", meaning: "Over the top; more dramatic than needed.", vibe: ["teasing", "dramatic"], example: "A 40-slide deck for a 5-minute update is so extra.", register: "casual", note: "Light teasing, rarely offensive." },
  { term: "flex", meaning: "To show off — or the thing you're showing off.", vibe: ["teasing", "proud"], example: "Getting a reply from the CEO? Weird flex, but OK.", register: "casual", note: "“Weird flex but OK” is a classic reply." },
  { term: "drip", meaning: "Stylish clothes and accessories.", vibe: ["complimentary", "hype"], example: "The drip at that wedding was unmatched.", register: "friends", note: "Mostly about fashion." },
  { term: "snatched", meaning: "Looking sharp and put-together — a top compliment on appearance.", vibe: ["complimentary", "hype"], example: "Your haircut has you looking snatched.", register: "friends", note: "Keep it for friends; personal appearance comments can misfire." },
  { term: "shook", meaning: "Shocked or deeply surprised.", vibe: ["dramatic", "surprised"], example: "The plot twist had me shook.", register: "casual", note: "Grammatically odd on purpose (not “shaken”)." },
  { term: "periodt", meaning: "End of discussion — said to close an argument emphatically.", vibe: ["emphatic", "sassy"], example: "Sunday brunch is the best meal of the week, periodt.", register: "friends", note: "The extra “t” adds attitude." },
  { term: "big yikes", meaning: "That's really embarrassing or awkward.", vibe: ["cringing", "playful"], example: "Replied-all to the whole company by mistake? Big yikes.", register: "casual", note: "“Yikes” on its own is milder." },
  { term: "simp", meaning: "Someone who does far too much to impress a person they like.", vibe: ["teasing", "mocking"], example: "He drove three hours just to drop off her charger — total simp.", register: "friends", note: "Can sound mean; use only as friendly teasing." },
  { term: "stan", meaning: "To be a devoted fan of someone or something.", vibe: ["enthusiastic", "loyal"], example: "I stan a band that only has two albums.", register: "online", note: "From the Eminem song “Stan.”" },
  { term: "bestie", meaning: "Best friend — or a warm way to address anyone.", vibe: ["warm", "playful"], example: "Bestie, you left your keys in the door.", register: "casual", note: "Often used ironically with strangers online." },
  { term: "girl dinner", meaning: "A low-effort meal assembled from snacks — cheese, crackers, fruit.", vibe: ["playful", "relatable"], example: "Tonight's girl dinner: toast, olives and half a mango.", register: "casual", note: "Spawned “boy dinner” and many spin-offs." },
  { term: "core memory", meaning: "A moment so vivid it shapes who you are.", vibe: ["nostalgic", "warm"], example: "Dad teaching me to ride a bike is a core memory.", register: "casual", note: "From Pixar's Inside Out." },
  { term: "hard launch", meaning: "Openly announcing a relationship online, face fully shown.", vibe: ["playful", "dramatic"], example: "After months of hints, she hard-launched him on Instagram.", register: "casual", note: "A “soft launch” only hints — a hand, a second plate." },
];

/** Today's batch: terms you marked new first, then fresh ones, seeded by date so it's stable. */
export function todaysBatch(known: Set<string>, newToMe: Set<string>, rand: () => number, n = 8) {
  const review = SLANG.filter((s) => newToMe.has(s.term) && !known.has(s.term));
  const fresh = SLANG.filter((s) => !newToMe.has(s.term) && !known.has(s.term));
  const shuffled = [...fresh].sort(() => rand() - 0.5);
  const batch = [...review.slice(0, Math.ceil(n / 2)), ...shuffled].slice(0, n);
  // Everything known? Revisit a few at random so the deck never runs dry.
  return batch.length ? batch : [...SLANG].sort(() => rand() - 0.5).slice(0, n);
}
