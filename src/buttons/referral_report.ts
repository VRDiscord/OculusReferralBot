import { MessageEmbed, NewsChannel, TextChannel } from "discord.js";
import { Button } from "../classes/button";
import { ButtonContext } from "../classes/buttonContext";

const components = (region: string, adduser?: string) => {
    let comps = [{
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

    if (adduser)
        comps[0].components.push({
            type: 2,
            custom_id: `add_user_${adduser}`,
            label: "Add the owner of the URL",
            style: 1
        })
    return comps
}

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


        if (region === "us") embed.setDescription(`**Submitter** <@${row.discord_id}> (\`${row.discord_id}\`)\n**URL** ${decodeURI(row.url)}\n\nPlease click the above link, if it didn't work please ask the owner of the referral for help with the "add the owner of the URL" button.\n This will bring the user who submitted the link into this channel. \n If you cannot contact them due to the button being missing and being unable to mention them, then press the red button for another link. `)
        else embed.setDescription(`**Submitter** <@${row.discord_id}> (\`${row.discord_id}\`)\n**URL** ${decodeURI(row.url)}\n\n**Please note you must add the user on Facebook**\n\n If you want to tell them who you are or to accept it, you can press "add the owner of the URL" button and it will bring them into this channel.\n\nIf you cannot contact them due to the button being missing and being unable to mention them, then press the red button for another link. `)
        ctx.update({ content: ctx.interaction.message.content, embeds: ctx.interaction.message.embeds, components: [] })

        let payload = {
            content: decodeURI(row.url),
            embeds: [embed],
            components: components(region, row.accepts_help_request ? row.discord_id : undefined)
        };
        //using this janky solution since discord.js doesn't allow you to send followups after replying for no reason
        (ctx.client as any).api.webhooks(ctx.interaction.applicationId, ctx.interaction.token).post({ data: payload })

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
            .setDescription(`<@${ctx.interaction.member?.user.id}> (${ctx.member.user.tag} \`${ctx.interaction.member?.user.id}\`)`)
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
