const fs = require("node:fs");
const path = require("node:path");

let pendingItems = {};
let completedItems = {};
let sentence = {};

const parseFile = (fileName) => {
  return JSON.parse(
    fs.readFileSync(path.join(__dirname, `data/${fileName}.json`))
  );
};

const updateFile = (fileName, data) => {
  fs.writeFileSync(
    path.join(__dirname, `data/${fileName}.json`),
    JSON.stringify(data, null, 2)
  );
};

const verifications = () => {
  pendingItems = parseFile("verifications/pending");
  completedItems = parseFile("verifications/completed");

  return {
    pending: {
      getByUserId: (id) => {
        return Object.entries(pendingItems).find(([userId]) => userId === id);
      },
      getByToken: (token) => {
        return Object.entries(pendingItems).find(([_, t]) => t === token);
      },
      verifyToken: (id, token) => {
        return Object.entries(pendingItems).some(
          ([userId, t]) => t === token && userId === id
        );
      },
      add: (id, token) => {
        pendingItems[id] = token;
        updateFile("verifications/pending", pendingItems);
      },
      remove: (id) => {
        delete pendingItems[id];
        updateFile("verifications/pending", pendingItems);
      },
    },
    completed: {
      items: [],
      getByUserId: (id) => {
        return Object.entries(completedItems).find(
          ([userId, uuid]) => userId === id
        );
      },
      getByUuid: (uuid) => {
        return Object.entries(completedItems).find(([_, u]) => u === uuid);
      },
      getByUserId: (id) => {
        return Object.entries(completedItems).find(([userId]) => userId === id);
      },
      add: (id, uuid) => {
        completedItems[id] = uuid;
        updateFile("verifications/completed", completedItems);
      },
      remove: (id) => {
        delete completedItems[id];
        updateFile("verifications/completed", completedItems);
      },
    },
  };
};

const sentences = () => {
  sentence = parseFile("sentences");

  return {
    get: () => {
      return sentence;
    },
    add: (word, userId) => {
      if ([".", "!", "?"].some((c) => word.includes(c))) {
        sentence = {
          lastMessage: `${sentence.message} ${word}`,
          message: "",
          userId: userId,
        };
        updateFile("sentences", sentence);
        return;
      }

      sentence.message = `${sentence.message} ${word}`;
      sentence.userId = userId;

      return sentence;
    },
    updateMessageId: (messageId) => {
      sentence.messageId = messageId;
      updateFile("sentences", sentence);
    },
  };
};

module.exports = {
  verifications: verifications(),
  sentences: sentences(),
  messageErrorMiddleware: async (callback, reply) => {
    try {
      await callback();
    } catch (err) {
      const msg = await reply({
        content: "Es ist ein Fehler aufgetreten.",
      });
      setTimeout(() => {
        msg.delete();
      }, 5000);
    }
  },
};
