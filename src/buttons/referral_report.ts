import { MessageEmbed, NewsChannel, TextChannel } from "discord.js";
import { Button } from "../classes/button";
import { ButtonContext } from "../classes/buttonContext";

const components = (region: string) => [{
    type: 1,
    components: [{
        type: 2,
        custom_id: "referral_done",
        label: "I'm finished",
        style: 3
    }, {
        type: 2,
        custom_id: `referral_report_${region}`,
        label: "This URL didn't work",
        style: 4
    }]
}]

export default class Test extends Button {
    constructor() {
        super()
        this.name = "referral_report"
        this.regex = /referral_report_(us|non-us)/
        this.staffOnly = false
    }
    async run(ctx: ButtonContext): Promise<any> {
        let region = ctx.customId.split("_")[2] ?? "non-us"
        let reported = ctx.interaction.message.content
        let data = await ctx.sql.query(`SELECT * FROM referrals TABLESAMPLE BERNOULLI (100) WHERE region='${region}' AND NOT url=$1 ORDER BY RANDOM()`, [reported]).catch(() => null)
        let row = data?.rows.sort(() => Math.random() > 0.5 ? -1 : 1)?.[0]
        if (!row) return ctx.error("No other referral has been found for your region")
        if (ctx.interaction.channel?.type === "DM") return null
        if (!ctx.interaction.channel?.isThread()) return ctx.error("You can't use this button in Threads")

        let embed = new MessageEmbed()
            .setColor("AQUA")
            .setTitle(`Your new referral URL for ${region.toUpperCase()}`)
            
        
        if(region === "us") embed.setDescription(`**Submitter** <@${row.discord_id}> (\`${row.discord_id}\`)\n**URL** ${decodeURI(row.url)}\n\nIf the link didn't work press the red button\n\nIf you're done or selected the wrong region click the green button.`)
        else embed.setDescription("non-us")
        
        ctx.reply({
            content: decodeURI(row.url),
            embeds: [embed],
            components: components(region)
        })

        ctx.log(`${ctx.member.user.tag} (\`${ctx.interaction.member?.user.id}\`) reported the referral URL <${reported}> for **${region}**`)

        await ctx.sql.query(`UPDATE referrals SET uses='${Number(row.uses ?? 0) + 1}' WHERE discord_id='${row.discord_id}'`).catch(() => null)
    }
}
