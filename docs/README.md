# RaineStack Documentation

Welcome to the comprehensive documentation for **RaineStack** — a modern, full-stack TypeScript monorepo built with Bun, Turborepo, Prisma, and React.

---

## 📖 Table of Contents

### Getting Started

- **[Getting Started](./getting-started.md)** — Installation, setup, and first steps
- **[Monorepo Architecture](./monorepo.md)** — Package structure and dependency graph

### Core Concepts

- **[Database Guide](./database.md)** — Prisma, PostgreSQL, triggers, and audit infrastructure
- **[API Development](./api.md)** — oRPC routes, OpenAPI, and client generation
- **[Micro-Frontends](./microfrontends.md)** — Zone architecture and routing
- **[UI Components](./ui-components.md)** — shadcn/ui library and theming

### Advanced Topics

- **[Authentication](./authentication.md)** — JWT, OIDC, passkeys, and session management
- **[Error Handling](./error-handling.md)** — tryCatch pattern and Prisma error utilities
- **[Temporal API](./temporal.md)** — Modern date/time handling across the stack

---

## 🚀 Quick Links

- **[GitHub Repository](https://github.com/yourusername/rainestack)** — Source code
- **[API Reference](http://localhost:3000/api/openapi.json)** — OpenAPI specification
- **[Issue Tracker](https://github.com/yourusername/rainestack/issues)** — Report bugs

---

## 📚 Documentation Structure

Each guide in this documentation follows a consistent structure:

1. **Overview** — High-level introduction to the topic
2. **Core Concepts** — Fundamental concepts you need to understand
3. **Practical Examples** — Real-world code examples
4. **Best Practices** — Recommended patterns and anti-patterns
5. **Troubleshooting** — Common issues and solutions
6. **Next Steps** — Related topics to explore

---

## 🎯 Learning Path

### For New Developers

1. Start with **[Getting Started](./getting-started.md)** to set up your environment
2. Read **[Monorepo Architecture](./monorepo.md)** to understand the project structure
3. Explore **[UI Components](./ui-components.md)** to build your first interface
4. Learn **[API Development](./api.md)** to create backend endpoints

### For Backend Developers

1. Begin with **[Database Guide](./database.md)** to understand data modeling
2. Study **[API Development](./api.md)** for oRPC patterns
3. Review **[Authentication](./authentication.md)** for security implementation
4. Check **[Error Handling](./error-handling.md)** for robust error management

### For Frontend Developers

1. Start with **[Micro-Frontends](./microfrontends.md)** to understand zone architecture
2. Explore **[UI Components](./ui-components.md)** for the component library
3. Learn **[API Development](./api.md)** for client-side integration
4. Study **[Error Handling](./error-handling.md)** for frontend error patterns

---

## 🔧 Project Philosophy

RaineStack is built on these core principles:

### Type Safety First

Every layer of the stack is fully typed, from database queries to API responses to UI components. TypeScript catches errors before they reach production.

### Contract-First APIs

Define your API once with Zod schemas, and get automatic validation, documentation, and type-safe clients.

### Explicit Over Implicit

The codebase favors explicit patterns (like `tryCatch` for error handling) over implicit magic, making code easier to understand and maintain.

### Developer Experience

Fast feedback loops with HMR, task caching, and parallel builds. The monorepo setup ensures efficient development workflows.

### Audit Everything

Every database mutation is tracked with actor attribution, providing a complete audit trail for compliance and debugging.

---

## 🛠️ Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| **Runtime** | Bun 1.3.9 |
| **Monorepo** | Turborepo with Bun workspaces |
| **Language** | TypeScript 5.9.3 (strict mode) |
| **Backend** | Bun HTTP server, oRPC, Pino logging |
| **Database** | PostgreSQL 18.1, Prisma 7.3 |
| **Frontend** | React 19.2, Vite 7.3, React Router 7 |
| **UI** | shadcn/ui (base-vega), Tailwind CSS 4.1 |
| **Auth** | JWT (jose), OTP, OIDC, WebAuthn |
| **Validation** | Zod 4.1 |
| **Date/Time** | Temporal API polyfill |

---

## 📝 Contributing to Documentation

Found an error or want to improve the docs? Contributions are welcome!

1. Fork the repository
2. Edit the relevant markdown file in `/docs`
3. Submit a pull request

All documentation follows these guidelines:

- Use clear, concise language
- Include practical code examples
- Provide both "do" and "don't" examples
- Link to related topics
- Keep it up-to-date with the codebase

---

## 💡 Need Help?

- **GitHub Issues** — Report bugs or request features
- **Discussions** — Ask questions and share ideas
- **AGENTS.md** — Comprehensive project rules for AI agents

---

<div align="center">
  <p>Built with ❤️ by the RaineStack team</p>
  <p>
    <a href="./getting-started.md">Get Started</a> •
    <a href="https://github.com/yourusername/rainestack">GitHub</a>
  </p>
</div>