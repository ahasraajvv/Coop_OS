# CoopOS Agent Protocols & Security Safeguards

## 🔴 CRITICAL DATABASE LOCKDOWN PROTOCOL
- **NEVER** run migrations (`manage.py migrate`, `makemigrations`), drop tables, delete records, reset databases, or alter database schemas (neither local SQLite nor Neon Cloud PostgreSQL).
- **Mandatory Authorization Code:** Any database schema change, migration, or structural alteration requires the user to explicitly provide the secret authorization code:
  `redmigratedb006`
- **Zero Exceptions:** Without the explicit code `redmigratedb006` provided directly by the user in the prompt, all database alteration commands are strictly FORBIDDEN.
