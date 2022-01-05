import { ApplicationCommandData, MessageEmbed, TextChannel } from "discord.js";
import { ApplicationCommandTypes } from "discord.js/typings/enums";
import { QueryResult } from "pg";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";

const commandData: ApplicationCommandData = {
    type: ApplicationCommandTypes.CHAT_INPUT,
    name: "find",
    description: "Force deletes a referral URL",
    options: [{
        type: "STRING",
        name: "query",
        description: "The referral URL or user id"
    }]
}

export default class Test extends Command {
    constructor() {
        super(commandData)
        this.name = commandData.name
        this.staffOnly = true
    }
    async run(ctx: CommandContext): Promise<any> {
        let input = ctx.arguments.get("query")?.value?.toString()
        let data: QueryResult<any> | undefined
        let count: QueryResult<any> | undefined

        if (input) {
            data = await ctx.sql.query(`SELECT * FROM referrals WHERE url=$1 OR discord_id='${input}' LIMIT 1`, [encodeURI(input)]).catch(() => undefined)
        } else {
            count = await ctx.sql.query(`SELECT COUNT(*) FROM referrals`).catch(() => ({ rows: [{ count: "0" }] } as any))
        }


        let embed = new MessageEmbed()
            .setColor("AQUA")
            .setTitle(`Referral search`)
        if ((!data || !data?.rows?.length) && input) embed.setDescription(`No referrals found with the query \`${input}\``)
        else if (!input) embed.setDescription(`There are currently ${count!.rows[0].count} referrals`)
        else if (data) embed.setDescription(`**Submitter** <@${data!.rows[0].discord_id}> (\`${data!.rows[0].discord_id}\`)\n**URL** ${decodeURI(data!.rows[0].url)}\n**Region** ${data!.rows[0].region}\n**Seen** ${data!.rows[0].uses}`)
        else embed.setDescription("Something went wrong")

        return ctx.reply({ embeds: [embed], ephemeral: true })
    }
}