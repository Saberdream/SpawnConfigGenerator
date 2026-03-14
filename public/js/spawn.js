var dinoIndex = 0;

function addDinoRow(data = null) {
    var id = "dino_" + dinoIndex++;

    var options = '<option value="">-- Choisir --</option>';
    CREATURES.forEach(function(c) {
        options += '<option value="'+c.bp+'" data-name="'+c.name+'">'+c.name+'</option>';
    });

	var weight = data ? data.weight : 0.1;
	var radius = data ? data.radius : 3000;
	var chance = data ? data.chance : 1;
	var offsets = data ? data.offsets : "";
	var maxpct = data ? data.maxpct : 0.05;
	var bp = data ? data.bp : "";

    var html =
        '<div class="row dino-row" id="'+id+'">' +
            '<div class="col-sm-3">' +
                '<span class="drag-handle" style="cursor:move;">☰</span> ' +
				'<label>Dino</label> <span class="entry-preview"></span>' +
				' <img class="dino-icon" src="" style="display:none;">' +
                '<select class="form-control dino-select">'+options+'</select>' +
            '</div>' +
            '<div class="col-sm-2">' +
                '<label>Poids</label>' +
                '<input type="number" class="form-control dino-weight" value="'+weight+'" step="0.0001">' +
            '</div>' +
            '<div class="col-sm-2">' +
                '<label>Radius</label>' +
                '<input type="number" class="form-control dino-radius" value="'+radius+'">' +
            '</div>' +
            '<div class="col-sm-2">' +
                '<label>Chance (%)</label>' +
                '<input type="number" class="form-control dino-chance" value="'+chance+'" step="0.01">' +
            '</div>' +
            '<div class="col-sm-2">' +
                '<label>Offsets (x,y,z)</label>' +
                '<input type="text" class="form-control dino-offsets" value="'+offsets+'" placeholder="ex: 500,200,0">' +
            '</div>' +
            '<div class="col-sm-1">' +
                '<label>Max%</label>' +
                '<input type="number" class="form-control dino-maxpct" value="'+maxpct+'" step="0.01">' +
            '</div>' +
            '<div class="col-sm-12" style="margin-top:5px;">' +
                '<button class="btn btn-danger btn-xs remove-dino">Supprimer</button>' +
            '</div>' +
        '</div>';

    $("#dinosContainer").append(html);

	if (bp) {
		$("#"+id).find(".dino-select").val(bp).trigger("change");
	}

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
		var chance = $(this).find(".dino-chance").val();
		var offsets = $(this).find(".dino-offsets").val();
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

		let offsetBlock = "";
		if (offsets && offsets.includes(",")) {
			let parts = offsets.split(",").map(p => p.trim());
			if (parts.length === 3) {
				let x = parseFloat(parts[0]);
				let y = parseFloat(parts[1]);
				let z = parseFloat(parts[2]);
				if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
					offsetBlock = ',NPCsSpawnOffsets=((X=' + x + ',Y=' + y + ',Z=' + z + '))';
				}
			}
		}

		let chanceBlock = "";
		if (!(chance == 1)) {
			chanceBlock = ',NPCsToSpawnPercentageChance=('+chance+')';
		}

		entries.push(
			'(AnEntryName="'+entryName+'",EntryWeight='+weight+
			',NPCsToSpawn=("'+bp+'")' +
			offsetBlock +
			chanceBlock +
			',ManualSpawnPointSpreadRadius='+radius+')'
		);
	});

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
    autoGenTimer = setTimeout(function() {
        generateConfig();
        updateShareUrl();
    }, 150);
}

function getDinoIconUrl(name) {
    if (!name) return "";

    let file = name.trim().replace(/\s+/g, "_");

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

function updateShareUrl() {
    var container = $("#containerSelect").val();

    var dinos = [];

    $(".dino-row").each(function() {
        var bp = $(this).find(".dino-select").val();
        if (!bp) return;

        dinos.push({
            bp: bp,
            weight: parseFloat($(this).find(".dino-weight").val()),
            radius: parseFloat($(this).find(".dino-radius").val()),
            chance: parseFloat($(this).find(".dino-chance").val()),
            offsets: $(this).find(".dino-offsets").val(),
            maxpct: parseFloat($(this).find(".dino-maxpct").val())
        });
    });

    var payload = {
        container: container,
        dinos: dinos
    };

    var encoded = btoa(JSON.stringify(payload));

    $("#configLink").val(window.location.origin + window.location.pathname + "?data=" + encoded);
}

function isValidOffsets(str) {
    if (typeof str !== "string") return false;
    return /^\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?\s*$/.test(str);
}

function isValidDinoData(d) {
    if (!d || typeof d !== "object") return false;
    if (typeof d.bp !== "string" || !d.bp.length) return false;
    if (typeof d.weight !== "number" || !isFinite(d.weight) || d.weight <= 0) return false;
    if (typeof d.radius !== "number" || !isFinite(d.radius) || d.radius <= 0) return false;
    if (typeof d.maxpct !== "number" || !isFinite(d.maxpct) || d.maxpct < 0) return false;
    if (d.chance !== undefined && d.chance !== null && d.chance !== "") {
        if (typeof d.chance !== "number" || !isFinite(d.chance) || d.chance < 0) return false;
    }
    if (d.offsets !== undefined && d.offsets !== null && d.offsets !== "") {
        if (!isValidOffsets(d.offsets)) return false;
    }
    return true;
}

function loadFromUrl() {
	var params = new URLSearchParams(window.location.search);
	if (!params.has("data")) return;

	try {
		var decoded = JSON.parse(atob(params.get("data")));

        if (typeof decoded.container === "string") {
            $("#containerSelect").val(decoded.container);
        }

		$("#dinosContainer").empty();
		dinoIndex = 0;

        if (Array.isArray(decoded.dinos)) {
            decoded.dinos.forEach(d => {
                if (isValidDinoData(d)) {
                    addDinoRow(d);
                } else {
                    console.warn("Données de dino invalides ignorées :", d);
                }
            });
        }

		updateEntryNames();
		generateConfig();
		updateShareUrl();
	}
	catch(e) {
		console.error("Erreur de parsing URL :", e);
	}
}

$(function() {
    $("#addDino").click(function() {
		addDinoRow();
	});
    addDinoRow();

    $("#dinosContainer").on("click", ".remove-dino", function() {
        $(this).closest(".dino-row").remove();
		autoGenerate();
    });

    $("#generateBtn").click(generateConfig);

	const autoFields = [
		"#containerSelect",
		".dino-weight",
		".dino-maxpct",
		".dino-chance",
		".dino-offsets",
		".dino-radius"
	];

	autoFields.forEach(selector => {
		$(document).on("input change", selector, autoGenerate);
	});

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

	$("#copyConfigLink").click(function() {
		copyToClipboard($("#configLink").val());
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

	loadFromUrl();
});
