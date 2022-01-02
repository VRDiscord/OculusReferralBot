import { ApplicationCommand, ApplicationCommandData } from "discord.js";
import { OculusReferralClient } from "./client";
import { CommandContext } from "./commandContext";

export class Command{
    name: string
    staffOnly: boolean
    command: ApplicationCommandData
    client?: OculusReferralClient
    constructor(command: ApplicationCommandData){
        this.name = ""
        this.staffOnly = false
        this.command = command
        this.client = undefined
    }

    async run(_ctx: CommandContext): Promise<any> {

    }
}