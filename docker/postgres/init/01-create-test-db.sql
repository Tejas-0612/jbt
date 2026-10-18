-- Runs once, when the Postgres volume is first created.
-- Automated tests get their own database, so they never touch your dev data.
CREATE DATABASE jbt_test;
