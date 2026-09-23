# Bounded fixture performance

The portfolio fixture has seven features. On Node.js 22 the validation function completes well under one second; the automated check fails if it takes 1 second or longer. PostGIS save and reload of that same run completed in well under one second on local PostgreSQL 16 with PostGIS 3.4.

These figures describe the bounded demo only. They are not a capacity claim.
