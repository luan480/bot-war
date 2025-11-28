/* ========================================================================
   ARQUIVO: commands/adm/embedSystem.js
   ======================================================================== */

// [MUDANÇA] Importar MessageFlags
const { 
    EmbedBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, 
    ChannelSelectMenuBuilder, ChannelType, ButtonBuilder, ButtonStyle, MessageFlags 
} = require('discord.js');

module.exports = async (interaction, client) => {
    const customId = interaction.customId;
    const oldEmbed = interaction.message.embeds[0];
    const newEmbed = new EmbedBuilder(oldEmbed.toJSON());
    const currentContent = interaction.message.content.replace('**Painel de Criação Supremo**\n', '').replace('*(O texto que aparecer aqui será a mensagem fora do embed)*', '').trim();

    if (interaction.isChannelSelectMenu() && customId === 'emb_sel_channel') {
        const targetChannel = interaction.channels.first();
        if (!targetChannel) return;

        const finalEmbed = interaction.message.embeds[0];
        const finalContent = interaction.message.content.replace('📢 **Selecione o canal de destino:**\n\nConteúdo da Mensagem: ', '').trim();
        const contentToSend = finalContent === '*(Vazio)*' ? '' : finalContent;

        try {
            await targetChannel.send({ content: contentToSend, embeds: [finalEmbed] });
            await interaction.update({ content: `✅ Enviado com sucesso para ${targetChannel}!`, components: [] });
        } catch (err) {
            // [MUDANÇA] flags
            await interaction.reply({ content: `❌ Erro: ${err.message}`, flags: MessageFlags.Ephemeral });
        }
        return;
    }

    if (customId === 'emb_cancel') {
        return interaction.update({ content: 'Edição cancelada. Use `/criar-embed` novamente para recomeçar.', components: [], embeds: [] });
    }

    if (customId === 'emb_send') {
        const row = new ActionRowBuilder().addComponents(
            new ChannelSelectMenuBuilder().setCustomId('emb_sel_channel').setPlaceholder('Escolha o canal...').setChannelTypes(ChannelType.GuildText)
        );
        const contentDisplay = currentContent || '*(Vazio)*';
        return interaction.reply({
            content: `📢 **Selecione o canal de destino:**\n\nConteúdo da Mensagem: ${contentDisplay}`,
            embeds: [newEmbed], 
            components: [row],
            // [MUDANÇA] flags
            flags: MessageFlags.Ephemeral
        });
    }

    if (customId === 'emb_timestamp') {
        if (newEmbed.data.timestamp) { newEmbed.setTimestamp(null); } else { newEmbed.setTimestamp(); }
        return interaction.update({ embeds: [newEmbed] });
    }

    if (customId === 'emb_rem_field') {
        const currentFields = newEmbed.data.fields || [];
        if (currentFields.length > 0) { currentFields.pop(); newEmbed.setFields(currentFields); }
        return interaction.update({ embeds: [newEmbed] });
    }

    if (customId === 'emb_clear_all') {
        const blankEmbed = new EmbedBuilder().setDescription('Embed Limpo.');
        return interaction.update({ embeds: [blankEmbed], content: '**Painel de Criação Supremo**' });
    }

    if (customId === 'emb_main') {
        const modal = new ModalBuilder().setCustomId('mdl_main').setTitle('Geral');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('i_title').setLabel('Título').setStyle(TextInputStyle.Short).setRequired(false).setValue(oldEmbed.title || '')),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('i_desc').setLabel('Descrição').setStyle(TextInputStyle.Paragraph).setRequired(false).setValue(oldEmbed.description || '')),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('i_url').setLabel('URL do Título (Link)').setStyle(TextInputStyle.Short).setRequired(false).setValue(oldEmbed.url || ''))
        );
        return interaction.showModal(modal);
    }

    if (customId === 'emb_content') {
        const modal = new ModalBuilder().setCustomId('mdl_content').setTitle('Mensagem do Bot');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('i_content').setLabel('Texto fora do embed (@everyone aqui)').setStyle(TextInputStyle.Paragraph).setRequired(false).setValue(currentContent))
        );
        return interaction.showModal(modal);
    }

    if (customId === 'emb_author') {
        const modal = new ModalBuilder().setCustomId('mdl_author').setTitle('Autor');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('i_author_name').setLabel('Nome').setStyle(TextInputStyle.Short).setRequired(false).setValue(oldEmbed.author?.name || '')),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('i_author_icon').setLabel('Ícone URL').setStyle(TextInputStyle.Short).setRequired(false).setValue(oldEmbed.author?.icon_url || '')),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('i_author_url').setLabel('Link do Autor').setStyle(TextInputStyle.Short).setRequired(false).setValue(oldEmbed.author?.url || ''))
        );
        return interaction.showModal(modal);
    }

    if (customId === 'emb_footer') {
        const modal = new ModalBuilder().setCustomId('mdl_footer').setTitle('Rodapé');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('i_footer_text').setLabel('Texto').setStyle(TextInputStyle.Short).setRequired(false).setValue(oldEmbed.footer?.text || '')),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('i_footer_icon').setLabel('Ícone URL').setStyle(TextInputStyle.Short).setRequired(false).setValue(oldEmbed.footer?.icon_url || ''))
        );
        return interaction.showModal(modal);
    }

    if (customId === 'emb_image') {
        const modal = new ModalBuilder().setCustomId('mdl_image').setTitle('Imagem Grande');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('i_image_url').setLabel('URL da Imagem').setStyle(TextInputStyle.Short).setRequired(false).setValue(oldEmbed.image?.url || ''))
        );
        return interaction.showModal(modal);
    }

    if (customId === 'emb_thumb') {
        const modal = new ModalBuilder().setCustomId('mdl_thumb').setTitle('Thumbnail (Imagem Pequena)');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('i_thumb_url').setLabel('URL da Thumbnail').setStyle(TextInputStyle.Short).setRequired(false).setValue(oldEmbed.thumbnail?.url || ''))
        );
        return interaction.showModal(modal);
    }

    if (customId === 'emb_color') {
        const modal = new ModalBuilder().setCustomId('mdl_color').setTitle('Cor');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('i_color_hex').setLabel('Hex (#FF0000) ou Nome (Red)').setStyle(TextInputStyle.Short).setRequired(true))
        );
        return interaction.showModal(modal);
    }

    if (customId === 'emb_add_field') {
        const modal = new ModalBuilder().setCustomId('mdl_field').setTitle('Novo Campo');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('i_field_name').setLabel('Título do Campo').setStyle(TextInputStyle.Short).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('i_field_val').setLabel('Texto').setStyle(TextInputStyle.Paragraph).setRequired(true)),
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('i_field_inline').setLabel('Inline? (s/n)').setStyle(TextInputStyle.Short).setRequired(false))
        );
        return interaction.showModal(modal);
    }

    if (customId === 'emb_json') {
        const modal = new ModalBuilder().setCustomId('mdl_json').setTitle('Importar JSON');
        modal.addComponents(
            new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('i_json_data').setLabel('Cole o JSON aqui').setStyle(TextInputStyle.Paragraph).setRequired(true))
        );
        return interaction.showModal(modal);
    }

    if (interaction.isModalSubmit()) {
        if (customId === 'mdl_main') {
            const t = interaction.fields.getTextInputValue('i_title'); const d = interaction.fields.getTextInputValue('i_desc'); const u = interaction.fields.getTextInputValue('i_url');
            if (t) newEmbed.setTitle(t); else newEmbed.setTitle(null);
            if (d) newEmbed.setDescription(d); else newEmbed.setDescription(null);
            if (u) newEmbed.setURL(u); else newEmbed.setURL(null);
        }
        if (customId === 'mdl_content') {
            const content = interaction.fields.getTextInputValue('i_content');
            const display = content ? `**Painel de Criação Supremo**\n${content}` : '**Painel de Criação Supremo**\n*(O texto que aparecer aqui será a mensagem fora do embed)*';
            return interaction.update({ content: display, embeds: [newEmbed] });
        }
        if (customId === 'mdl_author') {
            const name = interaction.fields.getTextInputValue('i_author_name'); const icon = interaction.fields.getTextInputValue('i_author_icon'); const url = interaction.fields.getTextInputValue('i_author_url');
            if (name) { newEmbed.setAuthor({ name: name, iconURL: icon || null, url: url || null }); } else { newEmbed.setAuthor(null); }
        }
        if (customId === 'mdl_footer') {
            const text = interaction.fields.getTextInputValue('i_footer_text'); const icon = interaction.fields.getTextInputValue('i_footer_icon');
            if (text) { newEmbed.setFooter({ text: text, iconURL: icon || null }); } else { newEmbed.setFooter(null); }
        }
        if (customId === 'mdl_image') { newEmbed.setImage(interaction.fields.getTextInputValue('i_image_url') || null); }
        if (customId === 'mdl_thumb') { newEmbed.setThumbnail(interaction.fields.getTextInputValue('i_thumb_url') || null); }
        if (customId === 'mdl_color') { try { newEmbed.setColor(interaction.fields.getTextInputValue('i_color_hex')); } catch (e) {} }
        if (customId === 'mdl_field') {
            const name = interaction.fields.getTextInputValue('i_field_name'); const val = interaction.fields.getTextInputValue('i_field_val'); const inline = interaction.fields.getTextInputValue('i_field_inline').toLowerCase().startsWith('s');
            newEmbed.addFields({ name: name, value: val, inline: inline });
        }
        if (customId === 'mdl_json') {
            try {
                const jsonData = JSON.parse(interaction.fields.getTextInputValue('i_json_data'));
                const dataToUse = jsonData.embeds ? jsonData.embeds[0] : jsonData;
                const embedFromJSON = new EmbedBuilder(dataToUse);
                const contentFromJSON = jsonData.content || '';
                const display = contentFromJSON ? `**Painel de Criação Supremo**\n${contentFromJSON}` : '**Painel de Criação Supremo**\n*(O texto que aparecer aqui será a mensagem fora do embed)*';
                return interaction.update({ content: display, embeds: [embedFromJSON] });
            } catch (e) {
                // [MUDANÇA] flags
                return interaction.reply({ content: '❌ JSON Inválido!', flags: MessageFlags.Ephemeral });
            }
        }
        await interaction.update({ embeds: [newEmbed] });
    }
};