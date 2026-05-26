# Personal Implementation Guidelines

## Implementation Priorities (All Projects)

When implementing any new code, follow these priorities **in order**:

### 1. Security (Highest Priority)
- Explore security options first before implementing any feature
- Present security considerations with short explanations
- Be prepared to explain security decisions in depth if asked
- Never compromise security for convenience or DX
- **Sensitive data exposure** - Always check for hardcoded secrets, API keys, credentials, tokens (avoid shameful security incidents)

### 2. Developer Experience (DX)
In priority order:
1. **Ease of use** - Simple, intuitive API for developers
2. **Flexibility** - Features should be adaptable without modification
3. **Readability** - Recognizable patterns, context-true naming, then self-documenting code

### 3. Package Updates
- Only check for updates when explicitly asked
- Prefer stable releases (~1-2 weeks after new version release)
- Update for: performance improvements, security patches, new features

## Code Quality

**Production quality code is MANDATORY.**
- No placeholders (TODO, FIXME, "implement later", stub functions)
- No incomplete implementations
- Every piece of code must be ready for production

### Anti-Overengineering

**The simplest solution that works is the correct solution.**

- Prefer `satisfies` over generic factory functions
- Trust Zod for runtime validation - don't duplicate in complex types
- If you need `as unknown as` casts, simplify your types
- Three similar lines > premature abstraction
- No "Loose" and "Strict" type variants - one type + runtime validation

## Workflow Guidelines

### Planning & Implementation
- **Plan the current phase** when entering it (not all phases upfront)
- **Implement one todo item at a time**
  - Exception: Dependent items can be implemented together
- **Stay focused** on the current todo item throughout implementation

### Project Types & Separation

**1. Developer/Software Consumed Projects**
Projects that implement reusable functionality across user-consumed projects. These are consumed by developers because they provide pre-built features as a service. Examples:
- Packages used in software development (SDKs, libraries)
- MCP servers or public APIs serving processed/compiled data
- WebSocket-based services that other projects connect to
- Servers and databases that run independently on the internet

**2. User Consumed Projects**
Projects that go live and are consumed by:
- Everyday end users
- B2B clients and their workers

**Rule:** When working on a developer-consumed project, do NOT consider user-consumed project specifics. User-consumed projects adapt to their dependencies.

## Post-Implementation Workflow

After completing each implementation:
1. **Test** - Run the test suite
2. **Build** - Run the build command
3. **Inspect** - Start dev server, let user inspect, then shut it down
4. **Commit** - If no problems, create git commit and push
   - **No AI signatures** - Do NOT add "Co-Authored-By: Claude" or similar

## Git Commits

- Create meaningful commit messages
- **Never include AI co-author signatures**
- Push after successful test + build + inspection

---

## Architectural Decisions & Rationale

These decisions have been validated through implementation. Use them to guide future feature planning — don't re-debate settled patterns.

### API Design Philosophy

- **Private by default** — If a consumer doesn't need to configure something, don't expose it. Internal concerns (icon registries, internal state) stay behind the component boundary. When in doubt, start private; it's easier to expose later than to deprecate.
- **Facade pattern for integrations** — Third-party libraries (Better Auth, SimpleWebAuthn, etc.) are always wrapped behind a CVE interface. This isn't overengineering — it's the minimum viable abstraction that allows swapping providers without breaking consumers. Every external dependency gets a facade.
- **Policy over code branching** — When the same feature serves multiple contexts (public users vs enterprise), implement the core once and differentiate through policy/configuration, not separate code paths. Proven in auth: same passkey flow, different policies per context.

### Security Posture

- **Passkey-first, no passwords** — WebAuthn passkeys are primary auth. Social login and magic links are fallbacks, not equals. Future auth features build on passkey infrastructure.
- **Post-implementation security audit** — After completing any security-sensitive feature, run a structured audit in severity tiers (CRITICAL → HIGH → MEDIUM). This catches issues invisible during implementation. Mandatory for: auth, payments, permissions, data access.
- **Validate at boundaries, trust internals** — Zod validates at system boundaries (API input, database reads). Internal function calls trust the type system. Don't duplicate validation inside trusted code paths.

### Component & Rendering

- **Server Components first** — Default to Server Components. Only introduce client boundary (`"use client"`) when state or interactivity requires it. AdminShell (Server) → ShellLayout (Client) is the established pattern.
- **Dumb components** — Components are pure presentation. Zero external geometry (no margins). All data via props. No data fetching inside components. Internal layout only.
- **Extensions in parent packages** — Admin extensions live inside their parent package (`<package>/extensions/admin/`), not as separate packages. Co-locates related code, reduces publish overhead.

### Type System

- **ORM-agnostic core** — CVE Core defines interfaces (`CoreDriver`), host apps implement them (`DrizzleDriver`). Core has zero ORM dependencies. This pattern applies to all data access — define the contract in core, implement in consumer.
- **Registry contravariance** — Component registries export strict types (for ComponentBuilder type inference) and consumers cast at the call site (for RenderEngine). Never cast at the export site. This is a known TypeScript limitation, not a bug in our code.
