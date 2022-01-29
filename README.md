# [@sesuritu_bot](https://t.me/sesuritu_bot) Telegram bot code

This is the code for the anti-spam Telegram bot I've built. Enjoy and feel free to reuse!

You can ask questions/submit feature requests in the [@sesuritu_chat](https://t.me/sesuritu_chat) chat (or issues of this repo).

Actually, this is a fork of https://github.com/1inch/shieldy

# Installation

## Local launch

1. Clone this repo: `git clone https://github.com/Rulexec/shieldy`
2. Launch the [mongo database](https://www.mongodb.com/) locally
3. Create `.env` with the environment variables listed below
4. Run `yarn install` in the root folder
5. Run `yarn distribute`

And you should be good to go! Feel free to fork and submit pull requests. Thanks!

## Docker

1. Clone this repo: `git clone https://github.com/Rulexec/shieldy`
2. Replace the dummy environment variables in `docker-compose.yml` with the ones listed below
3. Run `docker-compose up -d`

## Environment variables

- `TOKEN` — Telegram bot token
- `MONGO`— URL of the mongo database

Also, please, consider looking at `src/config.ts`.

# Disclaimers

- Database from original `shieldy` may be not compatible, you'll need to run https://github.com/Rulexec/shieldy/blob/master/src/database/mongo/migrations/ver-1.ts to ensure that collections contain no duplicates for new indexes
- Docker is no more supported, I don't know state of it (maybe it's still fine)
- `master` branch is not always in sync with [@sesuritu_bot](https://t.me/sesuritu_bot)

# License

MIT — use for any purpose. Would be great if you could leave a note about the original developers. Thanks!
