import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema from the template, kept for reference
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Contestant schema
export const contestants = pgTable("contestants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nationality: text("nationality").default(""), // Nacionalidade da atriz
  points: integer("points").notNull().default(1000), // Points for points ranking system (starting at 1000)
  tournamentPoints: integer("tournament_points").notNull().default(0), // Points from tournament placements
  matches: integer("matches").notNull().default(0),
  wins: integer("wins").notNull().default(0),
  losses: integer("losses").notNull().default(0),
  goldMedals: integer("gold_medals").notNull().default(0),
  silverMedals: integer("silver_medals").notNull().default(0),
  bronzeMedals: integer("bronze_medals").notNull().default(0),
  active: boolean("active").notNull().default(true), // Whether the contestant is in the current tournament
});

export const insertContestantSchema = createInsertSchema(contestants).pick({
  name: true,
  nationality: true,
  points: true,
  tournamentPoints: true,
  matches: true,
  wins: true,
  losses: true,
  goldMedals: true,
  silverMedals: true,
  bronzeMedals: true,
  active: true,
});

export type InsertContestant = z.infer<typeof insertContestantSchema>;
export type Contestant = typeof contestants.$inferSelect;

// Tournament schema
export const tournaments = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"),
  completed: boolean("completed").notNull().default(false),
  currentRound: integer("current_round").notNull().default(0),
  currentMatch: integer("current_match").notNull().default(0),
  matches: integer("matches").notNull().default(0),
  champion: integer("champion"),
  runnerUp: integer("runner_up"),
  thirdPlace: integer("third_place"),
});

export const insertTournamentSchema = createInsertSchema(tournaments).pick({
  startDate: true,
  endDate: true,
  completed: true,
  currentRound: true,
  currentMatch: true,
  matches: true,
  champion: true,
  runnerUp: true,
  thirdPlace: true,
});

export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type Tournament = typeof tournaments.$inferSelect;

// Match schema
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").notNull(),
  round: integer("round").notNull(),
  matchNumber: integer("match_number").notNull(),
  contestant1Id: integer("contestant1_id").notNull(),
  contestant2Id: integer("contestant2_id").notNull(),
  winnerId: integer("winner_id"),
  completed: boolean("completed").notNull().default(false),
});

export const insertMatchSchema = createInsertSchema(matches).pick({
  tournamentId: true,
  round: true,
  matchNumber: true,
  contestant1Id: true,
  contestant2Id: true,
  winnerId: true,
  completed: true,
});

export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matches.$inferSelect;

