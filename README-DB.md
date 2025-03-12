
# Configuration de la Base de Données

## Prérequis

- MariaDB 10.5 ou plus récent
- Node.js 14.x ou plus récent

## Configuration

1. Créez une copie du fichier `.env.example` et nommez-le `.env`:
   ```bash
   cp .env.example .env
   ```

2. Modifiez le fichier `.env` avec vos informations de connexion à la base de données:
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=votre_utilisateur
   DB_PASSWORD=votre_mot_de_passe
   DB_NAME=baiesv2
   ```

3. Créez la base de données:
   ```sql
   CREATE DATABASE baiesv2;
   ```

4. Créez les tables nécessaires en exécutant le script SQL suivant:

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

5. Démarrez l'application:
   ```bash
   npm run dev
   ```

## Notes
- Assurez-vous que l'utilisateur de base de données que vous spécifiez a les droits suffisants pour créer, lire, mettre à jour et supprimer des données dans la base de données spécifiée.
- Le fichier `.env` est inclus dans `.gitignore` et ne sera pas versionné pour des raisons de sécurité.
