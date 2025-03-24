require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Importation des routes
const racksRoutes = require('./routes/racks');
const equipmentRoutes = require('./routes/equipment');
const virtualMachinesRoutes = require('./routes/virtualMachines');
const switchPortsRoutes = require('./routes/switchPorts');
const debugRoutes = require('./routes/debug');

// Routes de l'API
app.use('/api/racks', racksRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/virtual-machines', virtualMachinesRoutes);
app.use('/api/switch-ports', switchPortsRoutes);
app.use('/api/debug', debugRoutes); // Ajout des routes de débogage

// Route de test
app.get('/api/test', (req, res) => {
  res.json({ message: 'API backend opérationnelle!' });
});

// Initialisation de la base de données et démarrage du serveur
db.init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Erreur lors de l\'initialisation de la base de données:', err);
    process.exit(1);
  });
