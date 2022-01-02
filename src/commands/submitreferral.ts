import { ApplicationCommandData, TextChannel } from "discord.js";
import { ApplicationCommandTypes } from "discord.js/typings/enums";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";

const commandData: ApplicationCommandData = {
    type: ApplicationCommandTypes.CHAT_INPUT,
    name: "submitreferral",
    description: "Let's you submit a referral link",
    options: [{
        type: "STRING",
        required: true,
        name: "region",
        description: "What region you're in",
        choices: [{
            name: "US",
            value: "us"
        },{
            name: "Non-US",
            value: "non-us"
        }]
    },{
        type: "STRING",
        required: true,
        description: "The referral url",
        name: "referral-url"
    }]
}

export default class Test extends Command{
    constructor(){
        super(commandData)
        this.name = commandData.name
        this.staffOnly = false
    }
    async run(ctx: CommandContext): Promise<any> {
        
        let url = ctx.arguments.get("referral-url")?.value?.toString() ?? ""
        let userid = ctx.interaction.member?.user.id
        let data = await ctx.sql.query(`SELECT * FROM referrals WHERE discord_id='${ctx.member.id}'`).catch(() => null)
        if(data?.rows?.length || !data) return ctx.error("You already have a referral URL set up")
        let existing = await ctx.sql.query(`SELECT * FROM referrals WHERE url=$1`, [encodeURI(url)]).catch(() => null)
        if(existing?.rows?.length) return ctx.error("The URL has already been submitted")
        
        if(ctx.arguments.get("region")?.value?.toString() === "us") {
            if(!/^https?:\/\/www.oculus.com\/referrals\/link\/[A-Za-z0-9]+\/?$/.test(url))
            return ctx.error("Please give a valid US referral url")

            await ctx.sql.query(
                `INSERT INTO referrals (url, region, discord_id, uses) VALUES ($1, 'us', '${userid}', '0')`,
                [encodeURI(url)]
            )

            ctx.log(`${ctx.member.user.tag} (\`${userid}\`) added their referral url for US: <${url}>`)
            ctx.reply({content: "Your referral url has been added to the pool and will be randomly chosen", ephemeral: true})
        } else {
            if(!/^https?:\/\/www.((facebook.com\/profile.php\?id\=[0-9]+)|(oculus.com\/((s\/[A-Za-z0-9]+\/?)|(referrals\/link\/[A-Za-z0-9]+\/?))))$/.test(url))
            return ctx.error("Please give a valid Non-US referral url")

            await ctx.sql.query(
                `INSERT INTO referrals (url, region, discord_id, uses) VALUES ($1, 'non-us', '${userid}', '0')`,
                [encodeURI(url)]
            )

            ctx.log(`${ctx.member.user.tag} (\`${userid}\`) added their referral url for non-US: <${url}>`)
            ctx.reply({content: "Your referral url has been added to the pool and will be randomly chosen", ephemeral: true})
        }
    }
}