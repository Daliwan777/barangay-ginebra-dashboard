CREATE DATABASE IF NOT EXISTS ginebra_stats
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE ginebra_stats;

CREATE TABLE IF NOT EXISTS players (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  player_key VARCHAR(64) NOT NULL,
  first_name VARCHAR(80) NOT NULL,
  last_name VARCHAR(80) NOT NULL,
  jersey_number TINYINT UNSIGNED,
  position ENUM('Guard', 'Forward', 'Center') NOT NULL,
  height_cm SMALLINT UNSIGNED,
  date_of_birth DATE,
  photo_url VARCHAR(500),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_players_player_key (player_key),
  UNIQUE KEY uq_players_jersey_number (jersey_number)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS games (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  season VARCHAR(9) NOT NULL,
  game_date DATE NOT NULL,
  opponent VARCHAR(120) NOT NULL,
  is_home BOOLEAN NOT NULL DEFAULT FALSE,
  result ENUM('W', 'L') NOT NULL,
  team_points SMALLINT UNSIGNED NOT NULL,
  opponent_points SMALLINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_games_season_date (season, game_date),
  KEY idx_games_season_result (season, result)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS player_stats (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  player_id INT UNSIGNED NOT NULL,
  game_id INT UNSIGNED NOT NULL,
  minutes_played DECIMAL(5,2) NOT NULL DEFAULT 0,
  points SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  rebounds SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  assists SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  steals SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  blocks SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  fg_made SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  fg_attempted SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  three_pt_made SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  three_pt_attempted SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  ft_made SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  ft_attempted SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_player_stats_player_game (player_id, game_id),
  KEY idx_player_stats_game (game_id),
  CONSTRAINT fk_player_stats_player FOREIGN KEY (player_id) REFERENCES players (id) ON DELETE CASCADE,
  CONSTRAINT fk_player_stats_game FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE,
  CONSTRAINT chk_fg_attempts CHECK (fg_made <= fg_attempted),
  CONSTRAINT chk_three_pt_attempts CHECK (three_pt_made <= three_pt_attempted),
  CONSTRAINT chk_ft_attempts CHECK (ft_made <= ft_attempted)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS team_stats (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  game_id INT UNSIGNED NOT NULL,
  team_points SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  rebounds SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  assists SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  steals SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  blocks SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  fg_made SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  fg_attempted SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  three_pt_made SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  three_pt_attempted SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  ft_made SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  ft_attempted SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_team_stats_game (game_id),
  CONSTRAINT fk_team_stats_game FOREIGN KEY (game_id) REFERENCES games (id) ON DELETE CASCADE,
  CONSTRAINT chk_team_fg_attempts CHECK (fg_made <= fg_attempted),
  CONSTRAINT chk_team_three_pt_attempts CHECK (three_pt_made <= three_pt_attempted),
  CONSTRAINT chk_team_ft_attempts CHECK (ft_made <= ft_attempted)
) ENGINE=InnoDB;

-- Season averages are derived from game-level totals, not stored redundantly.
CREATE OR REPLACE VIEW player_season_averages AS
SELECT
  p.id AS player_id,
  CONCAT(p.first_name, ' ', p.last_name) AS player_name,
  p.jersey_number,
  p.position,
  g.season,
  COUNT(ps.id) AS games_played,
  ROUND(AVG(ps.minutes_played), 1) AS mpg,
  ROUND(AVG(ps.points), 1) AS ppg,
  ROUND(AVG(ps.rebounds), 1) AS rpg,
  ROUND(AVG(ps.assists), 1) AS apg,
  ROUND(AVG(ps.steals), 1) AS spg,
  ROUND(AVG(ps.blocks), 1) AS bpg,
  ROUND(100 * SUM(ps.fg_made) / NULLIF(SUM(ps.fg_attempted), 0), 1) AS fg_pct,
  ROUND(100 * SUM(ps.three_pt_made) / NULLIF(SUM(ps.three_pt_attempted), 0), 1) AS three_pt_pct,
  ROUND(100 * SUM(ps.ft_made) / NULLIF(SUM(ps.ft_attempted), 0), 1) AS ft_pct
FROM players p
JOIN player_stats ps ON ps.player_id = p.id
JOIN games g ON g.id = ps.game_id
GROUP BY p.id, p.first_name, p.last_name, p.jersey_number, p.position, g.season;
