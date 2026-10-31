# Development

These are Yohaku's design and engineering documents, from the original product requirements to the technical route, the architecture, the plan of work and how builds and releases happen. They are the same files as [`docs/yohaku/`](https://github.com/Chaosnap/Yohaku/tree/main/docs/yohaku) in the repository, read when the site is built rather than copied.

::: info Written in Chinese
The development documents are written in Simplified Chinese, and the pages here show the originals. Your browser can translate them.
:::

| Document | What's in it |
|---|---|
| [00 · Product vision](./00-vision) | The full product requirements, kept as written |
| [01 · Feasibility study](./01-feasibility) | Reference projects, what to reuse, adapt or build, the technical route and the decisions made |
| [02 · Architecture](./02-architecture) | Repository layout and upstream syncing, the audio engines, ambient sound, the data model, what was cut from Readest |
| [03 · Roadmap and milestones](./03-roadmap) | Each phase's tasks, acceptance criteria and technical spikes |
| [04 · Builds, tests and releases](./04-ci-release) | GitHub Actions workflows, the build matrix, signing and automatic checks |
| [Changes to Readest](./upstream-patches) | Every change made to Readest's code, and why |

What changed in each version is in the [changelog](/changelog/).

## Conventions

- **Compiling, testing, packaging and releasing all happen on GitHub Actions**; only code and assets are kept locally. See [Built in the cloud](/guide/building).
- Yohaku's own code lives in `yohaku/` folders (such as `apps/readest-app/src/yohaku/`). A change to one of Readest's files carries a `[yohaku]` comment and is recorded in [Changes to Readest](./upstream-patches).
- Offline and branding behaviour is controlled by `isYohakuBuild()`: app builds turn it on, and unit tests leave it off, so Readest's own tests keep checking Readest's behaviour.
- Signing keys and credentials never go into the repository.

Issues and pull requests are welcome on [GitHub](https://github.com/Chaosnap/Yohaku).
