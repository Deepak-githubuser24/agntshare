# Security Policy

## Supported Versions

Only the latest `main` branch and currently published npm/PyPI packages are supported for security updates.

## Reporting a Vulnerability

Security is a core feature of AgentShare. If you discover a security vulnerability within AgentShare, please report it privately to the maintainers rather than creating a public issue.

To report a vulnerability:
1. Email `security@example.com` (replace with project maintainer email).
2. Provide a detailed description of the issue, steps to reproduce, and a proof-of-concept if available.
3. We will respond within 48 hours to acknowledge the report.

### In Scope
- Auth bypasses (API keys, Session auth).
- Rate limit evasions.
- Database role escalation / SQL injection.
- Unauthorized token resolution.
- Server-side request forgery (SSRF) via presigned URLs.

### Out of Scope
- Denial of Service (DoS) attacks that rely merely on high request volumes (these should be mitigated by infrastructure-level WAFs).
- Secrets or PII committed within user-uploaded files (AgentShare is an opaque pipe and does not inspect payloads).
