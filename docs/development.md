# Development

## Getting Started

Copy and modify the `.env` file

```
cp .env.example .env
```

Install all dependencies

```
npm install
```

Create the first build

```
npm run build
```

Start the development server

```
npm run dev:next
```

## Generate icons

1. Place your SVG files inside `/src/components/ui/icon/svgs` folder.
2. Run `npm run generate:icons` script.
3. Use your icon as a React component:

```tsx
import { IconRobot } from '@/components/ui/icon/icons';

const Foo = () => <IconRobot size="small" />;
```

## Semantic Commit Messages

See how a minor change to your commit message style can make you a better programmer.

Format: `<type>(<scope>): <subject>`

`<scope>` is optional

### Example

```
feat: add hat wobble
^--^  ^------------^
|     |
|     +-> Summary in present tense.
|
+-------> Type: chore, docs, feat, fix, refactor, style, or test.
```

More Examples:

- `feat`: (new feature for the user, not a new feature for build script)
- `fix`: (bug fix for the user, not a fix to a build script)
- `docs`: (changes to the documentation)
- `style`: (formatting, missing semi colons, etc; no production code change)
- `refactor`: (refactoring production code, eg. renaming a variable)
- `test`: (adding missing tests, refactoring tests; no production code change)
- `chore`: (updating grunt tasks etc; no production code change)

References:

- https://www.conventionalcommits.org/
- https://seesparkbox.com/foundry/semantic_commit_messages
- http://karma-runner.github.io/1.0/dev/git-commit-msg.html
