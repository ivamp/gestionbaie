
# Configuration de la Base de Données

## Architecture Client-Serveur

Cette application est conçue comme une application frontend React avec un backend Node.js Express séparé qui se connecte à MariaDB.

## Configuration du Backend

1. Naviguez dans le dossier `backend`
2. Créez un fichier `.env` à partir du modèle `.env.example`
3. Installez les dépendances avec `npm install`
4. Démarrez le serveur avec `npm start` ou `npm run dev` pour le mode développement

## Configuration du Frontend

1. Créez un fichier `.env` à la racine du projet à partir du modèle `.env.example`
2. Définissez `VITE_API_URL` pour pointer vers votre API backend (par défaut: `http://localhost:3001/api`)
3. Démarrez l'application frontend avec `npm run dev`

## Structure de la base de données

Le backend configurera automatiquement la base de données lors du premier démarrage:

```sql
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

## Configuration des fichiers .env

### Backend (.env dans le dossier backend)

```
# Configuration de la base de données MariaDB
DB_HOST=localhost
DB_PORT=3306
DB_USER=votre_utilisateur
DB_PASSWORD=votre_mot_de_passe
DB_NAME=baiesv2

# Configuration du serveur
PORT=3001
```

### Frontend (.env à la racine du projet)

```
# URL de l'API backend
VITE_API_URL=http://localhost:3001/api
```

## Déploiement

Pour un déploiement en production:

1. Configurez correctement les variables d'environnement pour les deux parties
2. Utilisez un gestionnaire de processus comme PM2 pour le backend
3. Créez une version de production du frontend avec `npm run build`
4. Hébergez les fichiers statiques générés sur un serveur web

## Dépannage

Si vous rencontrez des problèmes de connexion:

1. Vérifiez que le serveur backend est en cours d'exécution
2. Vérifiez les informations de connexion à la base de données
3. Vérifiez que l'URL de l'API est correctement configurée dans le frontend
4. Consultez les logs du serveur backend pour plus d'informations

