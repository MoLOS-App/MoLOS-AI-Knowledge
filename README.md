# MoLOS-AI-Knowledge

AI prompt management, playground testing, humanization workflows, and LLM.txt storage for MoLOS.

## Features

- Prompt library with version history, tags, categories, and favorites
- Playground session tracking with model settings and cost estimation metadata
- Humanizer job tracking with tone/level metadata
- LLM.txt file storage with versioning
- Prompt chains, A/B tests, usage analytics, and shared libraries

## Routes

- UI: `/ui/MoLOS-AI-Knowledge`
- API: `/api/MoLOS-AI-Knowledge`

## Development

From the MoLOS root:

```bash
npm run dev
```

## Notes

- All data is scoped by `userId`.
- Table prefix: `MoLOS-AI-Knowledge_`.
- Timestamps are stored as unix seconds.
