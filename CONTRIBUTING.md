# 🤝 Contributing to AlphaSight AI (bearbot)

Thank you for your interest in contributing!
We welcome all contributions that improve the project.

## 📋 Table of Contents
- [Getting Started](#getting-started)
- [Branch Naming](#branch-naming)
- [Commit Guidelines](#commit-guidelines)
- [Running Locally](#running-locally)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)

---

## 🚀 Getting Started

1. Fork the repository
2. Clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/bearbot.git
cd bearbot
```

3. Create a new branch for your changes

---

## 🌿 Branch Naming

Use clear and descriptive branch names:

| Type | Format | Example |
|------|--------|---------|
| Feature | `feat/name` | `feat/portfolio-analytics` |
| Bug Fix | `fix/name` | `fix/chat-disconnect` |
| Docs | `docs/name` | `docs/add-contributing` |
| Chore | `chore/name` | `chore/update-deps` |

---

## 📝 Commit Guidelines

Follow this format for all commit messages:

```
feat: add new feature
fix: resolve bug
docs: update documentation
chore: maintenance task
```

Keep commits small, focused and descriptive.

---

## 🛠️ Running Locally

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
cp .env.local.example .env.local
```

3. Fill in `.env.local` with your API keys

4. Run the development server:

```bash
npm run dev
```

5. Open `http://localhost:3000`

---

## 🔍 Before Submitting PR

Run the following checks before opening a PR:

```bash
npm run lint
npm test
```

- Make sure the app runs without errors locally
- Keep changes focused and atomic
- Add screenshots if UI changes are made

---

## 📬 Pull Request Process

1. Push your branch to your fork:

```bash
git push origin your-branch-name
```

2. Open a PR against the `main` branch
3. Fill in the PR description clearly
4. Reference the related issue using `Closes #issue-number`
5. Request review from maintainers
6. Wait for approval before merging

---

## 🐛 Reporting Bugs

- Check existing issues before opening a new one
- Use the GitHub Issues tab
- Provide clear steps to reproduce the bug
- Include screenshots if applicable

---

## 💬 Need Help?

- 📧 Email: support@alphasightai.online
- 💬 GitHub Discussions
- 🐛 GitHub Issues

---

> This project is part of **GSSoC 2026**. We are happy to help first-time contributors! 🌱
