# Adding genuine DDSS examples

The demo runs entirely in the browser. It never contacts the local DDSS backend. Current images are AI-generated placeholders with no retrieval scores or clinical labels.

## What to provide

For each approved example, send:
- One query skin image (JPEG, PNG or WebP).
- Its returned reference images, in the order returned by your system.
- A small JSON or CSV export linking that query to each reference image.
- Actual cosine similarity scores, only if available (the UI expects values from 0 to 1; omit otherwise).
- Condition labels and any public-safe metadata, only if available and approved.

No dataset archive, credentials, patient records, backend URL or model weights are needed. A few prepared examples are enough.

## Single place to edit

All demo data and visible text live in `src/content.ts`, under `works.retrievalDemo`.
Uploaded images become `src/assets/*.asset.json` pointers; import a pointer and use its `.url` as the image value.

Use this structure with your real exported values (angle-bracket entries are placeholders, not results):

```text
references: [
  { id: "reference-01", image: <referenceAsset.url>, label: <optional supplied condition>, note: <optional supplied metadata> }
],
samples: [
  {
    id: "query-01",
    label: "Example 1",
    image: <queryAsset.url>,
    matches: [
      { referenceId: "reference-01", similarity: <actual score, or omit this field> }
    ]
  }
]
```

Remove `placeholder: true` only after replacing the illustration with an approved query and supplying its actual matches. Missing scores and labels stay hidden. Scored matches are sorted by descending similarity; unscored matches retain their supplied order. Works shows up to three matches and Deep Dive shows all supplied matches.

The existing product screenshot gallery remains separate: it documents the original app, not live functionality in this demo.