// PointHistory schema for tracking point changes over time
export const pointHistory = pgTable("point_history", {
  id: serial("id").primaryKey(),
  contestantId: integer("contestant_id").notNull(),
  tournamentId: integer("tournament_id").notNull(),
  matchId: integer("match_id"),
  pointsBefore: integer("points_before").notNull(),
  pointsChange: integer("points_change").notNull(),
  pointsAfter: integer("points_after").notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPointHistorySchema = createInsertSchema(pointHistory).pick({
  contestantId: true,
  tournamentId: true,
  matchId: true,
  pointsBefore: true,
  pointsChange: true,
  pointsAfter: true,
  reason: true,
  createdAt: true,
});

export type InsertPointHistory = z.infer<typeof insertPointHistorySchema>;
export type PointHistory = typeof pointHistory.$inferSelect;

// Image cache schema for temporarily storing image URLs
export const imageCache = pgTable("image_cache", {
  id: serial("id").primaryKey(),
  contestantId: integer("contestant_id").notNull(),
  imageUrls: text("image_urls").array().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertImageCacheSchema = createInsertSchema(imageCache).pick({
  contestantId: true,
  imageUrls: true,
  createdAt: true,
});

export type InsertImageCache = z.infer<typeof insertImageCacheSchema>;
export type ImageCache = typeof imageCache.$inferSelect;

// Constant list of all available contestants
export const CONTESTANTS_LIST = [
  "Elle Lee", "Asa Akira", "Sumire Mizukawa", "Eva Lovia", "London Keyes",
  "Maria Ozawa", "Sharon Lee", "Morgan Lee", "Alina Li", "Jennie Rose",
  "Polly Pons", "Rae Lil Black", "Miko Lee", "Tia Ling", "Kaylani Lei",
  "Kalina Ryu", "Saya Song", "Miko Sinz", "Daisy Summers", "Jasmine Sherni",
  "Alexia Anders", "Ember Snow", "Jayna Oso", "Nautica Thorn", "Jayden Lee",
  "Kendra Spade", "Jade Hsu", "Marica Hase", "Brenna Sparks", "Ariel Rose",
  "Sunny Leone", "Roxy Jezel", "Cindy Starfall", "May Thai", "Jade Kimiko",
  "Lulu Chu", "Tera Patrick", "Julia Kyoka", "Venus Lux", "Mia Khalifa",
  "Jessica Bangkok", "Maxine X", "Avena Lee", "Dana Vespoli", "Katsuni",
  "Kimmy Kimm", "Jasmine Grey", "Evelyn Lin", "Clara Trinity", "Charmane Star",
  "Mia Rider", "Jureka Del Mar", "Tia Tanaka", "Nicole Doshi", "Lily Thai",
  "Vina Skyy", "Lia Lin", "Priya Rai", "Mia Lelani", "Lea Hart",
  "Jade Kush", "Avery Black", "Amai Liu", "Sofia Takigawa", "Linda Lan",
  "Christy White", "Kelsey Kane", "Jodie Taylor", "Tiffany Doll", "Adria Rae",
  "Alexa Flexy", "Sammie Rhodes", "Monika Fox", "Kamryn Jayde", "Chanel Camryn",
  "Adel Asanty", "Zazie Skymm", "Jade Nile", "Rosalyn Sphinx", "Ash Hollywood",
  "Ava Ston", "Sybil A", "Sienna Grace", "Jennifer Dark", "Tracy Rose",
  "Maitland Ward", "Raven Rockette", "Tricia Oaks", "Aliya Brynn", "Romi Rain",
  "Shrooms Q", "Delilah Dagger", "Megan Fiore", "Melanie Hicks", "Lanny Barbie",
  "Gisha Forza", "Zena Little", "Layla Sin", "Roxy Lips", "Missy Stone",
  "Corra Cox", "Jasmine Black", "AJ Applegate", "Sandra Shine", "Kathia Nobili",
  "Dana Wolf", "Kama Oxi", "Milana Ricci", "Gina Gerson", "Vicky Vette",
  "Crissy Moran", "Piper Fawn", "Emelie Crystal", "Lauren Phoenix", "Aleska Diamond",
  "Natalia Starr", "Naomi Blue", "Maya Grand", "Mia Sollis", "Skyler Storm",
  "Bree Olson", "Explicit Kait", "Sandra Romain", "Sasha Foxxx", "Hadley Mason",
  "Vanessa Decker", "Ailee Anne", "Cindy Shine", "Anna Claire Clouds", "Lacy Lennon",
  "Roxy Lip", "Lana Roy", "Valentina Bellucci", "Jayme Langford", "Ella Reese",
  "Jayden Cole", "Janine Lindemulder", "Candice Demellza", "Anny Aurora", "Angelina Diamanti",
  "RayVeness", "Venus Vixen", "Sara Diamante", "Serena Hill", "Aria Kai",
  "Brea Bennett", "Hope Harper", "Kay Carter", "Alli Rae", "Faye Reagan",
  "Lily Lou", "Corinna Blake", "Bree Daniels", "Tera Joy", "Red Fox",
  "Molly Jane", "Reena Sky", "Tara Morgan", "Maddy May", "Madi Meadows",
  "Susan Ayn", "Evelin Stone", "Natalie Colt", "Dani Jensen", "Samia Duarte",
  "Melissa Lauren", "Charlotte Sins", "Brett Rossi", "Madison Parker", "Angelik Duval",
  "Bailey Brooke", "Eve Sweet", "Anya Krey", "Kimber Delice", "Amanda Blow",
  "Jamie Jett", "Prinzzess", "Summer Day", "Kristen Scott", "Valentina Nappi",
  "Lily Blossom", "Victoria Daniels", "Nina Elle", "Jill Kassidy", "Amy Reid",
  "Arabelle Raphael", "Zoe Doll", "Carolina Sweets", "Heidi Van Horny", "Samantha Saint",
  "Alexis Texas", "Alyssia Kent", "Natalie Heart", "Tina Kay", "Connie Carter",
  "Chloe Temple", "Karter Foxx", "Catherine Knight", "Charma Kelley", "Bella Rolland",
  "Nancy A", "Nicole Aniston", "Jessica Moore", "Molly Little", "Gabi Gold",
  "Mina K", "Adel Morel", "Brooklyn Chase", "Emma Rosie", "Kenzie Love",
  "Coco De Mal", "Daphne Dare", "Lena Anderson", "Lilu Moon", "Ariana Marie",
  "Cameron Canada", "Martina Smeraldi", "Gianna Michaels", "Indica Flower", "Charlie Valentine",
  "Aletta Ocean", "Frances Bentley", "Anjelica Hanson", "Chloe Carter", "Eve Marlowe",
  "Gala Ann", "Megan Sage", "Shyla Jennings", "Tommy King", "Annette Schwarz",
  "Briana Lee", "Veronica Zemanova", "Claire Dames", "Cherie Deville", "Kenzie Anne",
  "Arietta Adams", "Brenna McKenna", "Kayden Kross", "Ziggy Star", "Eden Ivy",
  "Aria Alexander", "Mya Diamond", "Sophie Moone", "Nikita Bellucci", "Liya Silver",
  "Celeste Star", "Megan Rain", "Adriana Chechik", "Stoya", "Angel Dark",
  "Darcie Dolce", "Lily Chey", "Cindy Hope", "Kleio Valentien", "Lena Paul",
  "Apolonia Lapiedra", "Silvia Saint", "Riley Reid", "April Olsen", "Sasha Grey",
  "Penny Flame", "Dakota Skye", "Zafira", "Britney Amber", "Karolina Geiman",
  "Georgia Jones", "Dakota Tyler", "Anetta Keys", "Nesty", "Lya Missy",
  "Hazel Moore", "Britney Blue", "Eva Blume", "Layla Jenner", "Valerica Steele",
  "Janice Griffith", "Barbie Brill", "Brittney Skye", "Jenna Haze", "Eve Angel",
  "Angell Summers", "Misha Cross", "Sami St Clair", "Gauge", "Shona River",
  "Kali Roses", "Kyler Quinn", "Jelena Jensen", "Jane Wilde", "Erica Campbell",
  "Clea Gaultier", "Gracie Glam", "Simony Diamond", "Capri Anderson", "Lana Rhoades",
  "Trinity St Clair", "Ashlynn Brooke", "Alex Coal", "Rebecca Volpetti", "Susie Diamond",
  "Korra Del Rio", "Cyrstal Rae", "Elena Koshka", "Kyla Cole", "Lauren Phillips",
  "Arya Fae", "Lady Dee", "Peaches", "Gal Ritchie", "Kira Thorn",
  "Eufrat", "Anna Bell Peaks", "Jia Lissa", "Lola Taylor", "Aidra Fox",
  "Dylan Ryder", "Anna de Ville", "Dillion Harper", "Gianna Dior", "Aften Opal",
  "Anna Morna", "Lila Love", "Lilit Ariel", "Abella Danger", "Taylor Rain",
  "Dani Daniels", "Kenzie Reeves", "Rebeca Linares", "Peta Jensen", "Kylie Quinn",
  "Mila Azul", "Evelyn Claire", "Angela White", "Naomi Russell", "Lucky Anne",
  "Capri Cavanni", "Monika Benz", "Cytherea", "Tori Black", "Leah Winters",
  "Charlotte Sartre", "Ryan Ryans", "Leigh Raven", "Sabrisse Aaliyah", "Remy LaCroix",
  "Sunny Alika", "Keira Croft", "Missy Luv", "Melena Rya", "Jennifer White",
  "Monique Alexander", "Katrina Colt", "Kay Jay", "Simon Kitty", "Belladonna",
  "Jenna Jameson", "Katie Morgan", "Alexa Payne", "Nekane Sweet", "Haley Spades",
  "Gia Derza", "Natalie Mars", "Aria Giovanni", "Sasha Rose", "Lucia Denvile",
  "Jessa Rhodes", "Luna Legend", "Cherry Kiss", "Teagan Presley", "Gia Paige",
  "Erin Everheart", "Avy Scott", "Pristine Edge", "Eva Long", "Irina Bruni",
  "Evelina Darling", "Vanessa Lane", "Nikki Benz", "Kenzie Taylor", "Bonnie Rotten",
  "Nicole Aria", "Stormy Daniels", "Audrey Bitoni", "Rachel Roxxx", "Briana Banks",
  "Sophie Dee", "Mary Popiense", "Gabbie Carter", "Jasmine Wilde", "Ellie Nova",
  "Scarlett Alexis", "Veronica Leal", "Selina Imai", "Eliza Ibarra", "Xxlayna Marie",
  "Jessie Rogers", "Madison Wilde", "Hime Marie", "Violet Myers", "Gina Valentina",
  "Autumn Falls", "Karlee Grey", "Keisha Grey", "Armani Black", "Marina Gold",
  "Jynx Maze", "Agatha Vega", "Barbie Reyes", "Luna Star", "Sara Luvv",
  "Vicki Chase", "Emily Willis", "Holly Hendrix", "Lela Star", "Lilly Hall",
  "Veronica Rodriguez", "Serena Santos", "Kristina Rose", "Francesca Le", "Victoria Voxxx",
  "Eva Angelina", "Emily Pink", "Lola Foxx", "Lucy Doll", "Jenna Sativa",
  "Savannah Sixx", "Tabatha Lust", "Juelz Ventura", "Esperanza Gomez", "Aria Lee",
  "Alexa Tomas", "TS Foxxy", "Sadie Pop", "Vitoria Beatriz", "Selena Rose",
  "Melissa Moore", "Blu Chanelle", "Francys Belle", "Daniela Ortiz", "Penelope Cum",
  "Alexis Amore", "Daisy Marie", "Frida Sante", "Sophia Leone", "Monica Asis",
  "Cameron Canela", "Mickey Violet", "Caroline Ray", "Alicia Trece", "Monica Santhiago",
  "Kitty Carrera", "Megan Salinas", "Sandy Sweet", "Michelle Martinez", "Isabella Taylor",
  "Jenaveve Jolie", "Jasmine Summers", "Mia Hurley", "Mayara Lopes", "Jessica West",
  "Alexis Zara", "Isis Taylor", "Mia Nix", "Lorena Sanchez", "Iris Lucky",
  "Abella Anderson", "Calypso Muse", "Jasmine Byrne", "Carolina Cortez", "Polly Petrova",
  "Melody Star", "Carla Morelli", "Betty Foxxx", "Alexis Love", "Layla Rivera",
  "Yessica Bunny", "August", "Teh Angel", "Kristina Bell", "Adriana Sage",
  "Mila Castro", "Queen Kimi", "Meg Vicious", "Adrianna Luna", "Alexa Aimes",
  "Eve Evans", "Nina Mercedez", "Jane Marie", "May Akemi", "Jade Presley",
  "Daniela Antury", "Priscilla Sol", "Hannah Hayek", "Anais Hayek", "Suki Miki",
  "Alexis Tae", "Kira Noir", "Willow Ryder", "Ana Foxxx", "August Skye",
  "Lily Starfire", "Violet Smith", "Kona Jade", "Nia Nacci", "Misty Stone",
  "Anissa Kate", "Bianca Bangs", "Kimora Quin", "Gabriella Paltrova", "Ameena Green",
  "Teanna Trump", "Cali Sweets", "Jenna Foxx", "Chanell Heart", "Skin Diamond",
  "Baby Gemini", "Olivia Jay", "Aaliyah Hadid", "kyla Sun", "Zaawaadi",
  "Cassidy Banks", "Rina Ellis", "Sarah Banks", "Julie Kay", "Honey Gold",
  "Anya Ivy", "Layton Benton", "Scarlett Bloom", "Lacey London", "Sarai Minx",
  "Jenny Pretinha", "Rose Rush", "Osa Lovely", "Ashley Aleigh", "Tina Fire",
  "Nadia Jay", "Tahlia Lane", "Amber Stars", "Daya Knight", "Luna Corazon",
  "Alyssa Divine", "Mocha Menage", "Brixley Benz", "Ashley Pink", "Daizy Cooper",
  "Jeni Angel", "Cali Caliente", "Lala Ivey", "Tori Montana", "Lacey Duvalle",
  "Skyler Nicole", "Roxy Reynolds", "Diamond Banks", "Jaymee Green", "America Moore",
  "Zoey Reyes", "Mya Mays", "Lotus Lain", "Sydney Capri", "Jade Aspen",
  "Qween Goddes", "Baby Cak", "Erika Vuitton", "Adriana Malao", "Luna Okko"
];

// Tournament point values based on placement
export const TOURNAMENT_POINTS = {
  CHAMPION: 50,    // 1st place (Gold medal)
  RUNNER_UP: 40,   // 2nd place (Silver medal)
  THIRD_PLACE: 35,    // 3rd place (Bronze medal)
  FOURTH_PLACE: 30,   // 4th place
  FIFTH_EIGHTH: 25, // 5th-8th place (Quarter-finals losers)
  NINTH_SIXTEENTH: 20, // 9th-16th place (Round of 16 losers)
  SEVENTEENTH_THIRTYSECOND: 15, // 17th-32nd place (Round of 32 losers)
  THIRTYTHIRD_SIXTYFOURTH: 10  // 33rd-64th place (Round of 64 losers)
};

// Types for tournament bracket visualization
export type BracketMatch = {
  id: number;
  round: number;
  matchNumber: number;
  contestant1: Contestant | null;
  contestant2: Contestant | null;
  winner: Contestant | null;
  completed: boolean;
};

export type TournamentBracket = {
  rounds: {
    round: number;
    name: string;
    matches: BracketMatch[];
  }[];
};

// Types for current match display
export type CurrentMatchData = {
  matchId: number;
  contestant1: CurrentMatchContestant;
  contestant2: CurrentMatchContestant;
  round: number;
  matchNumber: number;
  roundName: string;
};

export type CurrentMatchContestant = {
  id: number;
  name: string;
  nationality: string;
  points: number;
  imageUrls: string[];
  rank?: number;
};

// Type for tournament progress
export type TournamentProgress = {
  totalMatches: number;
  completedMatches: number;
  currentRound: number;
  currentMatch: number;
  roundName: string;
  percentComplete: number;
};
