import { SlashCommandBuilder } from "discord.js";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";


const command_data = new SlashCommandBuilder()
    .setName("removereferrals")
    .setDMPermission(false)
    .setDescription(`Remove all your referral links`)

export default class extends Command {
    constructor() {
        super({
            name: "removereferrals",
            command_data: command_data.toJSON(),
            staff_only: false,
        })
    }

    override async run(ctx: CommandContext): Promise<any> {
        await ctx.database.query("DELETE FROM app_referrals WHERE discord_user_id=$1", [ctx.interaction.user.id]).catch(console.error) || []
        await ctx.database.query("DELETE FROM device_referrals WHERE discord_user_id=$1", [ctx.interaction.user.id]).catch(console.error) || []

        return ctx.interaction.reply({content: "All referral links removed", ephemeral: true})
    }
}