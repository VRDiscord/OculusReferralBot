import { MessageEmbed, NewsChannel, TextChannel } from "discord.js";
import { Button } from "../classes/button";
import { ButtonContext } from "../classes/buttonContext";

let button = (state: boolean) => [{
    type: 1, 
    components: [{
        type: 2,
        label: `Turn ${state ? "off": "on"} ability to get added for help`,
        custom_id: `${state ? 1 : 0}_toggle_help_request`,
        style: state ? 4 : 3
    }]
}]

export default class Test extends Button {
    constructor() {
        super()
        this.name = "toggle_help_request"
        this.regex = /[01]_toggle_help_request/
        this.staffOnly = false
    }
    async run(ctx: ButtonContext): Promise<any> {
        let state = !Number(ctx.customId.split("_")[0] ?? "0")
        let data = await ctx.sql.query(`UPDATE referrals SET accepts_help_request=${`${state}`.toUpperCase()} WHERE discord_id='${ctx.interaction.member?.user.id}' RETURNING *`)

            let embed = new MessageEmbed()
            .setColor("AQUA")
            .setTitle(`Referral ${data.rows[0].region.toUpperCase()}`)
            .setDescription(`**URL** ${decodeURI(data.rows[0].url)}\n**Seen** ${data.rows[0].uses}\n**Can get added for help if requested** ${data.rows[0].accepts_help_request}`)

        ctx.update({ embeds: [embed], components: button(!!data.rows[0].accepts_help_request)})
    }
}