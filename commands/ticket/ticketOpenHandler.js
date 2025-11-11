/* commands/ticket/ticketOpenHandler.js (CORRIGIDO) */

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField } = require('discord.js');
// [CORREÇÃO AQUI] Corrigido o erro de digitação
const path = require('path'); 
// O caminho para o helpers.js
const { safeReadJson } = require('../liga/utils/helpers.js');

// IDs da Staff (do seu server_data.json)
const ID_CARGO_ADM = '865915891399786518';
const ID_CARGO_MOD = '849697636574560296';

module.exports = async (interaction) => {
    
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const member = interaction.member;
    const categoriaSuporte = '875794734789050408';
    const channelName = `ticket-${member.user.username.substring(0, 10)}`;

    try {
        const ticketChannel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: categoriaSuporte,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
                {
                    id: member.id,
                    allow: [
                        PermissionsBitField.Flags.ViewChannel,
                        PermissionsBitField.Flags.SendMessages,
                        PermissionsBitField.Flags.ReadMessageHistory,
                        PermissionsBitField.Flags.AttachFiles
                    ],
                },
                {
                    id: ID_CARGO_ADM,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                },
                {
                    id: ID_CARGO_MOD,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                },
                {
                    id: interaction.client.user.id,
                    allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages],
                }
            ],
        });

        const embed = new EmbedBuilder()
            .setTitle(`Bem-vindo, ${member.displayName}!`)
            .setDescription('Por favor, descreva sua denúncia ou dúvida em detalhes. Um membro da Staff (<@&865915891399786518> ou <@&849697636574560296>) virá ajudá-lo em breve.\n\nPara fechar este ticket, use o comando `/fechar-ticket`.')
            .setColor('Green');
        
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_fechar') 
                .setLabel('Fechar Ticket')
                .setEmoji('🔒')
                .setStyle(ButtonStyle.Danger)
        );

        await ticketChannel.send({
            content: `${member} <@&865915891399786518> <@&849697636574560296>`,
            embeds: [embed],
            components: [row]
        });

        await interaction.editReply({
            content: `✅ Seu ticket foi aberto com sucesso no canal ${ticketChannel}!`,
            ephemeral: true
        });

    } catch (err) {
        console.error("Erro ao criar ticket:", err);
        await interaction.editReply({
            content: '❌ Ocorreu um erro ao criar seu ticket. Por favor, contate um admin diretamente.',
            ephemeral: true
        });
    }
};