import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";


export default class extends Command {
    constructor() {
        super({
            name: "getreferral_device",
            staff_only: false,
        })
    }

    override async run(ctx: CommandContext): Promise<any> {
        //const referrals = await ctx.database.query("SELECT * FROM device_referrals WHERE uses = (SELECT MIN(uses) FROM device_referrals)").catch(console.error)
        const referrals = await ctx.database.query("SELECT * FROM device_referrals ORDER BY random() LIMIT 100").catch(console.error)
        if(!referrals?.rowCount) return ctx.error({error: "There are no referrals"})
        
        const randoms = ctx.client.randomizeArray(referrals.rows)

        let referral
        while(randoms.length) {
            referral = randoms.splice(0, 1)[0]
            const exists = await ctx.client.referralExists(`https://www.oculus.com/referrals/link/${referral.user_id}/`)
            if(!exists) {
                await ctx.database.query("DELETE FROM device_referrals WHERE user_id=$1 LIMIT 1", [referral.user_id]).catch(console.error)
            } else break;
        }

        if(!referral?.user_id) return ctx.error({error: "Unable to find a valid referral"})

        await ctx.database.query("UPDATE device_referrals SET uses = device_referrals.uses + 1 WHERE user_id=$1", [referral.user_id]).catch(console.error)

        return ctx.interaction.reply({content: `Here is your device referral link:\nhttps://www.oculus.com/referrals/link/${referral.user_id}/`, ephemeral: true})
    }
}