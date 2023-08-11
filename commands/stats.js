const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Schaue die Statisiken von dir oder anderen Spielern an.")
    .addStringOption((option) =>
      option
        .setName("spieler")
        .setDescription("Der Spieler, dessen Statistiken du sehen möchtest.")
        .setAutocomplete(true)
    ),
  async autocomplete(interaction) {
    const focusedValue = interaction.options.getFocused();
    const players = [
      "Meierschlumpf",
      "CheckMarvin",
      "Textilkleber",
      "Flashbert",
      "Dombuilder",
    ];
    const filtered = players
      .filter((player) =>
        player.toLowerCase().includes(focusedValue.toLowerCase())
      )
      .sort(
        (a, b) =>
          a.toLowerCase().indexOf(focusedValue.toLowerCase()) -
          b.toLowerCase().indexOf(focusedValue.toLowerCase())
      );

    await interaction.respond(
      filtered.map((choice) => ({
        name: choice,
        value: choice,
      }))
    );
  },
  async execute(interaction) {
    const user =
      interaction.options.getString("spieler") ?? interaction.user.username;

    await interaction.channel.send({
      embeds: [
        {
          title: "Statisiken von " + user,
          color: 0xffffff,
          fields: [
            {
              name: "Rang",
              value: "#15",
              inline: true,
            },
            {
              name: "Punkte",
              value: "951",
              inline: true,
            },
            {
              name: "Wins",
              value: "45",
              inline: true,
            },
            {
              name: "Kills",
              value: "56",
              inline: true,
            },
            {
              name: "Deaths",
              value: "100",
              inline: true,
            },
            {
              name: "K/D",
              value: "0.56",
              inline: true,
            },
          ],
        },
      ],
    });
  },
};
