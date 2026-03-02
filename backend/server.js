const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const dns = require('dns');

// Forcer Node.js à utiliser DNS externes (évite le 127.0.0.53 local qui bloque SRV)
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 5000;
// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connecté"))
  .catch(err => console.log(err));
 // Routes
 app.use("/api/auth", require("./routes/authRoutes"));
 app.use("/api/test", require("./routes/testRoutes"));
 app.use("/api/users", require("./routes/userRoutes"));
 app.use("/api/boxes", require("./routes/boxRoutes"));
 app.use("/api/boutique", require("./routes/boutiqueRoutes"));
 app.use("/api/boutiques", require("./routes/boutiquesRoutes"));
 app.use("/api/articles", require("./routes/articleRoutes"));
 app.use("/api/purchases", require("./routes/purchaseRoutes"));
 app.use("/api/deliveries", require("./routes/deliveryRoutes"));
 app.use("/api/boutique-deliveries", require("./routes/boutiqueDeliveryRoutes"));

app.listen(PORT, () => console.log(`Serveur démarré sur le port
${PORT}`));