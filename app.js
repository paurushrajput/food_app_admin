require('dotenv').config();
exports.server = server = require('fastify')({ logger: false });
const fastifyCors = require('@fastify/cors');
// const {getPGDatabase} = require('./dbConfig/pgConnect')
server.register(fastifyCors, {
  // Set your CORS options here
  origin: '*', // Replace with the allowed origins or '*' for any origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Specify the allowed HTTP methods
  allowedHeaders: ['Content-Type', 'authorization' ], // Specify the allowed headers
  credentials: true, // Set to true if you want to allow cookies and HTTP authentication
});

//initialising default configuration
require("./configuration/initialize").initialize(server);
//initialising all routes
require("./routes/users/index.routes").userRoutes(server);
require("./routes/admin/index.routes").adminRoutes(server);
//keep this route in last
require("./routes/error.routes").errorRoutes(server);
server.register(require('@fastify/multipart'))


// Access environment variables
const HOST = process.env.SERVER_HOST || 'localhost';
const PORT = process.env.SERVER_PORT || 3000;

// Start the Fastify server with the specified hostname and port
const start = async () => {
  try {
    await server.listen({
      port: PORT,
      host: HOST
    });
  console.log(`Server listening on ${HOST}:${PORT}`);
  // const pgDB = await getPGDatabase()
  
  // await require("./services/admin/userEvent.service").initiateCoinProcessing()
  // await require("./services/admin/userCredits.service").updatePendingConvertPointToCreditStatus()
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};

start();
