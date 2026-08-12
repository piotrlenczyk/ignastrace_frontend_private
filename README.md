# README!!

Next.js project for Mobitrace.io with typescript and tailwindcss

- [Development](docs/development.md)
- [Deployment](docs/deployment.md)
- [Translations](docs/translations.md)

## Design

[Designed by uiflip](https://www.figma.com/design/fkqq5XVw377BbMnAWh8kyy/Mobitrace.io?node-id=4090-52214&t=KlmEXMCKZqbaxC0a-1)

## Problem solving

- Stripe does not let you finalize a payment, error 503. Surely you have previously been working on a project with stripe and you have cached the id of the other project. To fix this you need to do a Reset database.
```sh
bin/dockerdev run rails db:reset
```

