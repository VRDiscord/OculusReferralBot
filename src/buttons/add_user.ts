import { MessageActionRow, NewsChannel, TextChannel } from "discord.js";
import { Button } from "../classes/button";
import { ButtonContext } from "../classes/buttonContext";


export default class Test extends Button {
    constructor() {
        super()
        this.name = "add_user"
        this.regex = /add_user_[0-9]{15,21}/
        this.staffOnly = false
    }
    async run(ctx: ButtonContext): Promise<any> {
        if (!ctx.interaction.channel?.isThread()) return null
        let id = ctx.customId.split("_")[2] ?? ctx.interaction.member?.user.id

        let res = await ctx.interaction.channel.members.add(id).catch(() => null)
        if (!res) return ctx.error("Unable to add owner of the URL")

        let buttons = ctx.interaction.message.components! as MessageActionRow[]
        buttons[0].components.splice(2, 1)

        ctx.update({ components: buttons })
        let payload = {
            content: `The owner of the referral <@${id}> has been added`
        };
        //using this janky solution since discord.js doesn't allow you to send followups after replying for no reason
        (ctx.client as any).api.webhooks(ctx.interaction.applicationId, ctx.interaction.token).post({ data: payload })
    }
}