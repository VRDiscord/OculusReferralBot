import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";
import { AutocompleteContext } from "../classes/autocompleteContext";


export default class extends Command {
    constructor() {
        super({
            name: "savereferral_device",
            staff_only: false,
        })
    }

    override async run(ctx: CommandContext): Promise<any> {
        const link = ctx.interaction.options.getString("url", true)
        if(!ctx.client.regexes.DEVICE_LINK.test(link)) return ctx.error({error: "That is not a valid device referral link"})
        
        const [username] = link.split("/").slice(5, 6)
        if(!username) return ctx.error({error: "Invalid URL"})
        
        const referral = await ctx.database.query("SELECT * FROM device_referrals WHERE user_id=$1", [username]).then(res => res.rows[0]).catch(console.error)
        if(referral) return ctx.interaction.reply({ephemeral: true, content: `This referral has already been added <t:${Math.round(new Date(referral.added_at).getTime()/1000)}:R>`})
        await ctx.interaction.deferReply({ephemeral: true})
        
        const exists = await ctx.client.referralExists(link)
        if(!exists) return ctx.error({error: "This referral does not exist"})

        const res = await ctx.database.query("INSERT INTO device_referrals (user_id, discord_user_id) VALUES ($1, $2)", [username, ctx.interaction.user.id]).catch(console.error)
        if(!res?.rowCount) return ctx.error({error: "Unable to save referral"})

        ctx.interaction.editReply({
            content: `Device referral saved`
        })
    }

    override async autocomplete(context: AutocompleteContext): Promise<any> {
        return context.error()
    }
}