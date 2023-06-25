import { AttachmentBuilder, Colors, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";


const command_data = new SlashCommandBuilder()
    .setName("viewreferrals")
    .setDMPermission(false)
    .setDescription(`View your referral links`)

export default class extends Command {
    constructor() {
        super({
            name: "viewreferrals",
            command_data: command_data.toJSON(),
            staff_only: false,
        })
    }

    override async run(ctx: CommandContext): Promise<any> {
        const devices = await ctx.database.query("SELECT * FROM device_referrals WHERE discord_user_id=$1", [ctx.interaction.user.id]).then(res => res.rows).catch(console.error) || []
        const apps = await  ctx.database.query("SELECT app_referrals.user_id, app_referrals.app_id, apps.name, app_referrals.uses, app_referrals.added_at FROM app_referrals LEFT JOIN apps ON app_referrals.app_id=apps.app_id AND app_referrals.discord_user_id=$1", [ctx.interaction.user.id]).then(res => res.rows).catch(console.error) || []

        const description = `## Devices\n${devices.map((d) => `\` ${d.uses} \` [${d.user_id}](https://www.oculus.com/referrals/link/${d.user_id}/)`).join("\n") || "none"}\n\n## Apps\n${apps.map((a) => `\` ${a.uses} \` [${a.name}](https://www.oculus.com/appreferrals/${a.user_id}/${a.app_id}/)`).join("\n") || "none"}`

        if(description.length > 4000) {
            const file = new AttachmentBuilder(Buffer.from(`Devices\n\n${devices.map((d) => `${d.uses.toString().padStart(3, "0")} | ${d.user_id} | https://www.oculus.com/referrals/link/${d.user_id}/`).join("\n") || "none"}\n\n\nApps\n\n${apps.map((a) => `${a.uses.toString().padStart(3, "0")} | ${a.user_id} | ${a.name} | https://www.oculus.com/appreferrals/${a.user_id}/${a.app_id}/`).join("\n") || "none"}`), {name: "referrals.txt"})
            return ctx.interaction.reply({content: "Attached below.", files: [file]})
        }

        const embed = new EmbedBuilder({
            color: Colors.Navy,
            title: "Your Referral Links",
            description
        })

        return ctx.interaction.reply({embeds: [embed]})
    }
}