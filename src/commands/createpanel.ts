import { MessageEmbed } from "discord.js";
import { ApplicationCommandTypes } from "discord.js/typings/enums";
import { Command } from "../classes/command";
import { CommandContext } from "../classes/commandContext";

const commandData = {
    type: ApplicationCommandTypes.CHAT_INPUT,
    name: "createpanel",
    description: "Creates a panel where members can click to get referral links"
}

let components = [{
    type: 1, 
    components: [{
        type: 2, 
        customId: "referral_us", 
        style: 1, 
        label: "US"
    },{
        type: 2, 
        customId: "referral_non-us", 
        style: 1,
        label: "Non-US"
    }]
}]

export default class Test extends Command{
    constructor(){
        super(commandData)
        this.name = commandData.name
        this.staffOnly = true
    }
    async run(ctx: CommandContext): Promise<any> {
        if(ctx.interaction.channel?.type !== "GUILD_TEXT") return ctx.error("You can only use this command in a TextChannel")

        let embed = new MessageEmbed()
        .setColor("AQUA")
        .setDescription(`To get a referral URL for the Oculus store click the button below\nrepresenting your region.`)
        
        ctx.reply({content: "Done", ephemeral: true})
        ctx.interaction.channel.send({embeds: [embed], components})
    }
}