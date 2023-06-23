import { ModalSubmitInteraction } from "discord.js";
import { DiscordBotClient } from "../classes/client";
import { ModalContext } from "../classes/modalContext";
import { Pool } from "pg";

export async function handleModals(interaction: ModalSubmitInteraction, client: DiscordBotClient, database: Pool) {
    const command = await client.modals.getModal(interaction).catch(() => null)
    if(!command) return;
    let context = new ModalContext({interaction, client, database})

    if(command.staff_only && !(Array.isArray(interaction.member?.roles) ? interaction.member?.roles.some(r => client.config.staff_roles?.includes(r)) : interaction.member?.roles.cache.some(r => client.config.staff_roles?.includes(r.id))))
        return await context.error({
            error: "You are not staff"
        })

    return await command.run(context).catch(console.error)
}