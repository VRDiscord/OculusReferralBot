import {readFileSync} from "fs"
import {ActivityType, ApplicationCommandType, InteractionType, PresenceUpdateStatus} from "discord.js";
import { DiscordBotClient } from "./classes/client";
import { handleCommands } from "./handlers/commandHandler";
import { handleComponents } from "./handlers/componentHandler";
import { handleModals } from "./handlers/modalHandler";
import { handleAutocomplete } from "./handlers/autocompleteHandler";
import { handleContexts } from "./handlers/contextHandler";
import { Pool } from "pg";

const RE_INI_KEY_VAL = /^\s*([\w.-]+)\s*=\s*(.*)?\s*$/
for (const line of readFileSync(`${process.cwd()}/.env`, 'utf8').split(/[\r\n]/)) {
    const [, key, value] = line.match(RE_INI_KEY_VAL) || []
    if (!key) continue

    process.env[key] = value?.trim()
}

const connection = new Pool({
    user: process.env["DB_USERNAME"],
    host: process.env["DB_IP"],
    database: process.env["DB_NAME"],
    password: process.env["DB_PASSWORD"],
    port: Number(process.env["DB_PORT"]),
})

const client = new DiscordBotClient({
    intents: ["Guilds"]
})


client.login(process.env["DISCORD_TOKEN"])


client.on("ready", async () => {
    connection.connect()
    .then(async () => {
        await connection.query("CREATE TABLE IF NOT EXISTS games (index SERIAL, game_id VARCHAR(100) PRIMARY KEY, name text not null, platform text not null)")
        await connection.query("CREATE TABLE IF NOT EXISTS game_referrals (index SERIAL, game_id VARCHAR(100) NOT NULL, user_id VARCHAR(100) NOT NULL, discord_user_id VARCHAR(100) NOT NULL, uses int NOT NULL DEFAULT 0, added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP)")
        console.log("Database ready")
    })

    client.commands.loadClasses().catch(console.error)
    client.components.loadClasses().catch(console.error)
    client.contexts.loadClasses().catch(console.error)
    client.modals.loadClasses().catch(console.error)
    client.user?.setPresence({activities: [{type: ActivityType.Listening, name: "to Webhead singing in the shower"}], status: PresenceUpdateStatus.DoNotDisturb, })
    console.log(`Ready`)
    await client.application?.commands.set([...client.commands.createPostBody(), ...client.contexts.createPostBody()]).catch(console.error)
})

client.on("interactionCreate", async (interaction) => {
    switch(interaction.type) {
        case InteractionType.ApplicationCommand: {
            switch(interaction.commandType) {
                case ApplicationCommandType.ChatInput: {
                    return await handleCommands(interaction, client, connection);
                }
                case ApplicationCommandType.User:
                case ApplicationCommandType.Message: {
                    return await handleContexts(interaction, client, connection);
                }
            }
        };
        case InteractionType.MessageComponent: {
			return await handleComponents(interaction, client, connection);
        };
        case InteractionType.ApplicationCommandAutocomplete: {
			return await handleAutocomplete(interaction, client, connection);
        };
        case InteractionType.ModalSubmit: {
			return await handleModals(interaction, client, connection);
        };
    }
})