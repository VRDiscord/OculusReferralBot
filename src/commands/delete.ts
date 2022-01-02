import { ApplicationCommandData, MessageEmbed, TextChannel } from "discord.js";
import { ApplicationCommandTypes } from "discord.js/typings/enums";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";

const commandData: ApplicationCommandData = {
    type: ApplicationCommandTypes.CHAT_INPUT,
    name: "delete",
    description: "Force deletes a referral URL",
    options: [{
        type: "STRING",
        name: "url",
        description: "The referral URL to delete",
        required: true
    }]
}

export default class Test extends Command{
    constructor(){
        super(commandData)
        this.name = commandData.name
        this.staffOnly = true
    }
    async run(ctx: CommandContext): Promise<any> {
        let data = await ctx.sql.query(`SELECT * FROM referrals WHERE url=$1`, [encodeURI(ctx.arguments.get("url")?.value?.toString() ?? "a banana")]).catch(() => null)
        if(!data || !data?.rows?.length) return ctx.error("Unable to find that referral")
        
        await ctx.sql.query(`DELETE FROM referrals WHERE url=$1`, [encodeURI(ctx.arguments.get("url")?.value?.toString() ?? "a banana")]).catch(() => null)
        
        ctx.log(`${ctx.member.user.tag} (\`${ctx.member.id}\`) (STAFF) removed a referral for ${data!.rows[0].region}: <${decodeURI(data!.rows[0].url)}>`)
        ctx.reply({content: `The referral url has been removed`, ephemeral: true})
    }
}