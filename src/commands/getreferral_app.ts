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
        .setName("app")
        .setDescription("Referral for a app")
        .addStringOption(
            new SlashCommandStringOption()
            .setName("app")
            .setDescription("The app to get a referral for")
            .setAutocomplete(true)
            .setRequired(true)
        )
    )
    .addSubcommand(
        new SlashCommandSubcommandBuilder()
        .setName("device")
        .setDescription("Referral for a device")
    )


export default class extends Command {
    constructor() {
        super({
            name: "getreferral_app",
            command_data: command_data.toJSON(),
            staff_only: false,
        })
    }

    override async run(ctx: CommandContext): Promise<any> {
        const app_id = ctx.interaction.options.getString("app", true)
        const query = await ctx.database.query("SELECT * FROM apps WHERE position($1 in LOWER(name)) > 0 OR app_id=$1", [app_id]).catch(console.error)
        if(!query || (query?.rowCount || 0) !== 1) return ctx.error({error: "Unable to find one specific app, input is ambiguous or app does not exist."})

        const app = query!.rows![0]
        //const referrals = await ctx.database.query("SELECT * FROM app_referrals WHERE app_id=$1 AND uses = (SELECT MIN(uses) FROM app_referrals WHERE app_id=$1)", [app.app_id]).catch(console.error)
        const referrals = await ctx.database.query("SELECT * FROM app_referrals WHERE app_id=$1 ORDER BY random() LIMIT 100", [app.app_id]).catch(console.error)
        if(!referrals?.rowCount) return ctx.error({error: "There are no referrals for that app"})
        
        const randoms = ctx.client.randomizeArray(referrals.rows)

        let referral

        while(randoms.length) {
            referral = randoms.splice(0, 1)[0]
            const exists = await ctx.client.referralExists(`https://www.oculus.com/appreferrals/${referral.user_id}/${referral.app_id}/`)
            if(!exists) {
                await ctx.database.query("DELETE FROM app_referrals WHERE app_id=$1 and user_id=$2 LIMIT 1", [referral.app_id, referral.user_id]).catch(console.error)
            } else break;
        }

        if(!referral?.user_id) return ctx.error({error: "Unable to find a valid referral"})

        await ctx.database.query("UPDATE app_referrals SET uses = app_referrals.uses + 1 WHERE app_id=$1 AND user_id=$2", [referral.app_id, referral.user_id]).catch(console.error)
        return ctx.interaction.reply({content: `Here is your referral link for ${app.name}:\nhttps://www.oculus.com/appreferrals/${referral.user_id}/${referral.app_id}/`, ephemeral: true})
    }

    override async autocomplete(context: AutocompleteContext): Promise<any> {
        const focused = context.interaction.options.getFocused(true)
        switch(focused.name) {
            case "app": {
                const apps = await context.database.query("SELECT * FROM apps WHERE position($1 in LOWER(name)) > 0 OR app_id=$1", [focused.value]).then(res => res.rows).catch(console.error)

                return context.interaction.respond(apps?.map(g => ({name: `${g.platform[0].toUpperCase()}${g.platform.slice(1).toLowerCase()} | ${g.name}`, value: g.app_id})).slice(0, 25) || [])
            }
        }
    }
}