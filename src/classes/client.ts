import { Client, ClientOptions, Collection } from "discord.js";
import { Button } from "./button";
import { Command } from "./command";

export class OculusReferralClient extends Client{
    commands: Collection<string, Command>
    buttons: Collection<string, Button>
    constructor(options: ClientOptions){
        super(options)
        this.commands = new Collection()
        this.buttons = new Collection()
    }
}