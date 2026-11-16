---
name: ask3
description: Send one question to three Claude models at once (Fable 5.2 medium, Opus 5.5 high, Sonnet 5.5 max) as T3 Code child agents, then show a short verdict first, a one-row-per-model table, and where they agree and differ. Use only when the user types /ask3.
disable-model-invocation: true
argument-hint: <your question>
---

# ask3: one question, three models

The user wants to see how three models answer the same question. Your job is to be a fair
messenger, not a fourth answerer: send the same brief to all three, wait, then compare.

The question is: $ARGUMENTS

If `$ARGUMENTS` is empty, use the user's last message as the question. If there is still no
question, ask for one and stop.

## 1. Write ONE brief

Children start with no history from this thread. Write a single self-contained brief that
all three get word for word:

- The question, in the user's words. Fix nothing, rephrase nothing.
- Context the question depends on: the working directory, file paths, earlier facts from
  this conversation. Paste short excerpts; give paths for long files so the child reads them.
- These rules, verbatim:
  > Answer the question directly. Read files or search the web if it helps, but do NOT
  > edit, create or delete any file, do not commit, do not run anything that changes state.
  > Start with a one-line answer, then your reasoning. Say how sure you are (low / medium /
  > high) and what would change your mind. Under 250 words unless the question needs more.

Never tell a child that other models are answering too, and never name the other models.
That keeps the answers independent.

## 2. Start all three in ONE message

Call `orchestrator_capabilities` first if you have not in this thread. Then send three
`delegate_task` calls in the same message so they run in parallel:

| title | target.model | target.options |
|---|---|---|
| `ask3 · Fable 5.2 medium` | `claude-fable-5-2` | `{effort: "medium"}` |
| `ask3 · Opus 5.5 high` | `claude-opus-5-5` | `{effort: "high"}` |
| `ask3 · Sonnet 5.5 max` | `claude-sonnet-5-5` | `{effort: "max"}` |

For every call: `target.providerInstanceId: "claudeAgent"`, `role: "research"`,
`mode: "async"`, `isolation: "shared"`, the same `task` text.

If a model or effort is missing from `orchestrator_capabilities`, say so and run the other
two. Never swap in a different model on your own.

## 3. Wait without polling

Follow each task's `next`. Do not loop on `task_status`, `sleep` or Monitor; the harness
wakes you when a child finishes. Tell the user in one line that the three are running.

If one child fails or times out, report that and compare the ones that answered.

When a child finishes before the others, say nothing beyond one line ("Opus is done, two
still running"). Do not summarise its answer yet.

## 4. Show the result: short, decision first

The user reads this to decide, not to study. Plain simple English (not a native speaker),
short sentences, **under 200 words in total**. Do NOT paste the children's answers; the user
opens a child thread if they want the full text. Output exactly this, in this order:

1. **Verdict** (2 or 3 lines): what to do, and which model got closest.
2. **Table**: one row per model: short answer (max 10 words), confidence, link to its
   child thread (the `link` from `delegate_task`, verbatim).
3. **They agree on** (max 3 bullets, one line each).
4. **They differ on** (max 3 bullets, one line each): the point, who is right, and
   "checked" or "not checked". Check with a read-only command or file read when that is
   quick; skip the rest.

Leave out: sources, times, the brief, risks lists, anything the user cannot act on. If a
detail matters for the decision, it goes in the verdict in one line; otherwise drop it.
Never edit a child's answer; you only point to it.
