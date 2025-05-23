// index.js
const { Client, GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const config = require('./config');
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember]
});

client.once('ready', async () => {
  console.log(`✅ Bot online como ${client.user.tag}`);

  if (config.useTickets && config.ticket.use) {
    try {
      const setupChannel = await client.channels.fetch(config.ticket.setupChannelId);
      if (setupChannel) {
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('open_ticket')
            .setLabel('🎫 Abrir Ticket')
            .setStyle(ButtonStyle.Primary)
        );

        await setupChannel.send({
          content: 'Clique no botão abaixo para abrir um ticket:',
          components: [row]
        });
      }
    } catch (err) {
      console.error('Erro ao configurar canal de tickets:', err);
    }
  }
});

client.on('guildMemberAdd', member => {
  if (!config.useWelcomeMessages) return;
  const channel = member.guild.channels.cache.get(config.welcomeChannelId);
  if (channel) channel.send(config.welcomeMessage(member.user));

  if (config.autoRole?.use) {
    setTimeout(() => {
      const role = member.guild.roles.cache.get(config.autoRole.roleId);
      if (role) {
        member.roles.add(role).catch(console.error);
      }
    }, config.autoRole.delay);
  }
});

client.on('guildMemberRemove', member => {
  if (!config.useWelcomeMessages) return;
  const channel = member.guild.channels.cache.get(config.goodbyeChannelId);
  if (channel) channel.send(config.goodbyeMessage(member.user));
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

  if (interaction.customId === 'open_ticket') {
    if (!config.useTickets || !config.ticket.use) return;

    const options = config.ticket.ticketOptions.map(option => ({
      label: option.label,
      value: option.value,
      description: option.description,
      emoji: option.emoji
    }));

    const menu = new StringSelectMenuBuilder()
      .setCustomId('ticket_reason')
      .setPlaceholder('Escolha o motivo do ticket')
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({ content: 'Selecione o motivo do ticket:', components: [row], ephemeral: true });
  }

  if (interaction.customId === 'ticket_reason') {
    if (!config.useTickets || !config.ticket.use) return;

    const reason = interaction.values[0];
    const existing = interaction.guild.channels.cache.find(c => c.topic === interaction.user.id);
    if (existing) {
      return interaction.reply({ content: '❌ Você já tem um ticket aberto.', ephemeral: true });
    }

    const channel = await interaction.guild.channels.create({
      name: `ticket-${interaction.user.username.toLowerCase()}`.replace(/[^a-z0-9\-]/g, ''),
      type: ChannelType.GuildText,
      parent: config.ticket.ticketCategoryId,
      topic: interaction.user.id,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: ['ViewChannel']
        },
        {
          id: interaction.user.id,
          allow: ['ViewChannel', 'SendMessages']
        },
        {
          id: config.ticket.staffRoleId,
          allow: ['ViewChannel', 'SendMessages']
        }
      ]
    });

    const closeBtn = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('🔒 Fechar Ticket')
        .setStyle(ButtonStyle.Danger)
    );

    await channel.send({ content: `🎟️ Ticket criado por <@${interaction.user.id}>.\nMotivo: **${reason}**`, components: [closeBtn] });
    await interaction.reply({ content: `✅ Ticket criado com sucesso: <#${channel.id}>`, ephemeral: true });
  }

  if (interaction.customId === 'close_ticket') {
    const channel = interaction.channel;
    const guild = interaction.guild;

    if (!config.transcript.use) {
      await channel.send('🔒 Este ticket será fechado em 5 segundos...');
      setTimeout(() => channel.delete().catch(() => {}), 5000);
      return;
    }

    const messages = await channel.messages.fetch({ limit: 100 });
    const sorted = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    let content = `Transcript do canal ${channel.name}:\n\n`;
    for (const msg of sorted.values()) {
      const timestamp = new Date(msg.createdTimestamp).toLocaleString();
      const username = msg.author.tag;
      const message = msg.content || '[Embed/O conteúdo não é texto]';
      content += `[${timestamp}] ${username}: ${message}\n`;
    }

    const filePath = path.join(__dirname, `${channel.id}_transcript.txt`);
    fs.writeFileSync(filePath, content, 'utf8');

    const logChannel = guild.channels.cache.get(config.transcript.logChannelId);
    if (logChannel) {
      await logChannel.send({
        content: `📄 Transcript de ${channel.name}:`,
        files: [filePath]
      });
    }

    await channel.send('📁 Transcript salvo. Este canal será fechado em 5 segundos...');
    setTimeout(() => {
      fs.unlinkSync(filePath);
      channel.delete().catch(() => {});
    }, 5000);
  }
});

client.on('messageCreate', async message => {
  if (!config.clearMessages.use) return;
  if (!message.content.startsWith(config.clearMessages.prefix)) return;
  if (!message.member.roles.cache.has(config.clearMessages.allowedRoleId)) return;

  const args = message.content.slice(config.clearMessages.prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command !== 'clear') return;

  const amount = parseInt(args[0]);

  if (isNaN(amount) || amount < 1 || amount > 100) {
    return message.reply('❌ Use um número entre 1 e 100. Exemplo: `+clear 50`');
  }

  await message.channel.bulkDelete(amount, true)
    .then(deleted => message.channel.send(`🧹 ${deleted.size} mensagens apagadas.`))
    .catch(() => message.channel.send('❌ Não consegui apagar as mensagens.'));
});

client.login(config.token);
