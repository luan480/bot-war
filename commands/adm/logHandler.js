/* ========================================================================
   HANDLER ATUALIZADO: commands/adm/logHandler.js (V4 - COMPLETO)
   
   - [NOVO] Adicionado Logs de Canais (Criado, Deletado, Atualizado).
   - [Necessário importar 'ChannelType' agora]
   ======================================================================== */
   
const { Events, EmbedBuilder, AuditLogEvent, ChannelType } = require('discord.js');
const path = require('path');
const { safeReadJson } = require('../liga/utils/helpers.js');

const logConfigPath = path.join(__dirname, 'log_config.json');

module.exports = (client) => {

    // Função para buscar o canal de log
    async function getLogChannel() {
        const config = safeReadJson(logConfigPath);
        if (!config.logChannelId) return null;
        return await client.channels.fetch(config.logChannelId).catch(() => null);
    }

    // --- LOG DE MENSAGEM DELETADA (COM ESPELHO) ---
    client.on(Events.MessageDelete, async (message) => {
        if (!message.guild || message.author?.bot) return;
        const logChannel = await getLogChannel();
        if (!logChannel) return;
        
        try {
            // ESPELHO (Ghost Ping)
            if (message.mentions.users.size > 0) {
                const mentionedUser = message.mentions.users.first();
                if (mentionedUser.id !== message.author.id) {
                    const embed = new EmbedBuilder()
                        .setColor('#9B59B6').setTitle('👻 Ghost Ping Detectado (Espelho)')
                        .setDescription(`**Autor:** ${message.author} (${message.author.tag})\n**Mencionado:** ${mentionedUser} (${mentionedUser.tag})\n**Canal:** ${message.channel}`)
                        .addFields({ name: 'Mensagem Deletada', value: `\`\`\`${message.content || '[N/A]'}\`\`\`` })
                        .setThumbnail(message.author.displayAvatarURL()).setTimestamp();
                    await logChannel.send({ embeds: [embed] });
                    return; 
                }
            }
            
            // Log de Deleção Normal
            const embed = new EmbedBuilder()
                .setColor('Red').setTitle('Mensagem Deletada')
                .setDescription(`**Autor:** ${message.author.tag} (${message.author.id})\n**Canal:** ${message.channel}\n**Mensagem:**\n\`\`\`${message.content || '[Mensagem sem texto]'}\`\`\``)
                .setThumbnail(message.author.displayAvatarURL()).setTimestamp();
            if (message.attachments.size > 0) {
                embed.addFields({ name: 'Anexos', value: message.attachments.map(a => `[${a.name}](${a.url})`).join('\n') });
            }
            await logChannel.send({ embeds: [embed] });
        } catch (err) { console.error("Erro no log MessageDelete:", err); }
    });

    // --- LOG DE MENSAGEM EDITADA ---
    client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
        if (!newMessage.guild || newMessage.author?.bot || oldMessage.content === newMessage.content) return;
        const logChannel = await getLogChannel();
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setColor('Yellow').setTitle('Mensagem Editada')
            .setDescription(`**Autor:** ${newMessage.author.tag} (${newMessage.author.id})\n**Canal:** ${newMessage.channel}\n[Ir para a Mensagem](${newMessage.url})`)
            .addFields(
                { name: 'Conteúdo Antigo', value: `\`\`\`${oldMessage.content.slice(0, 1000) || '[N/A]'}\`\`\`` },
                { name: 'Conteúdo Novo', value: `\`\`\`${newMessage.content.slice(0, 1000) || '[N/A]'}\`\`\`` }
            )
            .setThumbnail(newMessage.author.displayAvatarURL()).setTimestamp();
        try {
            await logChannel.send({ embeds: [embed] });
        } catch (err) { console.error("Erro no log MessageUpdate:", err); }
    });
    
    // --- LOGS DE MEMBROS (ENTRADA, SAÍDA, BAN) ---
    client.on(Events.GuildMemberAdd, async (member) => {
        const logChannel = await getLogChannel();
        if (!logChannel) return;
        const embed = new EmbedBuilder()
            .setColor('Green').setTitle('Membro Entrou')
            .setDescription(`**Usuário:** ${member.user} (${member.user.tag})\n**ID:** ${member.id}\n**Conta Criada em:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:f>`)
            .setThumbnail(member.user.displayAvatarURL()).setTimestamp();
        await logChannel.send({ embeds: [embed] });
    });
    client.on(Events.GuildMemberRemove, async (member) => {
        const logChannel = await getLogChannel();
        if (!logChannel) return;
        const fetchedLogs = await member.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberKick }).catch(() => null);
        const kickLog = fetchedLogs?.entries.first();
        
        if (kickLog && kickLog.target.id === member.id && kickLog.createdAt > (Date.now() - 5000)) {
            const embed = new EmbedBuilder()
                .setColor('DarkRed').setTitle('Membro Expulso (Kick)')
                .setDescription(`**Usuário:** ${member.user} (${member.user.tag})\n**ID:** ${member.id}\n**Expulso por:** ${kickLog.executor}\n**Motivo:** \`\`\`${kickLog.reason || 'N/A'}\`\`\``)
                .setThumbnail(member.user.displayAvatarURL()).setTimestamp();
            await logChannel.send({ embeds: [embed] });
        } else {
            const embed = new EmbedBuilder()
                .setColor('Orange').setTitle('Membro Saiu')
                .setDescription(`**Usuário:** ${member.user} (${member.user.tag})\n**ID:** ${member.id}`)
                .setThumbnail(member.user.displayAvatarURL()).setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }
    });
    client.on(Events.GuildBanAdd, async (ban) => {
        const logChannel = await getLogChannel();
        if (!logChannel) return;
        const embed = new EmbedBuilder()
            .setColor('DarkRed').setTitle('Membro Banido')
            .setDescription(`**Usuário:** ${ban.user} (${ban.user.tag})\n**ID:** ${ban.user.id}\n**Motivo:** \`\`\`${ban.reason || 'N/A'}\`\`\``)
            .setThumbnail(ban.user.displayAvatarURL()).setTimestamp();
        await logChannel.send({ embeds: [embed] });
    });

    // --- LOGS DE ATUALIZAÇÃO DE MEMBRO (CARGOS E APELIDOS) ---
    client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
        const logChannel = await getLogChannel();
        if (!logChannel) return;

        // 1. MUDANÇA DE APELIDO
        if (oldMember.nickname !== newMember.nickname) {
            const embed = new EmbedBuilder()
                .setColor('Blue').setTitle('Mudança de Apelido')
                .setDescription(`**Membro:** ${newMember.user} (${newMember.user.tag})`)
                .addFields(
                    { name: 'Apelido Antigo', value: `\`\`\`${oldMember.nickname || oldMember.user.username}\`\`\`` },
                    { name: 'Apelido Novo', value: `\`\`\`${newMember.nickname || newMember.user.username}\`\`\`` }
                )
                .setThumbnail(newMember.user.displayAvatarURL()).setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }

        // 2. MUDANÇA DE CARGOS
        const oldRoles = oldMember.roles.cache;
        const newRoles = newMember.roles.cache;

        if (oldRoles.size !== newRoles.size) {
            const embed = new EmbedBuilder()
                .setColor('Blue').setTitle('Cargos Atualizados')
                .setDescription(`**Membro:** ${newMember.user} (${newMember.user.tag})`);
            const fetchedLogs = await newMember.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberRoleUpdate }).catch(() => null);
            const roleLog = fetchedLogs?.entries.first();
            
            if (roleLog && roleLog.target.id === newMember.id && roleLog.createdAt > (Date.now() - 5000)) {
                embed.addFields({ name: 'Alterado por', value: `${roleLog.executor}` });
            } else {
                embed.addFields({ name: 'Alterado por', value: `*Não detectado (Automático ou usuário)*` });
            }
            const addedRoles = newRoles.filter(role => !oldRoles.has(role.id));
            if (addedRoles.size > 0) {
                embed.addFields({ name: 'Cargos Adicionados', value: addedRoles.map(r => r.name).join(', ') });
            }
            const removedRoles = oldRoles.filter(role => !newRoles.has(role.id));
            if (removedRoles.size > 0) {
                embed.addFields({ name: 'Cargos Removidos', value: removedRoles.map(r => r.name).join(', ') });
            }
            await logChannel.send({ embeds: [embed] });
        }
    });

    // --- LOGS DE CANAL DE VOZ ---
    client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
        const logChannel = await getLogChannel();
        if (!logChannel) return;
        const user = newState.member.user;
        
        if (!oldState.channel && newState.channel) {
            const embed = new EmbedBuilder()
                .setColor('Green').setTitle('Voz: Membro Entrou')
                .setDescription(`**Membro:** ${user} (${user.tag})\n**Canal:** ${newState.channel.name}`)
                .setThumbnail(user.displayAvatarURL()).setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }
        if (oldState.channel && !newState.channel) {
            const embed = new EmbedBuilder()
                .setColor('Orange').setTitle('Voz: Membro Saiu')
                .setDescription(`**Membro:** ${user} (${user.tag})\n**Canal:** ${oldState.channel.name}`)
                .setThumbnail(user.displayAvatarURL()).setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }
        if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
            const embed = new EmbedBuilder()
                .setColor('Blue').setTitle('Voz: Membro Trocou de Canal')
                .setDescription(`**Membro:** ${user} (${user.tag})`)
                .addFields(
                    { name: 'Saiu de', value: `${oldState.channel.name}` },
                    { name: 'Entrou em', value: `${newState.channel.name}` }
                )
                .setThumbnail(user.displayAvatarURL()).setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }
    });

    /* ============================================================
       [NOVO] LOGS DE CANAIS (CRIAR, DELETAR, ATUALIZAR)
       ============================================================ */

    // --- OUVINTE DE CANAL CRIADO ---
    client.on(Events.ChannelCreate, async (channel) => {
        const logChannel = await getLogChannel();
        if (!logChannel || !channel.guild) return;

        const embed = new EmbedBuilder()
            .setColor('Green')
            .setTitle('Canal Criado')
            .setDescription(
                `**Nome:** ${channel.name}\n` +
                `**ID:** ${channel.id}\n` +
                `**Tipo:** ${ChannelType[channel.type]}`
            )
            .setTimestamp();

        // Pega quem criou do Audit Log
        const fetchedLogs = await channel.guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.ChannelCreate,
        }).catch(() => null);
        
        const createLog = fetchedLogs?.entries.first();
        if (createLog && createLog.target.id === channel.id && createLog.createdAt > (Date.now() - 5000)) {
            embed.setDescription(
                embed.data.description + `\n**Criado por:** ${createLog.executor}`
            );
        }
        await logChannel.send({ embeds: [embed] });
    });

    // --- OUVINTE DE CANAL DELETADO ---
    client.on(Events.ChannelDelete, async (channel) => {
        const logChannel = await getLogChannel();
        if (!logChannel || !channel.guild) return;

        const embed = new EmbedBuilder()
            .setColor('DarkRed')
            .setTitle('Canal Deletado')
            .setDescription(
                `**Nome:** ${channel.name}\n` +
                `**ID:** ${channel.id}\n` +
                `**Tipo:** ${ChannelType[channel.type]}`
            )
            .setTimestamp();

        // Pega quem deletou do Audit Log
        const fetchedLogs = await channel.guild.fetchAuditLogs({
            limit: 1,
            type: AuditLogEvent.ChannelDelete,
        }).catch(() => null);
        
        const deleteLog = fetchedLogs?.entries.first();
        if (deleteLog && deleteLog.target.id === channel.id && deleteLog.createdAt > (Date.now() - 5000)) {
            embed.setDescription(
                embed.data.description + `\n**Deletado por:** ${deleteLog.executor}`
            );
        }
        await logChannel.send({ embeds: [embed] });
    });

    // --- OUVINTE DE CANAL ATUALIZADO (MUDANÇA DE NOME) ---
    client.on(Events.ChannelUpdate, async (oldChannel, newChannel) => {
        const logChannel = await getLogChannel();
        if (!logChannel || !newChannel.guild) return;

        let embed = null;

        // Mudança de Nome
        if (oldChannel.name !== newChannel.name) {
            embed = new EmbedBuilder()
                .setColor('Blue')
                .setTitle('Canal Renomeado')
                .setDescription(`**Canal:** ${newChannel}`)
                .addFields(
                    { name: 'Nome Antigo', value: `\`${oldChannel.name}\`` },
                    { name: 'Nome Novo', value: `\`${newChannel.name}\`` }
                )
                .setTimestamp();
        }
        
        // (Poderíamos adicionar logs para Tópico, Permissões, etc., mas isso já cobre o principal)

        if (embed) {
            await logChannel.send({ embeds: [embed] });
        }
    });

};