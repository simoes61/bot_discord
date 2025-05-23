
module.exports = {
  // 🚨 Nunca compartilhe seu token real publicamente!
    token: 'MTMyNzcwMDQzMjQ2NTgyMTc5OQ.G6lUom.tqRLf4WmoD2ewa2Mygaaq0oJ9QP5Ajb3WnNRgg',

  // 🎉 Welcome & Goodbye Messages
  useWelcomeMessages: true,
  welcomeChannelId: '1374697713119268985',
  goodbyeChannelId: '1374697713119268985',
  welcomeMessage: user => `👋 Olá <@${user.id}>, bem-vindo(a) ao servidor!`,
  goodbyeMessage: user => `👋 <@${user.id}> saiu do servidor. Até logo!`,

  // 🎫 Ticket System
  useTickets: true,
  ticket: {
    use: true,

    // Channel where the ticket select menu is sent
    setupChannelId: '1374698127696855144',

    // Category where tickets are created
    ticketCategoryId: '1374698098223218759',

    // Role that can view/manage tickets
    staffRoleId: '1375188464513056768',

    // Options displayed in the ticket menu
    ticketOptions: [
      {
        label: 'Buy a Bot',
        value: 'BUY',
        description: 'Open a ticket to purchase a custom Discord bot.',
        emoji: '💬'
      },
      {
        label: 'Technical Support',
        value: 'SUPPORT',
        description: 'Need help with an issue or bug?',
        emoji: '🛠️'
      },
      {
        label: 'General Inquiry',
        value: 'INQUIRY',
        description: 'Ask a question about our services.',
        emoji: '❓'
      }
    ]
  },

  // 📝 Ticket Transcript Logging
  transcript: {
    use: true,
    logChannelId: '1375188786849255544'
  },

  // 🧹 Clear Messages Command
  clearMessages: {
    use: true,
    prefix: '+', // Example: '+clear 10'
    allowedRoleId: '1375188464513056768'
  },

  // 🎭 Auto Role After Join
  autoRole: {
    use: true,
    roleId: '1374702054806913105',
    delaySeconds: 10 // Delay in seconds before assigning the role
  }
};
