
# Configuration de la Base de Données

## Important: Architecture Client-Serveur

Cette application est conçue comme une application frontend React. Pour se connecter à une base de données MariaDB, vous devez configurer une API backend séparée, car:

1. Les connexions directes à MySQL ne fonctionnent pas dans un navigateur
2. Exposer les identifiants de base de données au client constitue un risque de sécurité

## Options pour l'intégration de la base de données

### Option 1: Développement avec données simulées
L'application utilise actuellement des données simulées pour le développement.

### Option 2: Création d'une API backend (recommandé)
Pour une application en production:

1. Créez une API REST avec Node.js/Express, PHP, Python, etc.
2. Configurez la connexion à la base de données dans cette API
3. Modifiez les services dans `src/services/` pour faire des appels à votre API au lieu d'utiliser les données mockées

## Structure de la base de données

Si vous créez une API backend, utilisez ce schéma pour votre base de données:

```sql
USE baiesv2;

-- Table des baies
CREATE TABLE racks (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(100) NOT NULL,
  totalUnits INT NOT NULL
);

-- Table des équipements
CREATE TABLE equipment (
  id VARCHAR(36) PRIMARY KEY,
  rack_id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  type ENUM('switch', 'server') NOT NULL,
  brand VARCHAR(100) NOT NULL,
  position INT NOT NULL,
  size INT NOT NULL,
  portCount INT,
  ipAddress VARCHAR(15),
  idracIp VARCHAR(15),
  description TEXT,
  FOREIGN KEY (rack_id) REFERENCES racks(id) ON DELETE CASCADE
);

-- Table des machines virtuelles
CREATE TABLE virtual_machines (
  id VARCHAR(36) PRIMARY KEY,
  equipment_id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  anydeskCode VARCHAR(50),
  ipAddress VARCHAR(15),
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
);

-- Table des ports de switch
CREATE TABLE switch_ports (
  id VARCHAR(36) PRIMARY KEY,
  equipment_id VARCHAR(36) NOT NULL,
  portNumber INT NOT NULL,
  description VARCHAR(100),
  connected BOOLEAN NOT NULL DEFAULT false,
  taggedVlans JSON,
  isFibre BOOLEAN NOT NULL DEFAULT false,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
);

-- Table des VLAN
CREATE TABLE vlans (
  id VARCHAR(36) PRIMARY KEY,
  equipment_id VARCHAR(36) NOT NULL,
  name VARCHAR(50) NOT NULL,
  vlanId INT NOT NULL,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
);
```

## Configuration du fichier .env

Si vous configurez une API backend, voici un exemple de configuration:

```
# Backend API (ne pas préfixer avec VITE_)
DB_HOST=localhost
DB_PORT=3306
DB_USER=votre_utilisateur
DB_PASSWORD=votre_mot_de_passe
DB_NAME=baiesv2

# Frontend (préfixer avec VITE_ pour Vite)
VITE_API_URL=http://localhost:3000/api
```
