import { SlashCommandBuilder, SlashCommandStringOption } from "discord.js";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";


const command_data = new SlashCommandBuilder()
    .setName("addgame")
    .setDMPermission(false)
    .setDescription(`Manually add a game`)
    .addStringOption(
        new SlashCommandStringOption()
        .setName("app_id")
        .setDescription("The ID of the app")
        .setRequired(true)
    )
    .addStringOption(
        new SlashCommandStringOption()
        .setName("name")
        .setDescription("The name of the app")
        .setRequired(true)
    )
    .addStringOption(
        new SlashCommandStringOption()
        .setName("platform")
        .setDescription("The platform of the app")
        .setRequired(true)
        .addChoices(
            {
                name: "Quest",
                value: "quest"
            },
            {
                name: "Quest 2",
                value: "quest 2"
            },
            {
                name: "Rift",
                value: "rift"
            },
            {
                name: "Go",
                value: "go"
            },
            {
                name: "Gear VR",
                value: "gear vr"
            }
        )
    )

export default class extends Command {
    constructor() {
        super({
            name: "addgame",
            command_data: command_data.toJSON(),
            staff_only: false,
        })
    }

    override async run(ctx: CommandContext): Promise<any> {
        const appid = ctx.interaction.options.getString("app_id", true)
        const name = ctx.interaction.options.getString("name", true)
        const platform = ctx.interaction.options.getString("platform", true)

		const res = await ctx.database.query("INSERT INTO apps (app_id, name, platform) VALUES ($1, $2, $3) ON CONFLICT (app_id) DO NOTHING", [appid, name, platform]).catch(console.error)

        if(!res?.rowCount) return ctx.error({error: "Unable to save app"})

        return ctx.interaction.reply({
            content: "App saved",
            ephemeral: true
        })
    }
}