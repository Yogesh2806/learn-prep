import type { GrammarCardContent, PunctItem } from "./ai-types";
import type { GRAMMAR_TOPICS, PUNCTUATION_TOPICS } from "./english-data";

// The core of every grammar and punctuation card is curated: the rule, where it matters,
// the classic mistake and one check with a hand-verified answer key. These render
// instantly and offline; the model only adds fresh examples and extra checks on top.

type Topic = (typeof GRAMMAR_TOPICS)[number] | (typeof PUNCTUATION_TOPICS)[number];

export const TOPIC_LESSONS: Record<Topic, GrammarCardContent> = {
  // ---------------------------------------------------------------- grammar
  "Subject–verb agreement": {
    rule: "A singular subject takes a singular verb and a plural subject a plural one — even when other words sit between them.",
    whereToApply: "Long subjects in emails and reports, where the real subject is far from its verb.",
    examples: ["The list of new features is ready for review.", "The people on the call were all from marketing."],
    mistake: { wrong: "The quality of the photos are great.", right: "The quality of the photos is great.", why: "The subject is “quality” (singular), not “photos”." },
    practice: { question: "Which sentence is correct?", options: ["Each of the players have a locker.", "Each of the players has a locker.", "Each of the players are having a locker."], answer: 1, why: "“Each” is singular, so it takes “has”." },
  },
  "Articles: a, an, the": {
    rule: "Use a/an for one thing that isn't specific yet, and the for something both of you can identify. Choose a or an by sound, not spelling.",
    whereToApply: "Introducing something new in a story or email, then referring back to it.",
    examples: ["I watched a documentary last night. The documentary was about sleep.", "It took an hour to fix a one-line bug."],
    mistake: { wrong: "She's a honest person.", right: "She's an honest person.", why: "“Honest” starts with a vowel sound (the h is silent), so it takes “an”." },
    practice: { question: "Fill the gap: “He has ___ MBA from a top school.”", options: ["a", "an", "the"], answer: 1, why: "“MBA” is said “em-bee-ay”, starting with a vowel sound, so it takes “an”." },
  },
  "Countable vs uncountable nouns": {
    rule: "Countable nouns have plurals and take a/many/few; uncountable nouns (advice, information, furniture) have no plural and take much/little.",
    whereToApply: "Work emails, where “informations”, “advices” and “feedbacks” are common slips.",
    examples: ["Can you give me some advice on the pitch?", "We don't have much information yet."],
    mistake: { wrong: "Thanks for all the feedbacks.", right: "Thanks for all the feedback.", why: "“Feedback” is uncountable, so it has no plural form." },
    practice: { question: "Which is correct?", options: ["We bought three new furnitures.", "We bought three new pieces of furniture.", "We bought three new furniture."], answer: 1, why: "“Furniture” is uncountable; count it with “pieces of”." },
  },
  "Fewer vs less": {
    rule: "Use fewer with things you can count and less with amounts you can't count.",
    whereToApply: "Reports and dashboards: fewer users, less traffic; fewer bugs, less time.",
    examples: ["We had fewer complaints this month.", "The new build uses less memory."],
    mistake: { wrong: "Ten items or less.", right: "Ten items or fewer.", why: "Items can be counted, so formal English uses “fewer” (the supermarket sign is a famous exception)." },
    practice: { question: "Fill the gap: “There were ___ people at the launch than we expected.”", options: ["less", "fewer", "lesser"], answer: 1, why: "People are countable, so it's “fewer”." },
  },
  "Who vs whom": {
    rule: "Who is a subject (who did it); whom is an object (whom it was done to). Test it: if “him” fits, use whom; if “he” fits, use who.",
    whereToApply: "Formal writing and cover letters; in casual speech, “who” is fine almost everywhere.",
    examples: ["Who sent this email?", "To whom should I address the letter?"],
    mistake: { wrong: "Whom is responsible for this?", right: "Who is responsible for this?", why: "“He is responsible” — it's the subject, so it takes “who”." },
    practice: { question: "Fill the gap: “The candidate ___ we interviewed has accepted.”", options: ["who", "whom", "whose"], answer: 1, why: "“We interviewed him” — it's the object, so formal English uses “whom”." },
  },
  "Me vs I": {
    rule: "Use I as a subject and me as an object. Drop the other person to check: “Sam and I went” (I went), “She called Sam and me” (she called me).",
    whereToApply: "Emails and speech, where “between you and I” sounds formal but is wrong.",
    examples: ["Priya and I will present on Monday.", "Send the file to Priya and me."],
    mistake: { wrong: "Please contact John or myself.", right: "Please contact John or me.", why: "“Myself” is only for when the subject is also you (I hurt myself). Here it's a plain object." },
    practice: { question: "Which is correct?", options: ["This stays between you and I.", "This stays between you and me.", "This stays between you and myself."], answer: 1, why: "After a preposition like “between”, use the object form “me”." },
  },
  "Its vs it's": {
    rule: "It's always means “it is” or “it has”. Its (no apostrophe) means “belonging to it”, like his or her.",
    whereToApply: "Every quick message and caption — it's one of the most visible slips online.",
    examples: ["It's been a long week.", "The company changed its logo."],
    mistake: { wrong: "The app updated it's design.", right: "The app updated its design.", why: "You can't say “updated it is design”, so no apostrophe." },
    practice: { question: "Fill the gap: “The team won ___ first game.”", options: ["it's", "its", "its'"], answer: 1, why: "It's possession (the game belongs to the team), so “its”." },
  },
  "Their, there, they're": {
    rule: "Their = belonging to them. There = a place, or “there is/are”. They're = they are.",
    whereToApply: "Fast typing in chats and comments, where autocorrect won't save you.",
    examples: ["They're bringing their own laptops.", "There are two seats over there."],
    mistake: { wrong: "Their going to be late.", right: "They're going to be late.", why: "The meaning is “they are going”, so it's “they're”." },
    practice: { question: "Fill the gap: “The guests left ___ coats in the hall.”", options: ["their", "there", "they're"], answer: 0, why: "The coats belong to them, so “their”." },
  },
  "Affect vs effect": {
    rule: "Affect is usually the verb (to influence). Effect is usually the noun (the result). Memory aid: Affect = Action, Effect = End result.",
    whereToApply: "Reports and analysis: “the change affected sign-ups” vs “the change had an effect on sign-ups”.",
    examples: ["The delay affected the whole schedule.", "The new policy had a big effect on morale."],
    mistake: { wrong: "The weather will effect our plans.", right: "The weather will affect our plans.", why: "It's an action (to influence), so it takes the verb “affect”." },
    practice: { question: "Fill the gap: “What ___ did the ad campaign have?”", options: ["affect", "effect", "affects"], answer: 1, why: "After “what … did it have”, you need a noun: the result, “effect”." },
  },
  "Lay vs lie": {
    rule: "Lay needs an object — you lay something down. Lie has no object — you lie down. The trap: the past of lie is lay.",
    whereToApply: "Everyday speech and writing about resting, placing things and tiredness.",
    examples: ["Lay the documents on the desk.", "I'm going to lie down for a bit."],
    mistake: { wrong: "I'm going to lay down.", right: "I'm going to lie down.", why: "There's no object (you aren't laying something), so it's “lie”." },
    practice: { question: "Fill the gap: “Yesterday I ___ in bed until noon.”", options: ["laid", "lay", "lied"], answer: 1, why: "The past tense of “lie” (recline) is “lay”." },
  },
  "Comparatives and superlatives": {
    rule: "Short adjectives add -er/-est (faster, fastest); longer ones use more/most (more useful). Never combine both.",
    whereToApply: "Comparing options in reviews, pitches and product decisions.",
    examples: ["This plan is cheaper than the last one.", "It's the most reliable tool we've used."],
    mistake: { wrong: "This one is more better.", right: "This one is better.", why: "“Better” is already a comparative; adding “more” doubles it." },
    practice: { question: "Which is correct?", options: ["She's the most smartest person here.", "She's the smartest person here.", "She's the more smart person here."], answer: 1, why: "“Smart” is short, so the superlative is “smartest”, with no “most”." },
  },
  "Conditionals (zero to third)": {
    rule: "Zero: facts (if + present, present). First: real future (if + present, will). Second: imagined now (if + past, would). Third: imagined past (if + had done, would have done).",
    whereToApply: "Negotiating, giving advice and talking about regrets or what-ifs.",
    examples: ["If you heat ice, it melts.", "If I had known, I would have called."],
    mistake: { wrong: "If I would have known, I would have come.", right: "If I had known, I would have come.", why: "The if-clause of a third conditional takes “had + participle”, not “would have”." },
    practice: { question: "Fill the gap: “If I ___ you, I'd take the offer.”", options: ["am", "were", "will be"], answer: 1, why: "An imagined present (second conditional) uses the past form; formal English prefers “were”." },
  },
  "Passive voice — when to use it": {
    rule: "The passive (be + past participle) puts the thing acted on first. Use it when the doer is unknown, unimportant or obvious; otherwise the active is clearer.",
    whereToApply: "Reports and news (“The data was collected in May”), and cautious or formal statements.",
    examples: ["The bridge was built in 1932.", "Mistakes were made."],
    mistake: { wrong: "The report was written by me yesterday and was sent by me to the team.", right: "I wrote the report yesterday and sent it to the team.", why: "When the doer matters and is known, the active voice is shorter and clearer." },
    practice: { question: "Which sentence is passive?", options: ["The chef cooked the meal.", "The meal was cooked by the chef.", "The chef was cooking the meal."], answer: 1, why: "“Was cooked” is be + past participle, with the thing acted on as the subject." },
  },
  "Reported speech": {
    rule: "When you report what someone said, the tense usually moves one step back and pronouns and time words shift: “I'm tired” → she said she was tired.",
    whereToApply: "Meeting notes, updates and retelling conversations.",
    examples: ["He said he would send it tomorrow.", "She told me she had already signed."],
    mistake: { wrong: "She said me that she was busy.", right: "She told me that she was busy.", why: "“Say” doesn't take a person as its object; use “tell someone” or “say to someone”." },
    practice: { question: "Report this: “I am leaving,” he said.", options: ["He said he is leaving.", "He said he was leaving.", "He said I was leaving."], answer: 1, why: "“Am leaving” moves back to “was leaving”, and “I” becomes “he”." },
  },
  "Modal verbs: should, would, could": {
    rule: "Should gives advice or expectation; would is for imagined situations and polite requests; could is for possibility, ability in the past, and polite requests.",
    whereToApply: "Polite requests and advice at work, where tone matters as much as grammar.",
    examples: ["You should back that file up.", "Could you send me the deck?"],
    mistake: { wrong: "You should to call her.", right: "You should call her.", why: "Modal verbs are followed by the base verb, without “to”." },
    practice: { question: "Which is the most polite request?", options: ["Send me the file.", "Could you send me the file?", "You should send me the file."], answer: 1, why: "“Could you…?” turns an instruction into a polite request." },
  },
  "Gerund vs infinitive": {
    rule: "Some verbs take -ing (enjoy, avoid, finish), some take to + verb (want, decide, hope), and some change meaning with each (stop, remember).",
    whereToApply: "Everyday sentences about plans, habits and preferences.",
    examples: ["I enjoy working with small teams.", "We decided to launch in May."],
    mistake: { wrong: "I'm looking forward to meet you.", right: "I'm looking forward to meeting you.", why: "Here “to” is a preposition, so it's followed by the -ing form." },
    practice: { question: "Which means he quit smoking?", options: ["He stopped to smoke.", "He stopped smoking.", "He stopped smoke."], answer: 1, why: "“Stop + -ing” ends the activity; “stop to smoke” means pausing in order to smoke." },
  },
  "Prepositions of time: in, on, at": {
    rule: "At for clock times and short points (at 5 p.m., at night); on for days and dates (on Monday); in for longer periods (in May, in 2026, in the morning).",
    whereToApply: "Scheduling messages and calendar invites.",
    examples: ["The call is at 3 p.m. on Friday.", "We launched in March."],
    mistake: { wrong: "See you in Monday.", right: "See you on Monday.", why: "Days take “on”." },
    practice: { question: "Fill the gap: “The shop closes ___ midnight.”", options: ["in", "on", "at"], answer: 2, why: "A precise point in time takes “at”." },
  },
  "That vs which": {
    rule: "That introduces information you need to identify the thing (no commas). Which, with commas, adds extra information you could remove.",
    whereToApply: "Formal writing and specs, where the comma changes the meaning.",
    examples: ["The laptop that I use for work is slow.", "My laptop, which is five years old, still works."],
    mistake: { wrong: "The bugs, that we found yesterday, are fixed.", right: "The bugs that we found yesterday are fixed.", why: "The clause identifies which bugs, so it takes “that” and no commas." },
    practice: { question: "Which sentence says you have only one car?", options: ["My car that is red is in the shop.", "My car, which is red, is in the shop.", "My car which is red is in the shop."], answer: 1, why: "The commas mark “which is red” as extra information, not a way to pick one car out of several." },
  },
  "Dangling modifiers": {
    rule: "An opening phrase describes the subject that comes right after it. If that subject isn't the one doing the action, the phrase dangles.",
    whereToApply: "Opening lines of emails, cover letters and captions.",
    examples: ["Walking to work, I saw an accident.", "After reviewing the data, we changed the plan."],
    mistake: { wrong: "Walking to work, the rain started.", right: "As I was walking to work, the rain started.", why: "As written, the rain is walking to work." },
    practice: { question: "Which sentence is correct?", options: ["Having finished the report, the coffee tasted great.", "Having finished the report, I enjoyed my coffee.", "Having finished the report, it was time for coffee."], answer: 1, why: "Only “I” can have finished the report, so “I” must follow the phrase." },
  },
  "Parallel structure": {
    rule: "Items in a list or comparison should share the same grammatical form: all -ing, all nouns, or all to + verb.",
    whereToApply: "CVs, bullet points and slides, where mixed forms look sloppy.",
    examples: ["She likes hiking, cooking and reading.", "The job involves planning budgets, hiring staff and running events."],
    mistake: { wrong: "He likes to swim, running and bikes.", right: "He likes swimming, running and cycling.", why: "Every item in the list should take the same form." },
    practice: { question: "Which is parallel?", options: ["The course teaches you to plan, to write and editing.", "The course teaches you to plan, write and edit.", "The course teaches you planning, to write and edit."], answer: 1, why: "All three items share the “to + verb” form." },
  },

  // ---------------------------------------------------------------- punctuation
  "Commas in lists and the Oxford comma": {
    rule: "Separate three or more list items with commas. The Oxford comma is the optional one before “and” — use it whenever leaving it out could confuse.",
    whereToApply: "Lists in emails, specs and invitations, where ambiguity can be embarrassing.",
    examples: ["We need milk, eggs, and bread.", "I'd like to thank my parents, Ana, and God."],
    mistake: { wrong: "I'd like to thank my parents, Ana and God.", right: "I'd like to thank my parents, Ana, and God.", why: "Without the Oxford comma, it can read as if your parents are Ana and God." },
    practice: { question: "Which list is punctuated correctly?", options: ["She speaks English, Hindi, and French.", "She speaks, English, Hindi and French.", "She speaks English Hindi, and French."], answer: 0, why: "Commas go between the items, not before the first one." },
  },
  "Comma splices": {
    rule: "A comma alone can't join two complete sentences. Use a full stop, a semicolon, or a comma plus a joining word (and, but, so).",
    whereToApply: "Fast writing in emails and messages, where run-on sentences creep in.",
    examples: ["I missed the train, so I took a cab.", "The demo went well; the client signed."],
    mistake: { wrong: "It's late, I'm going home.", right: "It's late, so I'm going home.", why: "Both halves are full sentences, so they need more than a comma to join them." },
    practice: { question: "Which is correct?", options: ["The file is huge, it won't upload.", "The file is huge; it won't upload.", "The file is huge it won't upload."], answer: 1, why: "A semicolon can join two closely related complete sentences." },
  },
  "Commas after introductory phrases": {
    rule: "Put a comma after an opening phrase or clause (However, After lunch, If you can) before the main sentence starts. Very short ones can skip it.",
    whereToApply: "Openings in emails and reports: “Unfortunately, …”, “As discussed, …”.",
    examples: ["After the meeting, we went for lunch.", "However, the numbers tell a different story."],
    mistake: { wrong: "When the client called the team was ready.", right: "When the client called, the team was ready.", why: "Without the comma, it first reads as “called the team”." },
    practice: { question: "Which is correct?", options: ["As discussed I've attached the file.", "As discussed, I've attached the file.", "As, discussed I've attached the file."], answer: 1, why: "The comma ends the introductory phrase “As discussed”." },
  },
  Semicolons: {
    rule: "A semicolon joins two closely related complete sentences, or separates list items that already contain commas.",
    whereToApply: "Formal writing, and lists of places or people with details.",
    examples: ["The launch slipped; the team is regrouping.", "We visited Paris, France; Rome, Italy; and Lisbon, Portugal."],
    mistake: { wrong: "I bought; apples, pears and plums.", right: "I bought apples, pears and plums.", why: "A semicolon doesn't introduce a list — that's the colon's job, and here no mark is needed." },
    practice: { question: "Where does the semicolon belong?", options: ["I love coffee; but not tea.", "I love coffee; she prefers tea.", "I love; coffee and tea."], answer: 1, why: "Both sides are complete sentences, and there's no joining word." },
  },
  Colons: {
    rule: "A colon introduces what comes next: a list, an explanation or a quotation. The part before it must be a complete sentence.",
    whereToApply: "Introducing lists, key points and conclusions in slides and emails.",
    examples: ["You need three things: a laptop, a charger and a plan.", "The verdict was clear: we had to rebuild."],
    mistake: { wrong: "The team includes: Ana, Raj and Lee.", right: "The team includes Ana, Raj and Lee.", why: "“The team includes” isn't a complete sentence, so no colon." },
    practice: { question: "Which uses the colon correctly?", options: ["We need: eggs and flour.", "We need two things: eggs and flour.", "We: need eggs and flour."], answer: 1, why: "“We need two things” is complete on its own, so a colon can introduce the list." },
  },
  "Apostrophes for possession": {
    rule: "Add ’s to show possession (the manager's desk). For plurals ending in s, add just the apostrophe (the managers' desks).",
    whereToApply: "Emails, signs and captions — misplaced apostrophes are highly visible.",
    examples: ["The client's feedback was positive.", "The players' contracts end in June."],
    mistake: { wrong: "The dog wagged it's tail at the neighbors cat.", right: "The dog wagged its tail at the neighbors' cat.", why: "Possessive “its” has no apostrophe; the cat belongs to the neighbors (plural), so the apostrophe goes after the s." },
    practice: { question: "The toys belong to several children. Which is correct?", options: ["the childrens' toys", "the children's toys", "the childrens toys"], answer: 1, why: "“Children” is already plural and doesn't end in s, so add ’s." },
  },
  "Apostrophes in contractions": {
    rule: "In a contraction, the apostrophe stands where letters were removed: do not → don't, you are → you're, I would → I'd.",
    whereToApply: "Casual writing and dialogue, where contractions are everywhere.",
    examples: ["We don't have a meeting today.", "You're right — I'd forgotten."],
    mistake: { wrong: "Your welcome.", right: "You're welcome.", why: "The meaning is “you are welcome”, so it needs the contraction “you're”." },
    practice: { question: "Which contraction is correct?", options: ["does'nt", "doesn't", "doesnt'"], answer: 1, why: "The apostrophe replaces the missing “o” in “not”." },
  },
  "Hyphens in compound adjectives": {
    rule: "Join two or more words with hyphens when together they describe a noun that follows (a well-known actor). After the noun, drop them (the actor is well known).",
    whereToApply: "Job titles, product copy and CVs: full-time, long-term, high-quality.",
    examples: ["It's a full-time role.", "She's a well-known designer."],
    mistake: { wrong: "We need a long term plan.", right: "We need a long-term plan.", why: "“Long-term” describes “plan” as one idea, so it's hyphenated." },
    practice: { question: "Which is correct?", options: ["a three year old contract", "a three-year-old contract", "a three-year old contract"], answer: 1, why: "All three words form one description of the contract, so all are linked." },
  },
  "Em dashes": {
    rule: "An em dash (—) marks a strong break: an aside, an emphasis or a sudden turn. Use a pair around an aside, or one before a punchline.",
    whereToApply: "Informal writing, headlines and slides, when a comma feels too weak.",
    examples: ["The result — after six months of work — was worth it.", "There was only one problem — nobody showed up."],
    mistake: { wrong: "The launch - which was delayed - went well.", right: "The launch — which was delayed — went well.", why: "An aside needs a dash (or commas), not a hyphen, which only joins words." },
    practice: { question: "Which uses a dash best?", options: ["She had one goal — win.", "She had — one goal win.", "She — had one goal win."], answer: 0, why: "The dash sets up the punchline at the end." },
  },
  "Quotation marks and punctuation": {
    rule: "In American English, commas and full stops go inside closing quotation marks. Question marks go inside only if the quote itself is a question.",
    whereToApply: "Quoting people in reports, articles and messages.",
    examples: ["She said, “We're ready.”", "Did he really say “no problem”?"],
    mistake: { wrong: "He called it “a game changer”.", right: "He called it “a game changer.”", why: "American style puts the full stop inside the closing quotation mark (British style often doesn't)." },
    practice: { question: "Which is correct in American English?", options: ["She asked, “Are you coming”?", "She asked, “Are you coming?”", "She asked “Are you coming”."], answer: 1, why: "The quote itself is a question, so its question mark goes inside." },
  },
  "Question marks in indirect questions": {
    rule: "An indirect question reports a question inside a statement, so it ends with a full stop and uses statement word order.",
    whereToApply: "Polite emails: “I was wondering whether you could…”.",
    examples: ["I wonder what time it is.", "She asked where the meeting was."],
    mistake: { wrong: "Can you tell me where is the office?", right: "Can you tell me where the office is?", why: "Inside an indirect question, use statement order (the office is)." },
    practice: { question: "Which is correct?", options: ["I asked him why was he late?", "I asked him why he was late.", "I asked him why he was late?"], answer: 1, why: "It's a statement reporting a question: statement order and a full stop." },
  },
  "Capital letters after a colon": {
    rule: "After a colon, use a lowercase letter unless what follows is a proper noun, a quotation, or (in American style) a complete sentence.",
    whereToApply: "Headings, slides and formal writing.",
    examples: ["Bring two things: water and snacks.", "The rule is simple: Everyone arrives on time."],
    mistake: { wrong: "You'll need: A pen and paper.", right: "You'll need a pen and paper.", why: "“You'll need” isn't a complete sentence, so no colon — and a list after a colon doesn't take a capital." },
    practice: { question: "Which is correct?", options: ["We visited three cities: Paris, Rome and Madrid.", "We visited three cities: paris, Rome and Madrid.", "We visited three cities: Paris, rome and madrid."], answer: 0, why: "City names are proper nouns, so they keep their capitals." },
  },
};

