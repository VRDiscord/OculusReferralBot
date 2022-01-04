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
    }
    async run(ctx: CommandContext): Promise<any> {

        let embed = new MessageEmbed()
            .setColor("AQUA")
            .setTitle(`Command Help`)
            .setDescription(`Below you can see a list of all commands and their descriptions.`)
            .addFields(
                { name: '/removereferral', value: 'This will allow you to remove your Oculus/Meta referral link. \n It will also tell you how many times it has been seen.' },
                { name: '/submitreferral', value: 'This will allow you to submit your Oculus/Meta referral link. \n When typing this command, you need to select US or Non-US and then enter your link in the "referral-url" section. \n Once you submit this, it is immediately put into the randomized pool.' },
                { name: '/viewreferral', value: 'This will show your submitted referral, as well as how many times it has been seen.' },
                { name: '/help', value: 'This shows the help command explaining this.', },
                { name: 'How do I request a referral?', value: 'If you are a new user __needing to be referred__, please check the <#927288276673523782> channel for more information.', },
            )
        ctx.reply({ embeds: [embed], ephemeral: true })
    }
}
