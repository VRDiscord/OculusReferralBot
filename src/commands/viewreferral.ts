import { ApplicationCommandData, MessageEmbed, TextChannel } from "discord.js";
import { ApplicationCommandTypes } from "discord.js/typings/enums";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";

const commandData: ApplicationCommandData = {
    type: ApplicationCommandTypes.CHAT_INPUT,
    name: "viewreferral",
    description: "Shows your submitted referral url"
}

let button = (state: boolean) => [{
    type: 1, 
    components: [{
        type: 2,
        label: `Turn ${state ? "off": "on"} ability to get added for help`,
        custom_id: `${state ? 1 : 0}_toggle_help_request`,
        style: state ? 4 : 3
    }]
}]

export default class Test extends Command {
    constructor() {
        super(commandData)
        this.name = commandData.name
        this.staffOnly = false
        this.description = `This will show your submitted referral, as well as how many times it has been seen.`
    }
    async run(ctx: CommandContext): Promise<any> {
        let id = ctx.member.id
        let data = await ctx.sql.query(`SELECT * FROM referrals WHERE discord_id='${id}'`).catch(() => null)
        if (!data || !data?.rows?.length) return ctx.error("Unable to find any set up referral links for you")

        let embed = new MessageEmbed()
            .setColor("AQUA")
            .setTitle(`Referral ${data.rows[0].region.toUpperCase()}`)
            .setDescription(`**URL** ${decodeURI(data.rows[0].url)}\n**Seen** ${data.rows[0].uses}`)

        if(data.rows[0].accepts_help_request) embed.setDescription(embed.description + `\n**Can get added for help if requested** ${data.rows[0].accepts_help_request}`)

        ctx.reply({ embeds: [embed], ephemeral: true, components: button(!!data.rows[0].accepts_help_request)})
    }
}