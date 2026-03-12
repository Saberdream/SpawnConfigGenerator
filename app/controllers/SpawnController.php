<?php
require_once MODEL_PATH . 'CreaturesModel.php';
require_once MODEL_PATH . 'ContainersModel.php';

class SpawnController {

    public function index() {
        $creaturesModel = new CreaturesModel();
        $containersModel = new ContainersModel();

        $creatures = $creaturesModel->loadCreatures();
        $containers = $containersModel->loadContainers();

        require VIEW_PATH . 'spawn_view.php';
    }
}
