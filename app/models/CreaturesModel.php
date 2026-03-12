<?php
class CreaturesModel {

    public function loadCreatures() {
        $file = DATA_PATH . 'Creatures.csv';
        $creatures = array();

        if (!file_exists($file)) {
            return $creatures;
        }

        if (($handle = fopen($file, 'r')) !== false) {

            // Lire la première ligne brute (en-têtes)
            $firstLine = fgets($handle);

            // Détecter automatiquement le séparateur
            $delimiter = (strpos($firstLine, ';') !== false) ? ';' : ',';

            // Extraire les en-têtes
            $headers = str_getcsv($firstLine, $delimiter);

            // Normaliser les en-têtes : trim + lowercase
            foreach ($headers as &$h) {
                $h = strtolower(trim($h));
            }
            unset($h);

            // On s'attend à trouver : name, blueprint path
            $idx = array_flip($headers);

            if (!isset($idx['name']) || !isset($idx['blueprint path'])) {
                fclose($handle);
                return $creatures;
            }

            // Lire les lignes suivantes
            while (($line = fgets($handle)) !== false) {

                $row = str_getcsv($line, $delimiter);
                if (!$row) continue;

                // Nettoyage
                foreach ($row as &$v) {
                    $v = trim($v);
                }
                unset($v);

                // Récupération des colonnes
                $name  = isset($row[$idx['name']]) ? $row[$idx['name']] : '';
                $bpRaw = isset($row[$idx['blueprint path']]) ? $row[$idx['blueprint path']] : '';

                if ($name === '' || $bpRaw === '') continue;

				// Extraction du blueprint propre
				if (preg_match("#Blueprint'([^']+)'#i", $bpRaw, $m)) {
					$bp = $m[1];
				} else {
					// fallback : on nettoie les guillemets/espaces éventuels
					$bp = trim($bpRaw, " \t\n\r\"'");
				}

				// Ajout du suffixe _C si absent
				if (substr($bp, -2) !== '_C') {
					$bp .= '_C';
				}

                $creatures[] = array(
                    'name' => $name,
                    'bp'   => $bp
                );
            }

            fclose($handle);
        }

        return $creatures;
    }
}
