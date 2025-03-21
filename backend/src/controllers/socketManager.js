import { Server } from "socket.io";

let connections = {};   // connections: Har call room ka track rakhega aur usme kaun kaun connected hai, ye store karega.
let messages = {};      // messages: Har room ke chat messages store karega.
let timeOnline = {};    // timeOnline: Har user kab connect hua, uska timestamp yahan save hoga.


// Ek function connectToSocket banaya jo Express server ko as input lega aur uspe Socket.io server attach karega.
export const connectToSocket = (server) => {

    // Socket.io server ko initialize kiya gaya hai.
  const io = new Server(server, {
    cors: {     //CORS (Cross-Origin Resource Sharing) enabled kiya gaya hai, taaki koi bhi frontend is server se connect kar sake.
      origin: "*",
      methods: ["GET", "POST"],
      allowedHeaders: ["*"],
      credentials: true,
    },
  });

            // Jab koi naya user connect hoga, tab connection event fire hoga aur uska socket milega.
  io.on("connection", (socket) => {
    console.log("SOMETHING CONNECTED");

            // Jab koi user kisi call room me join karega, to ye event trigger hoga.
            // path room ka unique identifier hoga.
    socket.on("join-call", (path) => {
            // Agar room exist nahi karta, to ek naya empty array banayenge.
      if (connections[path] === undefined) {
        connections[path] = [];
      }
            //   User ka socket.id us room me add karenge.
      connections[path].push(socket.id);

            //User ka connection time track karenge.
      timeOnline[socket.id] = new Date();

      // connections[path].forEach(elem => {
      //     io.to(elem)
      // })

            //Jo bhi log pehle se room me hain, unko notify kiya jayega ki naya user join hua hai.
      for (let a = 0; a < connections[path].length; a++) {
        io.to(connections[path][a]).emit(
          "user-joined",
          socket.id,
          connections[path]
        );
      }

            //Agar pehle se chat messages store hain, to naye user ko purane messages dikhane ke liye bhej diye jayenge.
      if (messages[path] !== undefined) {
        for (let a = 0; a < messages[path].length; ++a) {
          io.to(socket.id).emit(
            "chat-message",
            messages[path][a]["data"],
            messages[path][a]["sender"],
            messages[path][a]["socket-id-sender"]
          );
        }
      }
    });

            // WebRTC ke liye signaling data send karega.
            // Ye P2P video/audio streaming ke liye use hota hai
    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    });

            //Jab koi user chat message bhejta hai, tab ye event fire hoga.
    socket.on("chat-message", (data, sender) => {

            // User jis room me hai, uska pata lagane ke liye connections object ko scan kiya gaya hai.
      const [matchingRoom, found] = Object.entries(connections).reduce(
        ([room, isFound], [roomKey, roomValue]) => {
          if (!isFound && roomValue.includes(socket.id)) {
            return [roomKey, true];
          }

          return [room, isFound];
        },
        ["", false]
      );

                //Agar room exist karta hai, aur pehle messages nahi hai, to ek naya array banayenge.      
      if (found === true) {
        if (messages[matchingRoom] === undefined) {
          messages[matchingRoom] = [];
        }

                // Message ko room ke messages array me store karenge.
        messages[matchingRoom].push({
          sender: sender,
          data: data,
          "socket-id-sender": socket.id,
        });
        console.log("message", matchingRoom, ":", sender, data);

                //Room me jitne log hai, un sabko ye message broadcast karenge.
        connections[matchingRoom].forEach((elem) => {
          io.to(elem).emit("chat-message", data, sender, socket.id);
        });
      }
    });

    // 
    // Jab user disconnect karega, to ye event chalega.
    socket.on("disconnect", () => {
        // Kitne time ke liye online tha, wo calculate kiya gaya hai. 
      var diffTime = Math.abs(timeOnline[socket.id] - new Date());

      var key;

    //   connections object ko iterate kiya gaya hai taaki ye dekha jaye ki ye user kis room me tha.
      for (const [k, v] of JSON.parse(
        JSON.stringify(Object.entries(connections))
      )) {
        // Agar ye user kisi room me exist karta hai, to us room ka naam (key) save karenge.
        for (let a = 0; a < v.length; ++a) {
          if (v[a] === socket.id) {
            key = k;
            
            // Baaki sab users ko notify karenge ki ek user chala gaya hai.
            for (let a = 0; a < connections[key].length; ++a) {
              io.to(connections[key][a]).emit("user-left", socket.id);
            }

            // User ko room list se remove karenge.
            var index = connections[key].indexOf(socket.id);

            connections[key].splice(index, 1);

            // Agar room me koi nahi bacha, to room ko delete kar denge.
            if (connections[key].length === 0) {
              delete connections[key];
            }
          }
        }
      }
    });
  });

//   Socket server ko return kar rahe hain, taaki Express app me ise use kiya ja sake.
  return io;
};
