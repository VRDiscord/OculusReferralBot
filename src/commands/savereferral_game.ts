import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";
import { AutocompleteContext } from "../classes/autocompleteContext";


export default class extends Command {
    constructor() {
        super({
            name: "savereferral_game",
            staff_only: false,
        })
    }

    override async run(ctx: CommandContext): Promise<any> {
        const link = ctx.interaction.options.getString("url", true)
        if(!ctx.client.regexes.APP_LINK.test(link)) return ctx.error({error: "That is not a valid game referral link"})

        const [username, game_id] = link.split("/").slice(4, 6)
        if(!game_id || !username) return ctx.error({error: "Invalid URL"})

        const referral = await ctx.database.query("SELECT * FROM game_referrals WHERE user_id=$1 AND game_id=$2", [username, game_id]).then(res => res.rows[0]).catch(console.error)
        if(referral) return ctx.interaction.reply({ephemeral: true, content: `This referral has already been added <t:${Math.round(new Date(referral.added_at).getTime()/1000)}:R>`})

        const game = await ctx.client.fetchGame(game_id, ctx.database)
        if(!game) return ctx.error({error: "Unable to find referred game"})
        const exists = await ctx.client.referralExists(link)
        if(!exists) return ctx.error({error: "This referral does not exist"})

        const res = await ctx.database.query("INSERT INTO game_referrals (game_id, user_id, discord_user_id) VALUES ($1, $2, $3)", [game_id, username, ctx.interaction.user.id]).catch(console.error)
        if(!res?.rowCount) return ctx.error({error: "Unable to save referral"})

        ctx.interaction.reply({
            content: `App referral for game ${game?.name} saved`,
            ephemeral: true
        })
    }

    override async autocomplete(context: AutocompleteContext): Promise<any> {
        return context.error()
    }
}