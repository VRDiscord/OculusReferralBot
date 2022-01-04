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


        if (region === "us") embed.setDescription(`**Submitter** <@${row.discord_id}> (\`${row.discord_id}\`)\n**URL** ${decodeURI(row.url)}\n\nPlease click the above link, if it didn't work please try another link and report this as a bad link with this the red button. \n\n You can also mention the user directly with <@${row.discord_id}> if you want to speak to them, it will bring them into this channel.`)
        else embed.setDescription(`**Submitter** <@${row.discord_id}> (\`${row.discord_id}\`)\n**URL** ${decodeURI(row.url)}\n\n**Please note you do need to add the user on Facebook**\n\n If you want to tell them who you are or to accept it, you can mention them with <@${row.discord_id}> and it will bring them into this channel.\n\nIf you rather try another link, or have not heard back from the user in 30 minutes please click the red button.`)

        ctx.reply({
            content: decodeURI(row.url),
            embeds: [embed],
            components: components(region)
        })

        let log = new MessageEmbed()
            .setTitle(`Referral reported`)
            .setColor("#ED4245")
            .addFields([
                { name: `**Reported URL**`, value: decodeURI(reported) },
                { name: `**Region**`, value: region, inline: true },
                { name: `**Seen**`, value: row.uses, inline: true },
            ])

        let log2 = new MessageEmbed()
            .setTitle(`New referral requested`)
            .setColor("#EB459E")
            .setDescription(`${ctx.member.user.tag} (\`${ctx.interaction.member?.user.id}\`)`)
            .addFields([
                { name: `**URL**`, value: decodeURI(row.url) },
                { name: `**URL owner**`, value: `<@${row.discord_id}> (\`${row.discord_id}\`)` },
                { name: `**Thread**`, value: `<#${ctx.interaction.channelId}>`, inline: true },
                { name: `**Region**`, value: row.region, inline: true },
                { name: `**Seen**`, value: row.uses, inline: true },
            ])
        ctx.log([log, log2])
        await ctx.sql.query(`UPDATE referrals SET uses='${Number(row.uses ?? 0) + 1}' WHERE discord_id='${row.discord_id}'`).catch(() => null)
    }
}
