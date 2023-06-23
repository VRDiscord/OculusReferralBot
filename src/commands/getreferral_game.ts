import { SlashCommandBuilder, SlashCommandStringOption, SlashCommandSubcommandBuilder } from "discord.js";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";
import { AutocompleteContext } from "../classes/autocompleteContext";

const command_data = new SlashCommandBuilder()
    .setName("getreferral")
    .setDMPermission(false)
    .setDescription(`Get a referral URL`)
    .addSubcommand(
        new SlashCommandSubcommandBuilder()
        .setName("device")
        .setDescription("Referral for a device")
        /*.addStringOption(
            new SlashCommandStringOption()
            .setName("url")
            .setDescription("The URL to save")
            .setRequired(true)
        )*/
    )
    .addSubcommand(
        new SlashCommandSubcommandBuilder()
        .setName("game")
        .setDescription("Referral for a game")
        .addStringOption(
            new SlashCommandStringOption()
            .setName("game")
            .setDescription("The game to get a referral for")
            .setAutocomplete(true)
            .setRequired(true)
        )
    )


export default class extends Command {
    constructor() {
        super({
            name: "getreferral_game",
            command_data: command_data.toJSON(),
            staff_only: false,
        })
    }

    override async run(ctx: CommandContext): Promise<any> {
        const game_id = ctx.interaction.options.getString("game", true)
        const query = await ctx.database.query("SELECT * FROM games WHERE position($1 in LOWER(name)) > 0 OR game_id=$1", [game_id]).catch(console.error)
        if(!query || (query?.rowCount || 0) !== 1) return ctx.error({error: "Unable to find one specific game, input is ambiguous or game does not exist."})

        const game = query!.rows![0]
        console.log(game.game_id)
        const referrals = await ctx.database.query("SELECT * FROM game_referrals WHERE game_id=$1 AND uses = (SELECT MIN(uses) FROM game_referrals)", [game.game_id]).catch(console.error)
        if(!referrals?.rowCount) return ctx.error({error: "There are no referrals for that game"})
        
        const randoms = ctx.client.randomizeArray(referrals.rows)

        let referral

        while(randoms.length) {
            referral = randoms.splice(0, 1)[0]
            const exists = await ctx.client.referralExists(`https://www.oculus.com/appreferrals/${referral.user_id}/${referral.game_id}/`)
            if(!exists) {
                await ctx.database.query("DELETE FROM game_referrals WHERE game_id=$1 and user_id=$2 LIMIT 1", [referral.game_id, referral.user_id]).catch(console.error)
            } else break;
        }

        await ctx.database.query("UPDATE game_referrals SET uses = game_referrals.uses + 1 WHERE game_id=$1 AND user_id=$2", [referral.game_id, referral.user_id]).catch(console.error)

        return ctx.interaction.reply({content: `Here is your referral link for ${game.name}:\nhttps://www.oculus.com/appreferrals/${referral.user_id}/${referral.game_id}/`, ephemeral: true})
    }

    override async autocomplete(context: AutocompleteContext): Promise<any> {
        const focused = context.interaction.options.getFocused(true)
        switch(focused.name) {
            case "game": {
                console.log(focused.value)
                const games = await context.database.query("SELECT * FROM games WHERE position($1 in LOWER(name)) > 0 OR game_id=$1", [focused.value]).then(res => res.rows).catch(console.error)

                return context.interaction.respond(games?.map(g => ({name: `${g.platform.toUpperCase()} | ${g.name}`, value: g.game_id})).slice(0, 25) || [])
            }
        }
    }
}