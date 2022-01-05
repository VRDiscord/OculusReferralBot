import { ApplicationCommandData, MessageEmbed, TextChannel } from "discord.js";
import { ApplicationCommandTypes } from "discord.js/typings/enums";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";

const commandData: ApplicationCommandData = {
    type: ApplicationCommandTypes.CHAT_INPUT,
    name: "removereferral",
    description: "Removes your submitted referral url"
}

export default class Test extends Command {
    constructor() {
        super(commandData)
        this.name = commandData.name
        this.staffOnly = false
        this.description = `This will allow you to remove your Oculus/Meta referral link.
It will also tell you how many times it has been seen.`
    }
    async run(ctx: CommandContext): Promise<any> {
        let id = ctx.member.id
        let data = await ctx.sql.query(`SELECT * FROM referrals WHERE discord_id='${id}'`).catch(() => null)
        if (!data || !data?.rows?.length) return ctx.error("Unable to find any set up referral links for you")

        await ctx.sql.query(`DELETE FROM referrals WHERE discord_id='${id}'`).catch(() => null)

        let log = new MessageEmbed()
            .setTitle(`Referral removed`)
            .setColor("#FEE75C")
            .setDescription(`**User** <@${ctx.interaction.member?.user.id}> (${ctx.member.user.tag} \`${ctx.interaction.member?.user.id}\`)`)
            .addFields([
                { name: `**URL**`, value: decodeURI(data.rows[0].url) },
                { name: `**Region**`, value: data.rows[0].region, inline: true },
                { name: `**Uses**`, value: data.rows[0].uses, inline: true },
            ])
        ctx.log(log)
        ctx.reply({ content: `Your referral url ${decodeURI(data.rows[0].url)} for **${data.rows[0].region}** with **${data.rows[0].uses}** times being seen has been deleted.`, ephemeral: true })
    }
}