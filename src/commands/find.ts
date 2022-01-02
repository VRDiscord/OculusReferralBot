import { ApplicationCommandData, MessageEmbed, TextChannel } from "discord.js";
import { ApplicationCommandTypes } from "discord.js/typings/enums";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";

const commandData: ApplicationCommandData = {
    type: ApplicationCommandTypes.CHAT_INPUT,
    name: "find",
    description: "Force deletes a referral URL",
    options: [{
        type: "STRING",
        name: "query",
        description: "The referral URL or user id",
        required: true
    }]
}

export default class Test extends Command{
    constructor(){
        super(commandData)
        this.name = commandData.name
        this.staffOnly = true
    }
    async run(ctx: CommandContext): Promise<any> {
        let input = ctx.arguments.get("query")?.value?.toString() ?? ""
        let data = await ctx.sql.query(`SELECT * FROM referrals WHERE url=$1 OR discord_id='${input}' LIMIT 1`, [encodeURI(input)]).catch(() => null)
        if(!data || !data?.rows?.length) return ctx.error("Unable to find that referral")

        let count = await ctx.sql.query(`SELECT COUNT(*) FROM referrals`).catch(() => ({rows: [{count: "0"}]}))
        
        let embed = new MessageEmbed()
        .setColor("AQUA")
        .setTitle(`Referral found out of ${count.rows[0].count} entries`)
        .setDescription(`**Submitter** <@${data.rows[0].discord_id}> (\`${data.rows[0].discord_id}\`)\n**URL** ${decodeURI(data.rows[0].url)}\n**Region** ${data.rows[0].region}\n**Uses** ${data.rows[0].uses}`)

        return ctx.reply({embeds: [embed], ephemeral: true})
    }
}