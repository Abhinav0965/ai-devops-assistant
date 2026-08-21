export const dockerKnowledge = {
  title: "Docker Troubleshooting",
  category: "CONTAINER",
  content: `
Docker troubleshooting:

Common Docker failures include:

- container exits immediately
- image build failures
- port conflicts
- container-to-container connection failures
- missing environment variables
- health check failures

Common causes:

1. Application process crashes.
2. Incorrect Dockerfile.
3. Incorrect environment variables.
4. Port conflicts.
5. Incorrect container networking.
6. Missing dependencies.
7. Incorrect startup command.

Recommended checks:

- Inspect docker logs.
- Check container status.
- Inspect environment variables.
- Verify exposed ports.
- Inspect Docker networks.
- Verify service names in Docker Compose.
- Check container health status.

Important:

Inside a Docker container, localhost refers to that
container itself. To communicate with another Compose
service, use the service name as the hostname.
`,
};