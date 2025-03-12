
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Pool de connexions pour une meilleure performance
let pool;

// Initialisation de la base de données
async function init() {
  try {
    // Créer d'abord un pool sans spécifier de base de données
    const tempPool = mysql.createPool({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0
    });

    // Vérifier si la base de données existe
    const [rows] = await tempPool.query(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
      [dbConfig.database]
    );

    // Si la base de données n'existe pas, la créer
    if (rows.length === 0) {
      console.log(`Base de données '${dbConfig.database}' non trouvée, création en cours...`);
      await tempPool.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
      
      // Créer les tables en exécutant le script SQL
      const sqlScript = fs.readFileSync(path.join(__dirname, 'database-schema.sql'), 'utf8');
      
      // Fermer le pool temporaire
      await tempPool.end();
      
      // Créer un nouveau pool avec la base de données spécifiée
      pool = mysql.createPool(dbConfig);
      
      // Exécuter le script SQL pour créer les tables
      const queries = sqlScript.split(';').filter(query => query.trim() !== '');
      
      for (const query of queries) {
        await pool.query(query);
      }
      
      console.log('Tables créées avec succès');
    } else {
      // Fermer le pool temporaire
      await tempPool.end();
      
      // Créer un pool avec la base de données spécifiée
      pool = mysql.createPool(dbConfig);
      console.log(`Connexion établie à la base de données '${dbConfig.database}'`);
    }
    
    return true;
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
    throw error;
  }
}

// Méthode pour exécuter une requête
async function query(sql, params) {
  try {
    const [results] = await pool.query(sql, params);
    return results;
  } catch (error) {
    console.error('Erreur lors de l\'exécution de la requête:', error);
    throw error;
  }
}

module.exports = {
  init,
  query
};
