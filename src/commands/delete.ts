import { ApplicationCommandData, MessageEmbed, TextChannel } from "discord.js";
import { ApplicationCommandTypes } from "discord.js/typings/enums";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";

const commandData: ApplicationCommandData = {
    type: ApplicationCommandTypes.CHAT_INPUT,
    name: "delete",
    description: "Force deletes a referral URL",
    options: [{
        type: "STRING",
        name: "url",
        description: "The referral URL to delete",
        required: true
    }]
}

export default class Test extends Command {
    constructor() {
        super(commandData)
        this.name = commandData.name
        this.staffOnly = true
    }
    async run(ctx: CommandContext): Promise<any> {
        let input = ctx.arguments.get("url")?.value?.toString() ?? ""
        let data = await ctx.sql.query(`SELECT * FROM referrals WHERE url=$1 OR discord_id='${input}' LIMIT 1`, [encodeURI(input)]).catch(() => null)
        if (!data || !data?.rows?.length) return ctx.error("Unable to find that referral")

        await ctx.sql.query(`DELETE FROM referrals WHERE url=$1`, [encodeURI(ctx.arguments.get("url")?.value?.toString() ?? "a banana")]).catch(() => null)


        let log = new MessageEmbed()
            .setTitle(`Referral force removed`)
            .setColor("#FEE75C")
            .setDescription(`**Staff** <@${ctx.interaction.member?.user.id}> (${ctx.member.user.tag} \`${ctx.interaction.member?.user.id}\`)`)
            .addFields([
                { name: `**URL**`, value: decodeURI(data.rows[0].url) },
                { name: `**URL owner**`, value: `<@${data.rows[0].discord_id}> (\`${data.rows[0].discord_id}\`)` },
                { name: `**Region**`, value: data.rows[0].region, inline: true },
                { name: `**Seen**`, value: data.rows[0].uses, inline: true },
            ])
        ctx.log(log)
        ctx.reply({ content: `The referral url has been removed`, ephemeral: true })
    }
}