
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

// Routes
const racksRouter = require('./routes/racks');
const equipmentRouter = require('./routes/equipment');
const virtualMachinesRouter = require('./routes/virtualMachines');
const switchPortsRouter = require('./routes/switchPorts');

app.use('/api/racks', racksRouter);
app.use('/api/equipment', equipmentRouter);
app.use('/api/virtual-machines', virtualMachinesRouter);
app.use('/api/switch-ports', switchPortsRouter);

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
