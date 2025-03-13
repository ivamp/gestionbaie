
-- Table des baies
CREATE TABLE IF NOT EXISTS racks (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  location VARCHAR(100) NOT NULL,
  totalUnits INT NOT NULL
);

-- Table des équipements
CREATE TABLE IF NOT EXISTS equipment (
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
  vlans JSON,
  FOREIGN KEY (rack_id) REFERENCES racks(id) ON DELETE CASCADE
);

-- Table des machines virtuelles
CREATE TABLE IF NOT EXISTS virtual_machines (
  id VARCHAR(36) PRIMARY KEY,
  equipment_id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  anydeskCode VARCHAR(50),
  ipAddress VARCHAR(15),
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
);

-- Table des ports de switch
CREATE TABLE IF NOT EXISTS switch_ports (
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
CREATE TABLE IF NOT EXISTS vlans (
  id VARCHAR(36) PRIMARY KEY,
  equipment_id VARCHAR(36) NOT NULL,
  name VARCHAR(50) NOT NULL,
  vlanId INT NOT NULL,
  FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
);
