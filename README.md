# Ginebra Player Stats Dashboard

A responsive single-page basketball analytics dashboard for Barangay Ginebra San Miguel. It includes a season overview, searchable and sortable player stats, player profile modals, team shooting and scoring visualizations, and leaderboards.

## Run locally

Open `index.html` in a browser or serve this directory with any static web server. Bootstrap 5 and Chart.js are loaded from jsDelivr; Google Fonts and the hero photography are loaded remotely.

## Data

The site currently uses illustrative sample season data in `app.js`; it is not an official PBA statistics feed. `schema.sql` defines the MySQL tables for players, game-level player stats, games, and team stats, along with a view that calculates season averages from box-score totals. Replace the sample array and connect a backend/API before using this as an official statistics source.
