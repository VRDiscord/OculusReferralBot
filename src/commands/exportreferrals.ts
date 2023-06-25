import { AttachmentBuilder, Colors, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";


const command_data = new SlashCommandBuilder()
    .setName("exportreferrals")
    .setDMPermission(false)
    .setDescription(`Export all referral links`)

export default class extends Command {
    constructor() {
        super({
            name: "exportreferrals",
            command_data: command_data.toJSON(),
            staff_only: false,
        })
    }

    override async run(ctx: CommandContext): Promise<any> {
        const devices = await ctx.database.query("SELECT * FROM device_referrals").then(res => res.rows).catch(console.error) || []
        const apps = await  ctx.database.query("SELECT app_referrals.user_id, app_referrals.discord_user_id, app_referrals.app_id, apps.name, app_referrals.uses, app_referrals.added_at FROM app_referrals LEFT JOIN apps ON app_referrals.app_id=apps.app_id").then(res => res.rows).catch(console.error) || []
    

        ctx.client.generateTable([[1, 2], [3, 4]])

        const table_data = [
            ["Index", "Uses", "Discord ID", "User ID", "Added"],
            ...devices.map(d => ([d.index, d.uses, d.discord_user_id, d.user_id, d.added_at]))
        ]

        const table = ctx.client.generateTable(table_data)
        
        const file = new AttachmentBuilder(Buffer.from(table), {name: "export.txt"})
        return ctx.interaction.reply({content: "Attached below.", files: [file]})
    }
}