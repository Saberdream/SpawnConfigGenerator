<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Générateur de spawn ARK</title>

    <link rel="stylesheet" href="<?= $baseUrl ?>public/vendor/bootstrap/css/bootstrap.min.css">
	<link rel="stylesheet" href="<?= $baseUrl ?>public/vendor/jquery-ui.min.css">
	<link rel="stylesheet" href="<?= $baseUrl ?>public/vendor/jquery.tagit.css">
    <script src="<?= $baseUrl ?>public/vendor/jquery.min.js"></script>
    <script src="<?= $baseUrl ?>public/vendor/jquery-ui.min.js"></script>
	<script src="<?= $baseUrl ?>public/vendor/tag-it.min.js"></script>

    <script>
        var CREATURES = <?php echo json_encode($creatures, JSON_UNESCAPED_SLASHES); ?>;
    </script>

    <script src="<?= $baseUrl ?>public/js/spawn.js"></script>

    <style>
        body { padding: 20px; }
        pre { white-space: pre; font-family: monospace; }
        .dino-row { margin-bottom: 10px; }
		.dino-icon { margin-bottom: 6px; padding: 2px; vertical-align: middle;width: 30px; height: 30px; border: 2px solid #4ec3ff; border-radius: 4px; box-shadow: 0 0 6px #4ec3ff; }
		pre { background:#f7f7f7; color:#333; padding:12px 16px; border-radius:6px; overflow:auto; font-size:14px; line-height:1.4; }
    </style>
</head>

<body>
<div class="container">

    <h2>Générateur de configuration de spawn ARK</h2>

	<div class="alert alert-info" style="margin-top:20px;">
		<h4>A lire pour utiliser le générateur de configuration de Spawn ASA :</h4>

		<p>
			Ce générateur de configuration INI crée automatiquement une directive <strong>ConfigAddNPCSpawnEntriesContainer</strong>
			qui ajoute des points de spawn dans un conteneur donné de la map (par exemple le biome neigeux ou montagne).
			Le générateur permet aussi d'ajouter des groupes de dinos (appelés <strong>clusters</strong>) dans un conteneur :
			en ajoutant plusieurs dinos dans la même entrée, les dinos de l'entrée pourront spawn en même temps selon les probabilités de spawn fixées.
			Il ne remplace pas les dinos existants du conteneur, sauf si vous utilisez des poids très élevés (ex : 1).
		</p>

		<p>
			Pour chaque entrée de Spawn, vous pouvez indiquer :
		</p>
		<ul>
			<li><strong>un poids</strong> : valeur relative aux autres dinos du conteneur</li>
			<li><strong>un taux maximum</strong> : limite maximale du nombre de dinos de ce type dans le conteneur (ex. 0.05 = 5%).
			Important : si vous ajoutez plusieurs fois le même dino dans un conteneur, seule la <strong>première valeur Max</strong>
			sera prise en compte. En effet, la limite Max est globale au conteneur : si le taux est atteint, le dino ne spawnera plus.</li>
			<li><strong>un rayon de dispersion</strong> (radius) : c'est la zone autour du point de spawn dans laquelle le cluster de dinos peut apparaître.
			Un rayon élevé disperse les dinos et donne un spawn plus naturel. Un radiant faible à l'inverse crée des clusters.</li>
		</ul>

		<p>
			Pour chaque dino d'une entrée, vous pouvez indiquer :
		</p>
		<ul>
			<li><strong>un offset</strong> : décalage du point d’apparition par rapport au point de spawn (optionnel).
			Permet de créer des groupes dispersés ou des formations précises.</li>
			<li><strong>une probabilité de spawn</strong> : probabilité relative d’apparition du dino à l’intérieur du cluster (optionnelle, par défaut 1 = 100%)</li>
		</ul>

		<h5>Points techniques importants :</h5>
		<ul>
			<li>
				Un même conteneur ne peut être modifié qu’une seule fois dans le <strong>game.ini</strong>.
				Toute directive suivante visant le même conteneur sera ignorée.
				Vous devez donc regrouper tous les dinos d’un conteneur dans une seule ligne.
			</li>
			<li>
				Les dinos naturels d’ARK ont souvent des poids très faibles (&lt; 0.1) mais une probabilité de spawn de 100%.
				Pour augmenter légèrement le spawn d’un dino, ajoutez-le une ou plusieurs fois avec un poids faible
				(0.05–1) et une probabilité de 1.
			</li>
			<li>
				Même un poids faible peut provoquer un overspawn si le radiant est trop petit.
			</li>
		</ul>

		<h5>Ajout de plusieurs conteneurs</h5>
		
		<p>
			L'ajout de la configuration générée doit se faire dans le fichier Game.ini directement sous la ligne [script...].
		</p>
		
		<p>
			Si vous souhaitez modifier plusieurs conteneurs de spawn différents (par exemple : neige, montagne, marais, grotte…),
			vous devez ajouter une directive complète par conteneur, l’une à la suite de l’autre dans votre Game.ini.
			Chaque conteneur doit avoir sa propre ligne ConfigAddNPCSpawnEntriesContainer, par exemple :
		</p>
		<pre><code># Conteneur 1 : Ice Cave
ConfigAddNPCSpawnEntriesContainer=(NPCSpawnEntriesContainerClassString="DinoSpawnEntriesIceCave_C",...)
# Conteneur 2 : Snow
ConfigAddNPCSpawnEntriesContainer=(NPCSpawnEntriesContainerClassString="DinoSpawnEntriesSnow_C",...)
# Conteneur 3 : Mountain
ConfigAddNPCSpawnEntriesContainer=(NPCSpawnEntriesContainerClassString="DinoSpawnEntriesMountain_C",...)</code></pre>

	</div>

    <div class="form-group">
        <label>Conteneur de spawn</label>
        <select id="containerSelect" class="form-control">
            <?php foreach ($containers as $c): ?>
                <option value="<?= htmlspecialchars($c) ?>"><?= htmlspecialchars($c) ?></option>
            <?php endforeach; ?>
        </select>
    </div>

    <hr>

    <h4>Spawns</h4>
    <div id="dinosContainer"></div>

    <button id="addDino" class="btn btn-primary">Ajouter un spawn</button>
    <button id="generateBtn" class="btn btn-success">Générer</button>

    <hr>

    <h3>Configuration générée</h3>
	<p><button id="copyReadable" class="btn btn-primary btn-sm">Copier</button></p>
    <pre id="output"></pre>

	<h3>Version compacte</h3>
	<p><button id="copyCompact" class="btn btn-primary btn-sm">Copier</button></p>
	<pre id="outputCompact"></pre>

	<h3>Lien de partage</h3>
	<p><button id="copyConfigLink" class="btn btn-primary btn-sm">Copier le lien</button></p>
	<input id="configLink" class="form-control" readonly>

</div>
</body>
</html>