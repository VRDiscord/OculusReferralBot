import { NewsChannel, TextChannel } from "discord.js";
import { Button } from "../classes/button";
import { ButtonContext } from "../classes/buttonContext";


export default class Test extends Button{
    constructor(){
        super()
        this.name = "referral_done"
        this.regex = /referral_done/
        this.staffOnly = false
    }
    async run(ctx: ButtonContext): Promise<any> {
        if(!ctx.interaction.channel?.isThread()) return ctx.error("You can only use this button in threads")
        ctx.deferUpdate({})
        let channel = ctx.interaction.channel
        channel.delete().catch(() => channel.setArchived(true))
    }
}