export const nodejsKnowledge = {
  title: "Node.js Application Troubleshooting",
  category: "APPLICATION",
  content: `
Node.js troubleshooting:

Common Node.js production failures include:

- application crashes
- unhandled exceptions
- memory exhaustion
- port binding failures
- dependency errors
- request timeouts

Common causes:

1. Unhandled exceptions.
2. Unhandled promise rejections.
3. Incorrect environment variables.
4. Memory leaks.
5. Port already in use.
6. Missing dependencies.
7. External service failures.

Recommended checks:

- Inspect application logs.
- Check environment variables.
- Monitor memory and CPU.
- Check dependency versions.
- Verify ports.
- Inspect stack traces.
- Add proper error handling.
- Use health checks for critical dependencies.
`,
};