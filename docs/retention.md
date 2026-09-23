# Local retention

Validation runs stay in the local PostGIS database until an operator deletes them. Nothing is published and nothing expires on a timer.

The report field `retention` repeats this policy. To remove one run:

```sql
DELETE FROM quality.finding_geometries WHERE run_id = $1;
DELETE FROM quality.validation_runs WHERE run_id = $1;
```

Deleting the database volume removes every local run. Source files outside the database are untouched.
