export const postgresqlKnowledge = {
  title: "PostgreSQL Connection Troubleshooting",
  category: "DATABASE",
  content: `
PostgreSQL connection troubleshooting:

Common PostgreSQL connection failures include:

- connection refused
- connection timeout
- authentication failure
- database does not exist
- too many connections

Common causes:

1. PostgreSQL service is unavailable.
2. Incorrect DATABASE_URL.
3. Incorrect hostname or port.
4. Invalid username or password.
5. Database does not exist.
6. Network access restrictions.
7. Connection pool exhaustion.

Recommended checks:

- Verify DATABASE_URL.
- Verify PostgreSQL host and port.
- Check database credentials.
- Verify database existence.
- Check connection pool usage.
- Check database server health.

For cloud-hosted PostgreSQL, verify the provider's
network access and SSL requirements.
`,
};