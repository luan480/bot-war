/* ========================================================================
   ARQUIVO: commands/adm/criar-embed.js
   ======================================================================== */

// [MUDANÇA] Importar MessageFlags
const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('criar-embed')
        .setDescription('Abre o criador de embeds supremo (Todas as funções).')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const draftEmbed = new EmbedBuilder()
            .setTitle('Título do Embed')
            .setDescription('Este é o rascunho. Use os botões abaixo para editar TUDO.')
            .setColor('Random');

        const row1 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('emb_main').setLabel('📝 Geral').setEmoji('🖊️').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('emb_content').setLabel('💬 Mensagem').setEmoji('🗣️').setStyle(ButtonStyle.Secondary), 
            new ButtonBuilder().setCustomId('emb_color').setLabel('🎨 Cor').setStyle(ButtonStyle.Secondary)
        );

        const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('emb_author').setLabel('👤 Autor').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('emb_footer').setLabel('🔻 Rodapé').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('emb_timestamp').setLabel('⏰ Data/Hora').setStyle(ButtonStyle.Secondary)
        );

        const row3 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('emb_image').setLabel('🖼️ Imagem Grande').setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId('emb_thumb').setLabel('🖼️ Thumbnail').setStyle(ButtonStyle.Secondary)
        );

        const row4 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('emb_add_field').setLabel('➕ Add Campo').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('emb_rem_field').setLabel('➖ Remover Último').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('emb_clear_all').setLabel('🗑️ Limpar Tudo').setStyle(ButtonStyle.Danger)
        );

        const row5 = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('emb_json').setLabel('💾 Importar JSON').setEmoji('📥').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('emb_send').setLabel('✅ ENVIAR').setStyle(ButtonStyle.Success)
        );

        await interaction.reply({
            content: '**Painel de Criação Supremo**\n*(O texto que aparecer aqui será a mensagem fora do embed)*',
            embeds: [draftEmbed],
            components: [row1, row2, row3, row4, row5],
            // [MUDANÇA] flags em vez de ephemeral
            flags: MessageFlags.Ephemeral
        });
    }
};