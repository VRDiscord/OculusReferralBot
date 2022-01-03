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
        this.name = "referral_get"
        this.regex = /referral_(us|non-us)/
        this.staffOnly = false
    }
    async run(ctx: ButtonContext): Promise<any> {
        let region = ctx.customId.split("_")[1] ?? "non-us"
        let data = await ctx.sql.query(`SELECT * FROM referrals TABLESAMPLE BERNOULLI (100) WHERE region='${region}' ORDER BY RANDOM()`).catch(() => null)
        let row = data?.rows.sort(() => Math.random() > 0.5 ? -1 : 1)?.[0]
        if(!row) return ctx.error("No referral URL has been found for your region")

        if (ctx.interaction.channel?.type === "DM") return null
        if (ctx.interaction.channel?.isThread()) return ctx.error("You can't use this button in Threads")

        let channel = (ctx.interaction.channel as TextChannel)
        let threads = await channel.threads.fetchActive().catch(() => null)
        if(threads?.threads.find(t => t.name.includes(ctx.interaction.member?.user.username ?? ""))) return ctx.error(`You already have a thread open (<#${threads?.threads.find(t => t.name.includes(ctx.interaction.member?.user.username ?? ""))!.id}>).\nGo there or close it first to open a new one.`, {codeblock: false})

        let thread = await channel.threads.create({
            name: `Referral - ${region} - ${ctx.interaction.member?.user.username}`,
            autoArchiveDuration: 60,
            type: (ctx.interaction.guild?.premiumSubscriptionCount ?? 0) >= 7 ? "GUILD_PRIVATE_THREAD" : "GUILD_PUBLIC_THREAD"
        }).catch(() => null)
        if (!thread) return ctx.error("The max amount of threads for this guild has been reached")

        //delete the thread create message if no private threads can be created
        if ((ctx.interaction.guild?.premiumSubscriptionCount ?? 0) < 7) channel.bulkDelete(1)

        let embed = new MessageEmbed()
            .setColor("AQUA")
            .setTitle(`Your referral URL for ${region.toUpperCase()}`)
            
        
        if(region === "us") embed.setDescription(`**Submitter** <@${row.discord_id}> (\`${row.discord_id}\`)\n**URL** ${decodeURI(row.url)}\n\nIf the link didn't work, please try tagging the user <@${row.discord_id}> \n\nIf you spoke with the user, or rather try another link please click the red button.`)
        else embed.setDescription("non-us")
                                                                                     
        ctx.reply({ content: `The referral is waiting for you in <#${thread.id}>`, ephemeral: true })
        await thread.members.add(ctx.interaction.member?.user.id!)

        thread.send({
            content: decodeURI(row.url),
            embeds: [embed],
            components: components(region)
        })

        ctx.log(`${ctx.member.user.tag} (\`${ctx.interaction.member?.user.id}\`) got the referral url <${data!.rows[0].url}> submitted by ${data!.rows[0].discord_id}`)
        await ctx.sql.query(`UPDATE referrals SET uses='${Number(row.uses ?? 0) + 1}' WHERE discord_id='${row.discord_id}'`).catch(() => null)
    }
}
