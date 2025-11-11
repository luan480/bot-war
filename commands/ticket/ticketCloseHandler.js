/* commands/ticket/ticketCloseHandler.js (NOVO) */

const { PermissionsBitField } = require('discord.js');

module.exports = async (interaction) => {
    // Verifica se o usuário tem permissão de 'Gerenciar Canais' (Staff)
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
        return interaction.reply({
            content: '❌ Apenas membros da Staff podem fechar o ticket usando o botão. Por favor, peça para um Staff.',
            ephemeral: true
        });
    }

    // Se for Staff, fecha o ticket
    await interaction.reply({ 
        content: `🔒 O canal será fechado e deletado em 5 segundos por ${interaction.user}.` 
    });

    setTimeout(() => {
        interaction.channel.delete().catch(err => {
            console.error("Não foi possível deletar o canal do ticket:", err);
        });
    }, 5000);
};