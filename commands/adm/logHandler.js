/* ========================================================================
   ARQUIVO: commands/adm/logHandler.js (V7 - CORRIGE TODOS OS CRASHES 'null.id')
   ======================================================================== */
   
const { Events, EmbedBuilder, AuditLogEvent, ChannelType } = require('discord.js');
const path = require('path');
const { safeReadJson } = require('../liga/utils/helpers.js');

const logConfigPath = path.join(__dirname, 'log_config.json');

module.exports = (client) => {

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
        } catch (err) { console.error("Erro no log MessageDelete (Ghost Ping):", err); }
    });

    // --- LOG DE MENSAGEM EDITADA ---
    client.on(Events.MessageUpdate, async (oldMessage, newMessage) => { /* ... (código, sem mudanças) ... */ });
    
    // --- LOGS DE MEMBROS (ENTRADA) ---
    client.on(Events.GuildMemberAdd, async (member) => { /* ... (código, sem mudanças) ... */ });

    // --- LOGS DE ATUALIZAÇÃO DE MEMBRO (CARGOS, APELIDOS, SILENCIAMENTO) ---
    client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
        const logChannel = await getLogChannel();
        if (!logChannel) return;

        // 1. MUDANÇA DE APELIDO
        if (oldMember.nickname !== newMember.nickname) { /* ... (código, sem mudanças) ... */ }

        // 2. MUDANÇA DE CARGOS
        const oldRoles = oldMember.roles.cache;
        const newRoles = newMember.roles.cache;
        if (oldRoles.size !== newRoles.size) { /* ... (código, sem mudanças) ... */ }

        // 3. LOG DE SILENCIAMENTO (TIMEOUT)
        if (oldMember.communicationDisabledUntil !== newMember.communicationDisabledUntil) {
            const embed = new EmbedBuilder().setThumbnail(newMember.user.displayAvatarURL()).setTimestamp();
            let executor = "Não detectado";
            const fetchedLogs = await newMember.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberUpdate }).catch(() => null);
            const timeoutLog = fetchedLogs?.entries.first();
            
            // [VERIFICAÇÃO DE SEGURANÇA]
            if (timeoutLog && timeoutLog.target && timeoutLog.target.id === newMember.id && timeoutLog.createdAt > (Date.now() - 5000)) {
                const change = timeoutLog.changes.find(c => c.key === 'communication_disabled_until');
                if (change) { executor = timeoutLog.executor; }
            }
            if (newMember.communicationDisabledUntil) {
                const timestamp = Math.floor(newMember.communicationDisabledUntilTimestamp / 1000);
                embed.setColor('Purple').setTitle('Membro Silenciado (Timeout)')
                     .setDescription(`**Membro:** ${newMember.user} (${newMember.user.tag})\n**Silenciado por:** ${executor}`)
                     .addFields({ name: 'Expira em', value: `<t:${timestamp}:f>` });
            } else {
                embed.setColor('Green').setTitle('Silenciamento Removido')
                     .setDescription(`**Membro:** ${newMember.user} (${newMember.user.tag})\n**Timeout removido por:** ${executor}`);
            }
            await logChannel.send({ embeds: [embed] });
        }
    });

    // --- LOGS DE VOZ (COM VERIFICAÇÃO DE "MOVER") ---
    client.on(Events.VoiceStateUpdate, async (oldState, newState) => { /* ... (código, sem mudanças) ... */ });

    // --- OUVINTE DO REGISTRO DE AUDITORIA (LOGS DE ADMIN) ---
    client.on(Events.GuildAuditLogEntryCreate, async (auditLogEntry, guild) => {
        const logChannel = await getLogChannel();
        if (!logChannel) return;

        const { action, executor, target, reason } = auditLogEntry;
        
        // [VERIFICAÇÃO DE SEGURANÇA] Se o alvo for nulo, não podemos fazer nada.
        if (!target) return; 

        // --- LOG DE MENSAGEM DELETADA ---
        if (action === AuditLogEvent.MessageDelete) {
            if (executor.id === client.user.id || executor.id === target.id) return;
            const embed = new EmbedBuilder()
                .setColor('Red').setTitle('Mensagem Deletada por Moderador')
                .setDescription(`**Autor da Mensagem:** ${target} (${target.tag})\n**Deletado por:** ${executor} (${executor.tag})\n**Canal:** <#${auditLogEntry.extra.channel.id}>`)
                .setThumbnail(executor.displayAvatarURL()).setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }

        // --- LOG DE MEMBRO KICKADO ---
        if (action === AuditLogEvent.MemberKick) {
            const embed = new EmbedBuilder()
                .setColor('DarkRed').setTitle('Membro Expulso (Kick)')
                .setDescription(`**Usuário:** ${target} (${target.tag})\n**Expulso por:** ${executor} (${executor.tag})\n**Motivo:** \`\`\`${reason || 'N/A'}\`\`\``)
                .setThumbnail(target.displayAvatarURL()).setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }

        // --- LOG DE MEMBRO BANIDO ---
        if (action === AuditLogEvent.MemberBanAdd) {
            const embed = new EmbedBuilder()
                .setColor('DarkRed').setTitle('Membro Banido')
                .setDescription(`**Usuário:** ${target} (${target.tag})\n**Banido por:** ${executor} (${executor.tag})\n**Motivo:** \`\`\`${reason || 'N/A'}\`\`\``)
                .setThumbnail(target.displayAvatarURL()).setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }
        
        // --- LOG DE CANAL CRIADO ---
        if (action === AuditLogEvent.ChannelCreate) {
            const embed = new EmbedBuilder()
                .setColor('Green').setTitle('Canal Criado')
                .setDescription(`**Canal:** ${target} (${target.name})\n**Tipo:** ${ChannelType[target.type]}\n**Criado por:** ${executor} (${executor.tag})`)
                .setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }

        // --- LOG DE CANAL DELETADO ---
        if (action === AuditLogEvent.ChannelDelete) {
            const embed = new EmbedBuilder()
                .setColor('DarkRed').setTitle('Canal Deletado')
                .setDescription(`**Canal:** \`#${auditLogEntry.changes.find(c => c.key === 'name').old}\`\n**Tipo:** ${ChannelType[auditLogEntry.changes.find(c => c.key === 'type').old]}\n**Deletado por:** ${executor} (${executor.tag})`)
                .setTimestamp();
            await logChannel.send({ embeds: [embed] });
        }
    });

    // --- OUVINTE DE MEMBRO SAIU (A LÓGICA CORRIGIDA) ---
    client.on(Events.GuildMemberRemove, async (member) => {
        const logChannel = await getLogChannel();
        if (!logChannel) return;

        await new Promise(resolve => setTimeout(resolve, 1500)); 

        const fetchedKick = await member.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberKick }).catch(() => null);
        const kickLog = fetchedKick?.entries.first();
        
        // [VERIFICAÇÃO DE SEGURANÇA]
        if (kickLog && kickLog.target && kickLog.target.id === member.id && kickLog.createdAt > (Date.now() - 5000)) {
            return;
        }
        
        const fetchedBan = await member.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd }).catch(() => null);
        const banLog = fetchedBan?.entries.first();
        
        // [VERIFICAÇÃO DE SEGURANÇA]
        if (banLog && banLog.target && banLog.target.id === member.id && banLog.createdAt > (Date.now() - 5000)) {
            return;
        }

        // Se não foi Kick nem Ban, ele "Saiu"
        const embed = new EmbedBuilder()
            .setColor('Orange').setTitle('Membro Saiu')
            .setDescription(`**Usuário:** ${member.user} (${member.user.tag})\n**ID:** ${member.id}`)
            .setThumbnail(member.user.displayAvatarURL()).setTimestamp();
        await logChannel.send({ embeds: [embed] });
    });
};