import { SlashCommandBuilder, SlashCommandUserOption } from "discord.js";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";


const command_data = new SlashCommandBuilder()
    .setName("deletereferrals")
    .setDMPermission(false)
    .setDescription(`Remove a users referrals`)
    .addUserOption(
        new SlashCommandUserOption()
        .setName("user")
        .setDescription("The user whose referrals you want to remove")
        .setRequired(false)
    )

export default class extends Command {
    constructor() {
        super({
            name: "deletereferrals",
            command_data: command_data.toJSON(),
            staff_only: false,
        })
    }

    override async run(ctx: CommandContext): Promise<any> {
        const id = ctx.interaction.options.getUser("user")?.id || ctx.interaction.user.id

        if(id !== ctx.interaction.user.id && !ctx.is_staff) return ctx.error({error: "You need to be staff to remove other users referrals"})

        await ctx.database.query("DELETE FROM app_referrals WHERE discord_user_id=$1", [id]).catch(console.error) || []
        await ctx.database.query("DELETE FROM device_referrals WHERE discord_user_id=$1", [id]).catch(console.error) || []

        return ctx.interaction.reply({content: "All referral links removed", ephemeral: true})
    }
}