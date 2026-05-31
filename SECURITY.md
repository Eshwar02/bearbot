# 🔒 Security Policy

## Supported Versions

The following versions of AlphaSight AI (BearBot) are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| Latest  | ✅ Supported        |
| Older   | ❌ Not Supported    |

We recommend always using the latest version of the project.

---

## 🚨 Reporting a Vulnerability

We take security vulnerabilities seriously. Please do **NOT** open a public GitHub issue for security vulnerabilities as it may expose the issue to others before it is fixed.

Instead, please report it privately by opening a **GitHub Security Advisory**:

👉 [Report a Vulnerability](https://github.com/Eshwar02/bearbot/security/advisories/new)

Please include the following details in your report:

- A clear description of the vulnerability
- Steps to reproduce the issue
- Potential impact of the vulnerability
- Any suggested fixes (optional but appreciated)

---

## ⏱️ Security Response Process

Once a vulnerability is reported, here is what you can expect:

1. **Acknowledgement** — We will acknowledge receipt of your report within **48 hours**
2. **Investigation** — We will investigate and validate the reported vulnerability
3. **Fix** — We will work on a fix and keep you updated on progress
4. **Release** — A patched version will be released as soon as possible
5. **Credit** — With your permission, we will credit you for the responsible disclosure

---

## 🛡️ Security Best Practices for Contributors

When contributing to AlphaSight AI, please follow these security guidelines:

- Never commit API keys, secrets, or credentials to the repository
- Always use `.env.local` for sensitive environment variables
- Never expose user portfolio data or financial information in logs
- Ensure all API endpoints enforce authentication where required
- Follow the principle of least privilege when handling user data
- Never store sensitive financial data in plaintext

---

## 🔐 Current Security Measures

AlphaSight AI implements the following security measures:

- **RLS Enforced** — All database queries use Supabase Row Level Security
- **Auth Tokens** — Supabase PKCE OAuth flow, no passwords stored
- **API Keys** — Environment isolated via `.env.local`
- **User Data** — Scoped to authenticated user via `auth.uid()`
- **No Hallucinations** — All AI responses grounded in live market data
- **Edge Protection** — Next.js middleware protects all authenticated routes

---

## 📬 Contact

For any security related concerns, reach out to us at:

📧 **support@alphasightai.online**
💬 GitHub Discussions

---

## 📄 Attribution

This Security Policy follows industry standard responsible disclosure practices.

---

> This project is part of **GSSoC 2026**. We are committed to maintaining
> a safe and secure environment for all contributors and users! 🌱