// Hand-checked "fix the punctuation" items per topic, used when the model is slow or down.
// Each pair has identical words, so only the punctuation differs.
export const PUNCT_FALLBACK: Record<(typeof PUNCTUATION_TOPICS)[number], PunctItem[]> = {
  "Commas in lists and the Oxford comma": [
    { broken: "We packed sandwiches fruit and water.", fixed: "We packed sandwiches, fruit, and water.", why: "List items are separated by commas; the Oxford comma before “and” keeps the last two apart." },
    { broken: "The flag is red white and blue.", fixed: "The flag is red, white, and blue.", why: "Three or more items need commas between them." },
  ],
  "Comma splices": [
    { broken: "I called twice, nobody answered.", fixed: "I called twice; nobody answered.", why: "Two complete sentences can't be joined by a comma alone." },
    { broken: "The shop was closed, we went home.", fixed: "The shop was closed; we went home.", why: "Join two full sentences with a semicolon, a full stop, or a comma plus “so”." },
  ],
  "Commas after introductory phrases": [
    { broken: "After the match we celebrated.", fixed: "After the match, we celebrated.", why: "A comma closes the introductory phrase before the main sentence." },
    { broken: "Honestly I expected more.", fixed: "Honestly, I expected more.", why: "An opening comment word like “Honestly” is followed by a comma." },
  ],
  Semicolons: [
    { broken: "It rained all day, the match went ahead anyway.", fixed: "It rained all day; the match went ahead anyway.", why: "A semicolon joins two closely related complete sentences." },
    { broken: "The finalists came from Austin, Texas, Denver, Colorado, and Miami, Florida.", fixed: "The finalists came from Austin, Texas; Denver, Colorado; and Miami, Florida.", why: "When list items contain commas, semicolons separate the items." },
  ],
  Colons: [
    { broken: "There's one thing I need sleep.", fixed: "There's one thing I need: sleep.", why: "A colon introduces the thing the first half points to." },
    { broken: "The recipe needs three ingredients flour, sugar and eggs.", fixed: "The recipe needs three ingredients: flour, sugar and eggs.", why: "A complete sentence can introduce a list with a colon." },
  ],
  "Apostrophes for possession": [
    { broken: "Sarahs laptop is on the desk.", fixed: "Sarah's laptop is on the desk.", why: "Add ’s to show the laptop belongs to Sarah." },
    { broken: "The teams coach resigned.", fixed: "The team's coach resigned.", why: "The coach belongs to the team, so it takes ’s." },
  ],
  "Apostrophes in contractions": [
    { broken: "I cant find my keys.", fixed: "I can't find my keys.", why: "The apostrophe replaces the missing letters of “cannot”." },
    { broken: "Theyre late again.", fixed: "They're late again.", why: "“They're” is short for “they are”, so it needs an apostrophe." },
  ],
  "Hyphens in compound adjectives": [
    { broken: "She has a full time job.", fixed: "She has a full-time job.", why: "“Full-time” describes the job as one idea, so it's hyphenated." },
    { broken: "It was a last minute change.", fixed: "It was a last-minute change.", why: "Two words working together before a noun take a hyphen." },
  ],
  "Em dashes": [
    { broken: "The answer - as usual - was no.", fixed: "The answer — as usual — was no.", why: "An aside takes a pair of em dashes, not hyphens." },
    { broken: "There was one problem nobody had the key.", fixed: "There was one problem — nobody had the key.", why: "A dash sets up the reveal at the end of the sentence." },
  ],
  "Quotation marks and punctuation": [
    { broken: "“I'll be there”, she said.", fixed: "“I'll be there,” she said.", why: "In American English, the comma goes inside the closing quotation mark." },
    { broken: "He asked, “Is it ready”?", fixed: "He asked, “Is it ready?”", why: "The quote itself is the question, so its question mark goes inside." },
  ],
  "Question marks in indirect questions": [
    { broken: "I wonder if she's coming?", fixed: "I wonder if she's coming.", why: "An indirect question is a statement, so it ends with a full stop." },
    { broken: "He asked what time it was?", fixed: "He asked what time it was.", why: "Reported questions end with a full stop, not a question mark." },
  ],
  "Capital letters after a colon": [
    { broken: "We need three things: Milk, bread and eggs.", fixed: "We need three things: milk, bread and eggs.", why: "A list after a colon starts in lowercase unless it begins with a proper noun." },
    { broken: "The meeting has one goal: Decide the budget.", fixed: "The meeting has one goal: decide the budget.", why: "A fragment after a colon stays lowercase." },
  ],
};
