var dinoIndex = 0;

function addDinoRow() {
    var id = "dino_" + dinoIndex++;

    var options = '<option value="">-- Choisir --</option>';
    CREATURES.forEach(function(c) {
        options += '<option value="'+c.bp+'" data-name="'+c.name+'">'+c.name+'</option>';
    });

    var html =
        '<div class="row dino-row" id="'+id+'">' +
            '<div class="col-sm-3">' +
                '<span class="drag-handle" style="cursor:move;">☰</span> <label>Dino</label> <span class="entry-preview"></span>' +
				' <img class="dino-icon" src="" style="display:none;">' +
                '<select class="form-control dino-select">'+options+'</select>' +
            '</div>' +
            '<div class="col-sm-2">' +
                '<label>Poids</label>' +
                '<input type="number" class="form-control dino-weight" value="0.1" step="0.0001">' +
            '</div>' +
            '<div class="col-sm-2">' +
                '<label>Radius</label>' +
                '<input type="number" class="form-control dino-radius" value="3000">' +
            '</div>' +
            '<div class="col-sm-2">' +
                '<label>Chance min</label>' +
                '<input type="number" class="form-control dino-chance-min" value="1" step="0.01">' +
            '</div>' +
            '<div class="col-sm-2">' +
                '<label>Chance max</label>' +
                '<input type="number" class="form-control dino-chance-max" value="1" step="0.01">' +
            '</div>' +
            '<div class="col-sm-1">' +
                '<label>Max%</label>' +
                '<input type="number" class="form-control dino-maxpct" value="0.05" step="0.01">' +
            '</div>' +
            '<div class="col-sm-12" style="margin-top:5px;">' +
                '<button class="btn btn-danger btn-xs remove-dino">Supprimer</button>' +
            '</div>' +
        '</div>';

    $("#dinosContainer").append(html);

	updateEntryNames();
	autoGenerate();
}

function updateEntryNames() {
    var counts = {};

    $(".dino-row").each(function() {
        var name = $(this).find(".dino-select option:selected").data("name");
        if (!name) return;

        if (!counts[name]) counts[name] = 1;
        else counts[name]++;

        var entryName = (counts[name] === 1) ? name : name + " " + counts[name];
        $(this).find(".entry-preview").text(entryName);
    });
}

function generateConfig() {
	var container = $("#containerSelect").val();
	var entries = [];
	var limits = [];

	var limitsMap = {};
	var nameCount = {};

	$(".dino-row").each(function() {
		var bp = $(this).find(".dino-select").val();
		if (!bp) return;

		var name = $(this).find(".dino-select option:selected").data("name");
		var weight = $(this).find(".dino-weight").val();
		var radius = $(this).find(".dino-radius").val();
		var chanceMin = $(this).find(".dino-chance-min").val();
		var chanceMax = $(this).find(".dino-chance-max").val();
		var maxpct = $(this).find(".dino-maxpct").val();

		var entryName = name;

		if (nameCount[name]) {
			nameCount[name]++;
			entryName = name + " " + nameCount[name];
		} else {
			nameCount[name] = 1;
		}

		if (!(bp in limitsMap)) {
			limitsMap[bp] = maxpct;
		}

		if (!(chanceMin == 1 && chanceMax == 1)) {
			entries.push(
				'(AnEntryName="'+entryName+'",EntryWeight='+weight+
				',NPCsToSpawn=("'+bp+'"),NPCsToSpawnPercentageChance=('+chanceMin+','+chanceMax+')'+
				',ManualSpawnPointSpreadRadius='+radius+')'
			);
		}
		else {
			entries.push(
				'(AnEntryName="'+entryName+'",EntryWeight='+weight+
				',NPCsToSpawn=("'+bp+'")'+
				',ManualSpawnPointSpreadRadius='+radius+')'
			);
		}
	});

	var limits = [];
	for (var bp in limitsMap) {
		limits.push('(NPCClass="' + bp + '",MaxPercentageOfDesiredNumToAllow=' + limitsMap[bp] + ')');
	}

	var out =
		'ConfigAddNPCSpawnEntriesContainer=(\n' +
		'\tNPCSpawnEntriesContainerClassString="'+container+'",\n' +
		'\tNPCSpawnEntries=(\n\t\t' +
			entries.join(",\n\t\t") +
		'\n\t),\n' +
		'\tNPCSpawnLimits=(\n\t\t' +
			limits.join(",\n\t\t") +
		'\n\t)\n' +
		')';

	var out_compact =
		'ConfigAddNPCSpawnEntriesContainer=(' +
		'NPCSpawnEntriesContainerClassString="'+container+'",' +
		'NPCSpawnEntries=(' + entries.join(",") + '),' +
		'NPCSpawnLimits=(' + limits.join(",") + ')' +
		')';

	$("#output").text(out);
	$("#outputCompact").text(out_compact);
}

let autoGenTimer = null;

function autoGenerate() {
    clearTimeout(autoGenTimer);
    autoGenTimer = setTimeout(generateConfig, 150);
}

function getDinoIconUrl(name) {
    if (!name) return "";

    // Normalisation : espaces → underscores
    let file = name.trim().replace(/\s+/g, "_");

    // URL du wiki
    return "https://ark.wiki.gg/images/thumb/" + file + ".png/30px-" + file + ".png";
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(function() {
        console.log("Copié !");
    }).catch(function(err) {
        console.error("Erreur de copie :", err);
    });
}

function flashCopied(btn) {
    let original = btn.text();
    btn.text("Copié !");
    setTimeout(() => btn.text(original), 1000);
}

$(function() {
    $("#addDino").click(addDinoRow);
    addDinoRow();

    $("#dinosContainer").on("click", ".remove-dino", function() {
        $(this).closest(".dino-row").remove();
    });

    $("#generateBtn").click(generateConfig);

	// Tous les champs qui doivent juste déclencher autoGenerate()
	const autoFields = [
		"#containerSelect",
		".dino-weight",
		".dino-maxpct",
		".dino-chance-min",
		".dino-chance-max",
		".dino-radius"
	];

	// On attache autoGenerate() à tous ces champs d'un coup
	autoFields.forEach(selector => {
		$(document).on("input change", selector, autoGenerate);
	});

	// Cas particulier : changement de dino → updateEntryNames() + autoGenerate()
	$(document).on("change", ".dino-select", function () {
		updateEntryNames();
		autoGenerate();

		let name = $(this).find("option:selected").data("name");
		let url = getDinoIconUrl(name);

		let img = $(this).closest(".dino-row").find(".dino-icon");
		img.attr("src", url).show();
	});

	$("#copyReadable").click(function() {
		copyToClipboard($("#output").text());
		flashCopied($(this));
	});

	$("#copyCompact").click(function() {
		copyToClipboard($("#outputCompact").text());
		flashCopied($(this));
	});

	$("#dinosContainer").sortable({
		items: ".dino-row",
		handle: ".drag-handle",
		axis: "y",
		update: function() {
			updateEntryNames();
			autoGenerate();
		}
	});
});
