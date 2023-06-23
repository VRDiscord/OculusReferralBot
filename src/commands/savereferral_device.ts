import { SlashCommandBuilder, SlashCommandStringOption, SlashCommandSubcommandBuilder } from "discord.js";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";
import { AutocompleteContext } from "../classes/autocompleteContext";

const command_data = new SlashCommandBuilder()
    .setName("savereferral")
    .setDMPermission(false)
    .setDescription(`Save a referral URL into the system`)
    .addSubcommand(
        new SlashCommandSubcommandBuilder()
        .setName("device")
        .setDescription("Referral for a device")
        .addStringOption(
            new SlashCommandStringOption()
            .setName("url")
            .setDescription("The URL to save")
            .setRequired(true)
        )
    )
    .addSubcommand(
        new SlashCommandSubcommandBuilder()
        .setName("game")
        .setDescription("Referral for a game")
        .addStringOption(
            new SlashCommandStringOption()
            .setName("url")
            .setDescription("The URL to save")
            .setRequired(true)
        )
    )


export default class extends Command {
    constructor() {
        super({
            name: "savereferral_device",
            command_data: command_data.toJSON(),
            staff_only: false,
        })
    }

    override async run(ctx: CommandContext): Promise<any> {
        //TODO: add
    }

    override async autocomplete(context: AutocompleteContext): Promise<any> {
        return context.error()
    }
}