---
name: github-pr
description: Simple GitHub PR creation defaults for this repo - use whenever the user asks to create/open a GitHub pull request for the current changes.
---

# GitHub PR Automation

- Use `develop` as the default PR base branch.
- Jira base URL: `https://futuremedia.atlassian.net/browse/`
- Read the Jira ticket key from the current branch name when present, for example `fix/RESUME-1835` -> `RESUME-1835`.
- If there is no ticket key in the branch name (e.g. still on `develop`/`main`), create a new branch named `<JIRA_TICKET>/short-description` before committing, using the ticket key from context (the conversation, an attached Jira link, etc.).
- Format the PR title as `JIRA_TICKET: feat/fix(scope) Short description`.
- Format the PR body with exactly these sections:
  - `## Summary`
  - `## Jira`
- Build the Jira ticket link as `https://futuremedia.atlassian.net/browse/<JIRA_TICKET>` and include it in the PR body.
- Keep PR creation simple: no extra branch analysis or pre-checks beyond what is needed to create the PR.
- Return the created PR URL to the user.
- Do not include any AI-tool branding or boilerplate (e.g. "Made with Cursor", "Generated with Claude Code") in the PR title, PR body, compare URL, commit message, or any generated text.
- When creating PRs with `gh`, prefer `--body-file` over inline heredoc shell interpolation for multi-line bodies, or verify the saved PR body immediately after creation to ensure no stray footer or `EOF` text was appended.
