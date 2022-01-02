import { ApplicationCommandData, MessageEmbed, TextChannel } from "discord.js";
import { ApplicationCommandTypes } from "discord.js/typings/enums";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";

const commandData: ApplicationCommandData = {
    type: ApplicationCommandTypes.CHAT_INPUT,
    name: "removereferral",
    description: "Removes your submitted referral url"
}

export default class Test extends Command{
    constructor(){
        super(commandData)
        this.name = commandData.name
        this.staffOnly = false
    }
    async run(ctx: CommandContext): Promise<any> {
        let id = ctx.member.id
        let data = await ctx.sql.query(`SELECT * FROM referrals WHERE discord_id='${id}'`).catch(() => null)
        if(!data || !data?.rows?.length) return ctx.error("Unable to find any set up referral links for you")

        await ctx.sql.query(`DELETE FROM referrals WHERE discord_id='${id}'`).catch(() => null)
        
        ctx.log(`${ctx.member.user.tag} (\`${ctx.member.id}\`) removed their referral for ${data!.rows[0].region}: <${decodeURI(data!.rows[0].url)}>`)
        ctx.reply({content: `Your referral url ${decodeURI(data.rows[0].url)} for **${data.rows[0].region}** with **${data.rows[0].uses}** uses has been deleted.`, ephemeral: true})
    }
}