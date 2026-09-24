# How we researched Pre Share

[Back to the prototype](https://pre-share.vercel.app)

**Short version:** other tools already let you edit AI notes, and at least one can rebuild several outputs at once. That narrowed the idea to one thing worth exploring: seeing exactly what a fix will change, protecting everything else, and undoing it in one step.

## Our first research was too thin
We started from three job posts (Oura, Granola, Dust) and one Granola help article. Job posts tell you what employers value. They don't tell you whether people need a feature. When Arman asked what evidence we had, we went back and looked properly.

## What we found
Checked on September 23, 2026, from public documentation and research summaries.

- **Granola** lets you check the transcript behind a note, edit notes directly, and regenerate or edit them through chat. [Granola docs](https://docs.granola.ai/help-center/taking-notes/ai-enhanced-notes)
- **Otter** can regenerate the summary, action items and outline together after you edit a transcript. Its FAQ says earlier versions can't be restored. This one proved our first picture of the space wrong. [Otter help](https://help.otter.ai/hc/en-us/articles/25846455610263-Regenerate-the-summary)
- **Microsoft Teams Facilitator** lets you edit AI notes and send follow-up tasks on to Planner. [Microsoft support](https://support.microsoft.com/en-us/teams/copilot/facilitator-in-microsoft-teams-meetings)
- **Research on meeting summaries** annotated 200 AI summaries across nine kinds of error, so mistakes in AI notes are a studied problem. [COLING 2025](https://aclanthology.org/2025.coling-main.143/)
- **A Microsoft Research study** with seven people linked editing a recap to collaboration and agreement, not only to fixing errors. [Microsoft Research](https://www.microsoft.com/en-us/research/publication/summaries-highlights-and-action-items-design-implementation-and-evaluation-of-an-llm-powered-meeting-recap-system/)

## What this does and doesn't tell us
It tells us where the idea sits next to what already exists. It doesn't show that people need it.

- We read documentation and summaries, not full studies.
- We didn't test competitors' products with real accounts.
- A help page not mentioning something doesn't prove the product lacks it.
