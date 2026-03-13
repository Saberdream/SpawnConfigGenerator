<?php
namespace ArkTools\ArkGenerator\Controllers;

use ArkTools\ArkGenerator\Models\CreaturesModel;
use ArkTools\ArkGenerator\Models\ContainersModel;
use ArkTools\ArkGenerator\Config\Config;

class SpawnController {

    public function index() {
        $creaturesModel = new CreaturesModel();
        $containersModel = new ContainersModel();

        $creatures = $creaturesModel->loadCreatures();
        $containers = $containersModel->loadContainers();

		$baseUrl = Config::BASE_URL;

        require Config::VIEW_PATH . 'spawn_view.php';
    }
}
