Analyze and fix the GitHub issue: $ARGUMENTS.

Follow these steps:

# PLAN

1. Use 'gh issue view' to get the issue details
2. Understand the problem described in the issue
3. Ask clarifying questions if necessary
4. Understand the prior art for this issue
- Search the scratchpads (/docs/scratchpads) for previous thoughts related to the issue
- Search PRs to see if you can find history on this issue
- Search the codebase for relevant files using dispatch tool - spawn subagents to search different sets of files in parallel
5. Ultrathink about how to break the issue down into a series of small, manageable tasks.
6. Document your plan in a new scratchpad
- Save to /docs/scratchpads/
- Include the issue number & name in the filename, example: issue-123-my-issue.md
- Include a link to the issue in the scratchpad.

# CREATE

- Create a new branch for the issue
- Solve the issue in small, manageable steps, according to your plan.
- Commit your changes after each step.

# TEST

- Use playwright via MCP to test the changes if you have made changes to the UI
- Write tests to describe the expected behavior of your code
- Run the full test suite to ensure you haven't broken anything
- If the tests are failing, fix them
- Ensure that all tests are passing before moving on to the next step

# DEPLOY

- Open a PR and request a review

# REVIEW

Spawn a subagent using dispatch tool to analyze the PR. The subagent should:
1. Use 'gh pr diff' to analyze all changes made
2. Compare changes against the original issue requirements
3. Check if changes are scoped correctly - did the agent only modify what was necessary?
4. Verify all tests are present for new functionality
5. Identify any unnecessary modifications or overreach
6. Make a decision:
- ✅ Approve: Changes match requirements, well-tested, no overreach
- 🔧 Fix: Minor corrections needed - implement fixes and push to same PR
- 🔄 Rollback: Major overreach detected - close PR, rollback, and retry from PLAN phase
7. If fixes are made, re-run TEST phase before finalizing
8. Document review findings in PR comments for transparency

Remember to use the GitHub CLI (`gh`) for all GitHub-related tasks.