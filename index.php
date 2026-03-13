<?php
require __DIR__ . '/vendor/autoload.php';

use ArkTools\ArkGenerator\Controllers\SpawnController;

$controller = new SpawnController();
$controller->index();
