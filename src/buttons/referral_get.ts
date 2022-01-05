import { Collection, MessageEmbed, NewsChannel, TextChannel, ThreadChannel } from "discord.js";
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
        this.name = "referral_get"
        this.regex = /referral_(us|non-us)/
        this.staffOnly = false
    }
    async run(ctx: ButtonContext): Promise<any> {
        let region = ctx.customId.split("_")[1] ?? "non-us"
        let data = await ctx.sql.query(`SELECT * FROM referrals TABLESAMPLE BERNOULLI (100) WHERE region='${region}' ORDER BY RANDOM()`).catch(() => null)
        let row = data?.rows.sort(() => Math.random() > 0.5 ? -1 : 1)?.[0]
        if (!row) return ctx.error("No referral URL has been found for your region")

        if (ctx.interaction.channel?.type === "DM") return null
        if (ctx.interaction.channel?.isThread()) return ctx.error("You can't use this button in Threads")

        let channel = (ctx.interaction.channel as TextChannel)
        let threads = await channel.threads.fetchActive(false).catch(() => null)
        let tempthread = threads?.threads.filter(t => t.name.includes(ctx.interaction.member?.user.username ?? "a thread name that cant be found")) ?? new Collection()
        await Promise.all(tempthread.map(async (t: ThreadChannel) => await t.members.fetch().catch(() => null)))
        if (tempthread?.find(t => t.members.cache.has(ctx.interaction.member?.user.id!))) return ctx.error(`You already have a thread open (<#${threads?.threads.find(t => t.members.cache.has(ctx.interaction.member?.user.id ?? ""))!.id}>).\nGo there or close it first to open a new one.`, { codeblock: false })

        let thread = await channel.threads.create({
            name: `Referral - ${region} - ${ctx.interaction.member?.user.username}`,
            autoArchiveDuration: 60,
            type: (ctx.interaction.guild?.premiumSubscriptionCount ?? 0) >= 7 ? "GUILD_PRIVATE_THREAD" : "GUILD_PUBLIC_THREAD",
        }).catch(() => null)
        if (!thread) return ctx.error("The max amount of threads for this guild has been reached")

        //delete the thread create message if no private threads can be created
        if ((ctx.interaction.guild?.premiumSubscriptionCount ?? 0) < 7) channel.bulkDelete(1)

        let embed = new MessageEmbed()
            .setColor("AQUA")
            .setTitle(`Your referral URL for ${region.toUpperCase()}`)


        if (region === "us") embed.setDescription(`**Submitter** <@${row.discord_id}> (\`${row.discord_id}\`)\n**URL** ${decodeURI(row.url)}\n\nPlease click the above link, if it didn't work please ask the owner of the referral for help with the "add the owner of the URL" button.\n\n **This will bring the user who submitted the link into this channel.** \n\nIf you cannot contact them due to the button being missing and being unable to mention them, then press the red button for another link. `)
        else embed.setDescription(`**Submitter** <@${row.discord_id}> (\`${row.discord_id}\`)\n**URL** ${decodeURI(row.url)}\n\n**Please note you must add the user on Facebook**\n\n If you want to tell them who you are or to accept it, you can press "add the owner of the URL" button and it will bring them into this channel.\n\nIf you cannot contact them due to the button being missing and being unable to mention them, then press the red button for another link. `)


        ctx.reply({ content: `The referral is waiting for you in <#${thread.id}>`, ephemeral: true })
        await thread.members.add(ctx.interaction.member?.user.id!)

        thread.send({
            content: decodeURI(row.url),
            embeds: [embed],
            components: components(region, row.accepts_help_request ? row.discord_id : undefined)
        })


        let log = new MessageEmbed()
            .setTitle(`Referral requested`)
            .setColor("#57F287")
            .setDescription(`<@${ctx.interaction.member?.user.id}> (${ctx.member.user.tag} \`${ctx.interaction.member?.user.id}\`)`)
            .addFields([
                { name: `**URL**`, value: decodeURI(row.url) },
                { name: `**URL owner**`, value: `<@${row.discord_id}> (\`${row.discord_id}\`)` },
                { name: `**Thread**`, value: `<#${thread.id}>`, inline: true },
                { name: `**Region**`, value: row.region, inline: true },
                { name: `**Seen**`, value: row.uses, inline: true },
            ])
        ctx.log(log)
        await ctx.sql.query(`UPDATE referrals SET uses='${Number(row.uses ?? 0) + 1}' WHERE discord_id='${row.discord_id}'`).catch(() => null)
    }
}
