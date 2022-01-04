import { ApplicationCommandData, MessageEmbed, TextChannel } from "discord.js";
import { ApplicationCommandTypes } from "discord.js/typings/enums";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";

const commandData: ApplicationCommandData = {
    type: ApplicationCommandTypes.CHAT_INPUT,
    name: "help",
    description: "Shows all command information"
}

export default class Test extends Command {
    constructor() {
        super(commandData)
        this.name = commandData.name
        this.staffOnly = false
        this.description = `This shows the help command explaining this.`
    }
    async run(ctx: CommandContext): Promise<any> {

        let fields = ctx.client.commands
        .filter(c => !!c.description)
        .map(c => ({
            name: c.name,
            value: c.description!
        }))

        fields.push({
            name: "How do I request a referral?",
            value: "If you are a new user __needing to be referred__, please check the <#927288276673523782> channel for more information."
        })

        let embed = new MessageEmbed()
            .setColor("AQUA")
            .setTitle(`Command Help`)
            .setDescription(`Below you can see a list of all commands and their descriptions.`)
            .addFields(fields)
        ctx.reply({ embeds: [embed], ephemeral: true })
    }
}
