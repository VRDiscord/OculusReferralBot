import { ApplicationCommandData, MessageEmbed, TextChannel } from "discord.js";
import { ApplicationCommandTypes } from "discord.js/typings/enums";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";

const commandData: ApplicationCommandData = {
    type: ApplicationCommandTypes.CHAT_INPUT,
    name: "submitreferral",
    description: "Let's you submit a Oculus referral link",
    options: [{
        type: "STRING",
        required: true,
        name: "region",
        description: "What region you're in",
        choices: [{
            name: "US",
            value: "us"
        }, {
            name: "Non-US",
            value: "non-us"
        }]
    }, {
        type: "STRING",
        required: true,
        description: "The referral url",
        name: "referral-url"
    }]
}

export default class Test extends Command {
    constructor() {
        super(commandData)
        this.name = commandData.name
        this.staffOnly = false
        this.description = `This will allow you to submit your Oculus/Meta referral link.
When typing this command, you need to select US or Non-US and then enter your link in the "referral-url" section.
Once you submit this, it is immediately put into the randomized pool.`
    }
    async run(ctx: CommandContext): Promise<any> {

        let url = ctx.arguments.get("referral-url")?.value?.toString() ?? ""
        let userid = ctx.interaction.member?.user.id
        let data = await ctx.sql.query(`SELECT * FROM referrals WHERE discord_id='${ctx.member.id}'`).catch(() => null)
        if (data?.rows?.length || !data) return ctx.error("You already have a referral URL set up")
        let existing = await ctx.sql.query(`SELECT * FROM referrals WHERE url=$1`, [encodeURI(url)]).catch(() => null)
        if (existing?.rows?.length) return ctx.error("The URL has already been submitted")

        if (ctx.arguments.get("region")?.value?.toString() === "us") {
            if (!/^https?:\/\/www.oculus.com\/referrals\/link\/[A-Za-z0-9_.-]+\/?$/.test(url))
                return ctx.error("Please give a valid US referral url")

            await ctx.sql.query(
                `INSERT INTO referrals (url, region, discord_id, uses) VALUES ($1, 'us', '${userid}', '0')`,
                [encodeURI(url)]
            )

            ctx.reply({ content: "Your referral has been added to the pool and will be randomly chosen", ephemeral: true })
        } else {
            if (!/^https?:\/\/www.((facebook.com\/(profile.php\?id\=)?[A-Za-z0-9_.-]+\/?)|(oculus.com\/((s\/[A-Za-z0-9_.-]+\/?)|(referrals\/link\/[A-Za-z0-9_.-]+\/?))))$/.test(url))
                return ctx.error("Please give a valid Non-US referral url")

            await ctx.sql.query(
                `INSERT INTO referrals (url, region, discord_id, uses) VALUES ($1, 'non-us', '${userid}', '0')`,
                [encodeURI(url)]
            )

            ctx.reply({ content: "Your referral has been added to the pool and will be randomly chosen", ephemeral: true })
        }


        let log = new MessageEmbed()
            .setTitle(`Referral added`)
            .setColor("#5865F2")
            .setDescription(`**User** <@${ctx.interaction.member?.user.id}> (${ctx.member.user.tag} \`${ctx.interaction.member?.user.id}\`)`)
            .addFields([
                { name: `**URL**`, value: url, inline: true },
                { name: `**Region**`, value: ctx.arguments.get("region")?.value?.toString() ?? "non-us", inline: true },
            ])
        ctx.log(log)
    }
}
