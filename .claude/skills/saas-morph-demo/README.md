# saas-morph-demo (skill source)

Source files for the **saas-morph-demo** skill — the one that turns a SaaS product screenshot + description into a React + framer-motion morph animation component.

## File structure

```
saas-morph-demo/
├── SKILL.md                       Main workflow + decision tree
├── assets/
│   └── template.jsx               The working JobPilot template (with // CUSTOMIZE: markers)
├── references/
│   ├── stage-design.md            5-stage decomposition templates by product category
│   └── visual-identity.md         Curated typography pairings + color palettes
├── build.sh                       Repackages this folder into a .skill file
└── README.md                      You are here
```

## Editing the skill

Open this folder in VS Code:

```bash
code .
```

Edit any of:
- **SKILL.md** — the main instructions Claude follows when the skill triggers
- **assets/template.jsx** — the React template that gets customized for each product
- **references/*.md** — supporting docs Claude reads when needed

After editing, repackage:

```bash
chmod +x build.sh        # first time only
./build.sh
```

This produces `../saas-morph-demo.skill` next to this folder.

## Installing the skill

In claude.ai:

1. Click your avatar → **Settings**
2. Go to **Capabilities** → **Skills**
3. Click **Upload skill**
4. Select the `.skill` file produced by `build.sh`

To update an installed skill, upload the new `.skill` file with the same name — it'll replace the old one.

## How it works (quick mental model)

When the user says something like "build me a morph hero animation for my product" + drops a screenshot, Claude:

1. Reads `SKILL.md` for the workflow
2. Reads `references/stage-design.md` and `references/visual-identity.md` to design the 5 stages and pick visual identity
3. Reads `assets/template.jsx` as the starting point
4. Customizes the template based on the product
5. Outputs a `.jsx` file the user can drop into their React project

The skill output is an **embeddable component** — not a full page. The user wraps it in their own `<section>` on their existing site.

## Iterating

If you find the skill produces sub-par results, the most common things to edit:

- **SKILL.md → "Things that go wrong"** — add new failure modes you observed
- **references/stage-design.md** — add a new pattern if a product category isn't covered
- **assets/template.jsx → // CUSTOMIZE: markers** — sharpen the guidance on what to change

Repackage with `./build.sh` after each edit to test the new version.
