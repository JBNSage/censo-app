import { Server } from "socket.io";

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/*{ strapi }*/) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  bootstrap({ strapi }) {
    let connectedUsers = 0;
    let interval;
    var io: Server = require("socket.io")(strapi.server.httpServer, {
      cors: {
        origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", function (socket) {
      connectedUsers++;
      socket.emit("userConnected", connectedUsers);

      console.log("User connected", connectedUsers);

      //Load a Product's Bids
      socket.on("disconnect", () => {
        connectedUsers--;
        socket.emit("userDisconnected", connectedUsers);
        console.log("user disconnected");
        clearInterval(interval);
      });
    });

    //Make the socket global
    strapi.io = io;
  },
};
