/* events/interactionCreate.js */
const { Events } = require('discord.js');

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction, client) { // O 'client' é passado como último argumento
		
		// --- Handler de Comandos (Slash Commands) ---
		if (interaction.isCommand()) {
			const command = client.commands.get(interaction.commandName);
            
			if (!command) {
                console.error(`[AVISO] Comando /${interaction.commandName} não encontrado.`);
                return;
            }

			try {
				await command.execute(interaction);
			} catch (err) {
				console.error(`[ERRO NO COMANDO /${interaction.commandName}]`, err);
				try {
					const errorMessage = `❌ **Erro Crítico!** Ocorreu um problema:\n\n\`\`\`${err.message}\`\`\``;
					if (interaction.replied || interaction.deferred) {
						await interaction.followUp({ content: errorMessage, ephemeral: true });
					} else {
						await interaction.reply({ content: errorMessage, ephemeral: true });
					}
				} catch (catchErr) {
					console.error("[ERRO NO CATCH] Não foi possível responder à interação que falhou:", catchErr.message);
				}
			}
			return; // Importante
		}

		// --- Handler de Botões ---
		if (interaction.isButton()) {
            // Usamos o objeto 'buttonHandlers' que definimos no clientReady
            const { buttonHandlers } = client; 
            
			try {
				if (interaction.customId.startsWith('iniciar_') || 
					interaction.customId.startsWith('ver_') || 
					interaction.customId.startsWith('edit_') ||
					interaction.customId.startsWith('confirmar_') ||
					interaction.customId.startsWith('cancelar_')) 
				{
                    // Chama o handler da LIGA
					await buttonHandlers.liga(client, interaction);
				}
				else if (interaction.customId.startsWith('carreira_status_')) 
				{
                    // Chama o handler da CARREIRA
					await buttonHandlers.carreira(interaction);
				}
				else if (interaction.customId === 'ticket_abrir_denuncia') 
				{
                    // Chama o handler de ABRIR TICKET
					await buttonHandlers.ticketOpen(interaction);
				}
				else if (interaction.customId === 'ticket_fechar') 
				{
                    // Chama o handler de FECHAR TICKET
					await buttonHandlers.ticketClose(interaction);
				}
			} catch (err) {
				console.error(`Erro no handler de botão (${interaction.customId}):`, err);
				try {
					if (!interaction.replied && !interaction.deferred) {
						await interaction.reply({ content: '❌ Ocorreu um erro ao usar este botão.', ephemeral: true });
					} else {
						await interaction.followUp({ content: '❌ Ocorreu um erro ao usar este botão.', ephemeral: true });
					}
				} catch (catchErr) {
					console.error("[ERRO NO CATCH] Não foi possível responder ao botão que falhou:", catchErr.message);
				}
			}
            return; // Importante
		}
	},
};