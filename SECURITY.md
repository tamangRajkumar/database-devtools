# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 1.x     | Yes       |
| < 1.0   | Best effort |

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Report vulnerabilities via [GitHub Security Advisories](https://github.com/yellowbooking/database-devtools/security/advisories/new) (preferred), or email **security@yellowbooking.com**.

Include:

- Description of the issue
- Steps to reproduce
- Impact assessment
- Suggested fix (if any)

We aim to acknowledge reports within 72 hours.

## Security considerations

Database DevTools is intended for **local development only**:

- The inspector hub binds to `0.0.0.0` by default and exposes database snapshots on your LAN
- Edit mode performs **live writes** on the device database
- The React Native overlay is disabled in production builds by default (`__DEV__`)

Do not expose the hub to the public internet or enable DevTools in production app builds without understanding these risks.
