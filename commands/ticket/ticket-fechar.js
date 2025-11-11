/* commands/ticket/ticket-fechar.js (NOVO) */

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fechar-ticket')
        .setDescription('Fecha o canal de ticket atual.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels), // Só Staff pode usar
    
    async execute(interaction) {
        // Verifica se está em um canal de ticket
        if (!interaction.channel.name.startsWith('ticket-')) {
            return interaction.reply({ 
                content: '❌ Este comando só pode ser usado dentro de um canal de ticket.', 
                ephemeral: true 
            });
        }

        await interaction.reply({ 
            content: `🔒 O canal será fechado e deletado em 5 segundos por ${interaction.user}.` 
        });

        // Deleta o canal depois de 5 segundos
        setTimeout(() => {
            interaction.channel.delete().catch(err => {
                console.error("Não foi possível deletar o canal do ticket:", err);
            });
        }, 5000);
    }
};