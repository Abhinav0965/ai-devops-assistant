export const mongodbKnowledge = {
  title: "MongoDB Connection Troubleshooting",
  category: "DATABASE",
  content: `
MongoDB connection troubleshooting:

ECONNREFUSED errors usually indicate that the application
cannot establish a TCP connection to the MongoDB server.

Common causes:

1. MongoDB service is not running.
2. MongoDB is listening on a different port.
3. MongoDB is bound to a different network interface.
4. The application is using an incorrect MongoDB URI.
5. A firewall is blocking the MongoDB port.
6. In Docker environments, localhost refers to the current
   container rather than another container.

Recommended checks:

- Verify that the MongoDB service is running.
- Verify the MongoDB listening port.
- Check MongoDB bind configuration.
- Verify the MONGO_URI environment variable.
- Check firewall/network rules.
- In Docker Compose, use the MongoDB service name instead
  of localhost when connecting between containers.

Example:

mongodb://localhost:27017/mydb

For Docker Compose:

mongodb://mongodb:27017/mydb
`,
};