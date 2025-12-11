import { AttachmentBuilder, SlashCommandBuilder } from "discord.js";
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
            staff_only: true,
        })
    }

    override async run(ctx: CommandContext): Promise<any> {
        const devices = await ctx.database.query("SELECT * FROM device_referrals").then(res => res.rows).catch(console.error) || []

        const table_data_devices = [
            ["Index", "Uses", "Discord ID", "User ID", "Added"],
            ...devices.map(d => ([d.index, d.uses, d.discord_user_id, d.user_id, d.added_at]))
        ]
        const table_devices = ctx.client.generateTable(table_data_devices)
        
        const file = new AttachmentBuilder(Buffer.from(`Devices\n${table_devices}`, "utf-8"), {name: "export.txt"})
        return ctx.interaction.reply({content: "Attached below.", files: [file]})
    }
}
