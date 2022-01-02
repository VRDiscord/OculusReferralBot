import { ApplicationCommand, ApplicationCommandData } from "discord.js";
import { ButtonContext } from "./buttonContext";
import { OculusReferralClient } from "./client";
import { CommandContext } from "./commandContext";

export class Button{
    name: string
    regex: RegExp
    staffOnly: boolean
    client?: OculusReferralClient
    constructor(){
        this.name = ""
        this.regex = /./
        this.staffOnly = false
        this.client = undefined
    }

    async run(_ctx: ButtonContext): Promise<any> {

    }
}