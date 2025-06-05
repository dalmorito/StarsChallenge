CREATE TABLE IF NOT EXISTS "users" (
    "id" SERIAL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "contestants" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nationality" TEXT DEFAULT '',
    "points" INTEGER NOT NULL DEFAULT 1000,
    "tournament_points" INTEGER NOT NULL DEFAULT 0,
    "matches" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "gold_medals" INTEGER NOT NULL DEFAULT 0,
    "silver_medals" INTEGER NOT NULL DEFAULT 0,
    "bronze_medals" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS "tournaments" (
    "id" SERIAL PRIMARY KEY,
    "matches_total" INTEGER NOT NULL DEFAULT 63,
    "matches_completed" INTEGER NOT NULL DEFAULT 0,
    "current_round" INTEGER NOT NULL DEFAULT 1,
    "current_match" INTEGER NOT NULL DEFAULT 1,
    "champion" INTEGER REFERENCES "contestants"("id"),
    "runner_up" INTEGER REFERENCES "contestants"("id"),
    "third_place" INTEGER REFERENCES "contestants"("id"),
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "matches" (
    "id" SERIAL PRIMARY KEY,
    "tournament_id" INTEGER NOT NULL REFERENCES "tournaments"("id"),
    "round" INTEGER NOT NULL,
    "match_number" INTEGER NOT NULL,
    "contestant1_id" INTEGER NOT NULL REFERENCES "contestants"("id"),
    "contestant2_id" INTEGER NOT NULL REFERENCES "contestants"("id"),
    "winner_id" INTEGER REFERENCES "contestants"("id"),
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "point_history" (
    "id" SERIAL PRIMARY KEY,
    "contestant_id" INTEGER NOT NULL REFERENCES "contestants"("id"),
    "tournament_id" INTEGER NOT NULL REFERENCES "tournaments"("id"),
    "match_id" INTEGER NOT NULL REFERENCES "matches"("id"),
    "points_before" INTEGER NOT NULL,
    "points_change" INTEGER NOT NULL,
    "points_after" INTEGER NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "image_cache" (
    "id" SERIAL PRIMARY KEY,
    "contestant_id" INTEGER NOT NULL REFERENCES "contestants"("id"),
    "image_urls" TEXT[] NOT NULL,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);