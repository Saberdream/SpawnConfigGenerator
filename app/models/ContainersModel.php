<?php
namespace ArkTools\ArkGenerator\Models;

use ArkTools\ArkGenerator\Config\Config;

class ContainersModel {

    public function loadContainers() {
        $file = Config::DATA_PATH . 'Containers.txt';
        $containers = [];

        if (!file_exists($file)) return $containers;

        $lines = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

        foreach ($lines as $line) {
            $line = trim($line);
            if ($line !== '') {
                $containers[] = $line;
            }
        }

		$containers_clean = array_unique($containers);
		sort($containers_clean);

        return $containers_clean;
    }
}
