<?php
require_once __DIR__ . '/config/config.php';
require_once __DIR__ . '/app/controllers/SpawnController.php';

$controller = new SpawnController();
$controller->index();
