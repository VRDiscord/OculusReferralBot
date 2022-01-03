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
        label: "I need a US Referral"
    }, {
        type: 2,
        customId: "referral_non-us",
        style: 1,
        label: "I need a Non-US Referral"
    }]
}]

export default class Test extends Command {
    constructor() {
        super(commandData)
        this.name = commandData.name
        this.staffOnly = true
    }
    async run(ctx: CommandContext): Promise<any> {
        if (ctx.interaction.channel?.type !== "GUILD_TEXT") return ctx.error("You can only use this command in a TextChannel")

        let embed = new MessageEmbed()
            .setColor("AQUA")
            .setTitle("Quest Referrals")
            .setDescription(`You can either add your own referral to be selected from, or request a referral below.`)
            .addFields(
                { name: '__I just got my Quest and want to be referred__', value: 'Select your region below, a new thread will be created with your referral.\n', inline: false },
                { name: '__I have had my Quest for a while and want to be referred__', value: 'If you recently (under 48 hours ago) activated your device without a referral, you may attempt a factory reset. \n You will need to re-download any games or apps and your game data that does not support [cloud saves](https://support.oculus.com/articles/in-vr-experiences/oculus-features/cloud-sync/) will be lost. \nIf you wish to attempt a factory reset, follow [this guide](https://support.oculus.com/articles/fix-a-problem/troubleshoot-headsets-and-accessories/troubleshooting-factory-reset-quest-2/), and before setting it back up grab a referral link by clicking your region below. \n', inline: false },
                { name: '__I want to refer someone__', value: 'Please type /submitreferral below, and select your region and submit your link. \n If you have issues please let us know. \n Referrals are automatically handed out at random when new users request them.', inline: false },
            )

        ctx.reply({ content: "Done", ephemeral: true })
        ctx.interaction.channel.send({ embeds: [embed], components })
    }
}