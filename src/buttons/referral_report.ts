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
    },{
        type: 2,
        custom_id: `referral_report_${region}`,
        label: "This URL didn't work",
        style: 4
    }]
}]

export default class Test extends Button{
    constructor(){
        super()
        this.name = "referral_report"
        this.regex = /referral_report_(us|non-us)/
        this.staffOnly = false
    }
    async run(ctx: ButtonContext): Promise<any> {
        let region = ctx.customId.split("_")[2] ?? "non-us"
        let data = await ctx.sql.query(`SELECT * FROM referrals TABLESAMPLE BERNOULLI (100) WHERE region='${region}'`).catch(() => null)
        if(!data) return ctx.error("No other referral URL has been found for your region")
        if(ctx.interaction.channel?.type === "DM") return null
        if(!ctx.interaction.channel?.isThread()) return ctx.error("You can't use this button in Threads")

        let embed = new MessageEmbed()
        .setColor("AQUA")
        .setTitle(`Your new referral URL for ${region.toUpperCase()}`)
        .setDescription(`**Submitter** <@${data.rows[0].discord_id}> (\`${data.rows[0].discord_id}\`)\n**URL** ${decodeURI(data.rows[0].url)}\n**Uses** ${data.rows[0].uses}\n\nIf the link didn't work press the red button\n\nIf you're done or selected the wrong region click the green button.`)

        ctx.reply({
            content: decodeURI(data.rows[0].url),
            embeds: [embed],
            components: components(region)
        })

        let reported = ctx.interaction.message.content
        ctx.log(`${ctx.member.user.tag} (\`${ctx.interaction.member?.user.id}\`) reported the referral URL <${reported}> for **${region}**`)

        await ctx.sql.query(`UPDATE referrals SET uses='${Number(data.rows[0].uses ?? 0)+1}' WHERE discord_id='${data.rows[0].discord_id}'`).catch(() => null)
    }
}