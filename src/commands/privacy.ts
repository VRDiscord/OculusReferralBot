import { ApplicationCommandData, MessageEmbed, TextChannel } from "discord.js";
import { ApplicationCommandTypes } from "discord.js/typings/enums";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";

const commandData: ApplicationCommandData = {
    type: ApplicationCommandTypes.CHAT_INPUT,
    name: "privacy",
    description: "Shows information about data storage"
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
            .setTitle(`Privacy Info`)
            .setDescription(`Below you can see the data we store inside the Discord platform and outside the Discord platform.`)
            .addFields(
                { name: 'Data inside Discord', value: 'Inside Discord all actions are logged, this includes the following. \n __Discord ID__ \n  __Submitted URL__ \n __Region Selection__ \n __Times Seen__ \n **Discord Logs will be available on request.** \n' },
                { name: 'Why explain Discord?', value: 'As your submitted information and interactions will be stored within Discord, it is not stored by our bot. \n However we want to make sure you are aware others can see this information if it is in the requested logs.' },
                { name: 'Data hosted Externally', value: 'Please see [here](https://test.com) for the privacy policy of the data hosted by the Bot.' },
                { name: 'Data Removal', value: 'You can remove all information hosted on the bot with /removereferral, or by contacting <@582767483707064330>', },
            )
        ctx.reply({ embeds: [embed], ephemeral: true })
    }
}
