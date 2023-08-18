import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";
import { SlashCommandBuilder, SlashCommandStringOption, SlashCommandSubcommandBuilder } from "discord.js";

const command_data = new SlashCommandBuilder()
    .setName("savereferral")
    .setDMPermission(false)
    .setDescription(`Save a referral URL into the system`)
    .addSubcommand(
        new SlashCommandSubcommandBuilder()
        .setName("app")
        .setDescription("Referral for a app")
        .addStringOption(
            new SlashCommandStringOption()
            .setName("url")
            .setDescription("The URL to save")
            .setRequired(true)
        )
    )
    .addSubcommand(
        new SlashCommandSubcommandBuilder()
        .setName("device")
        .setDescription("Referral for a device")
        .addStringOption(
            new SlashCommandStringOption()
            .setName("url")
            .setDescription("The URL to save")
            .setRequired(true)
        )
    )

export default class extends Command {
    constructor() {
        super({
            name: "savereferral_app",
            command_data: command_data?.toJSON(),
            staff_only: false,
        })
    }

    override async run(ctx: CommandContext): Promise<any> {
        const link = ctx.interaction.options.getString("url", true)
        if(!ctx.client.regexes.APP_LINK.test(link)) return ctx.error({error: "That is not a valid app referral link"})

        const [username, app_id] = link.split("/").slice(4, 6)
        if(!app_id || !username) return ctx.error({error: "Invalid URL"})

        const referral = await ctx.database.query("SELECT * FROM app_referrals WHERE user_id=$1 AND app_id=$2", [username, app_id]).then(res => res.rows[0]).catch(console.error)
        if(referral) return ctx.interaction.reply({ephemeral: true, content: `This referral has already been added <t:${Math.round(new Date(referral.added_at).getTime()/1000)}:R>`})
        await ctx.interaction.deferReply({ephemeral: true})

        const app = await ctx.client.fetchApp(app_id, ctx.database)
        console.log(app)
        if(!app) return ctx.error({error: "Unable to find referred app"})
        const exists = await ctx.client.referralExists(link)
        if(!exists) return ctx.error({error: "This referral does not exist"})

        const res = await ctx.database.query("INSERT INTO app_referrals (app_id, user_id, discord_user_id) VALUES ($1, $2, $3)", [app_id, username, ctx.interaction.user.id]).catch(console.error)
        if(!res?.rowCount) return ctx.error({error: "Unable to save referral"})

        ctx.interaction.editReply({
            content: `App referral for app ${app?.name} saved`
        })
    }
}