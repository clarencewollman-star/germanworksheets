# Project workflow

- Make and test changes locally. Ask the user before pushing to GitHub; do not push unless explicitly authorized.
- The maintained website is in outputs/. Follow outputs/AGENTS.md.
- Keep the homepage version in outputs/assets/version.js current for each release. Use major.minor.patch: patch for fixes, minor for new features, major for breaking changes. The initial numbered release is 1.0.0.
- After changing any JS/CSS, version, or page asset reference, run `node scripts/stamp-version.cjs` to regenerate content-hashed assets and HTML URLs. CI and Docker builds also run it. Do not edit generated files.
