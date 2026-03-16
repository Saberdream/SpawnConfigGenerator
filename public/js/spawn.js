var dinoIndex = 0;

function addClusterRow(data = null) {
    var id = "dino_" + dinoIndex++;
	var weight = data ? data.weight : 0.1;
	var radius = data ? data.radius : 3000;
	var maxpct = data ? data.maxpct : 0.05;
	let clusterName = data && data.name ? data.name : generateClusterName();

    var html =
        '<div class="row dino-row" id="'+id+'">' +
            '<div class="col-sm-2">' +
                '<span class="drag-handle" style="cursor:move;">☰</span> ' +
                '<label>Cluster</label>' +
                '<input type="text" class="form-control cluster-name" value="'+clusterName+'">' +
            '</div>' +
            '<div class="col-sm-4">' +
                '<label>Dinos</label>' +
				' <span class="entry-preview"></span>' +
                '<input class="dino-tags" id="cluster_dinos">' +
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
                '<label>Max%</label>' +
                '<input type="number" class="form-control dino-maxpct" value="'+maxpct+'" step="0.01">' +
            '</div>' +
			'<div class="dino-rows col-sm-12">' +
				'<div class="dino-names col-sm-3"></div>' +
				'<div class="cluster-chances col-sm-3"></div>' +
				'<div class="cluster-offsets col-sm-3"></div>' +
			'</div>' +
            '<div class="col-sm-12" style="margin-top:5px;">' +
                '<button class="btn btn-danger btn-xs remove-dino">Supprimer</button>' +
            '</div>' +
        '</div>';

    $("#dinosContainer").append(html);

	$("#"+id+" .dino-tags").tagit({
		allowSpaces: false,
		autocomplete: { source: CREATURES.map(c => c.name) },
		allowDuplicates: true,
		afterTagAdded: function(event, ui) {
			addDinoRow(id, ui.tagLabel);
			updateEntryNames();
			autoGenerate();
		},
		afterTagRemoved: function(event, ui) {
			removeDinoRow(id, ui.tagLabel);
			updateEntryNames();
			autoGenerate();
		}
	});

	updateEntryNames();
	autoGenerate();
	return id;
}

function addDinoRow(rowId, name) {
	    let uniqueId = name + "_" + Date.now() + "_" + Math.floor(Math.random()*10000);
	// name + dino icon
	var spriteUrl = getDinoIconUrl(name);
	$("#"+rowId+" .dino-names").append(
		'<div class="name-item" data-id="'+uniqueId+'" data-name="'+name+'">'+
			'<img class="dino-icon" src="'+spriteUrl+'" /> '+
			'<label>'+name+'</label>'+
		'</div>'
	);
	// chance field
    $("#"+rowId+" .cluster-chances").append(
        '<div class="chance-item" data-id="'+uniqueId+'">'+
            '<input type="number" class="form-control cluster-chance" placeholder="'+name+' chance" step="0.01">'+
        '</div>'
    );
	// offsets field
    $("#"+rowId+" .cluster-offsets").append(
        '<div class="offset-item" data-id="'+uniqueId+'">'+
            '<input type="text" class="form-control cluster-offset" placeholder="'+name+' offsets: x,y,z">'+
        '</div>'
    );
	$(document).on("input change", ".cluster-chance, .cluster-offset", autoGenerate);
}

function removeDinoRow(rowId, name) {
    let item = $("#"+rowId+" .name-item[data-name='"+name+"']").first();
    let id = item.data("id");

    item.remove();
    $("#"+rowId+" .chance-item[data-id='"+id+"']").remove();
    $("#"+rowId+" .offset-item[data-id='"+id+"']").remove();
}

function generateClusterName() {
    let base = "Spawn";
    let count = $(".dino-row").length+1;
    return count === 1 ? base : base + " " + count;
}

function updateEntryNames() {
    $(".dino-row").each(function() {
        let names = $(this).find(".dino-tags").tagit("assignedTags");
        $(this).find(".entry-preview").text(names.join(", "));
    });
}

function generateConfig() {
	var container = $("#containerSelect").val();
	var entries = [];
	var limits = [];
	var limitsMap = {};

	$(".dino-row").each(function() {
		let clusterName = $(this).find(".cluster-name").val();
		let weight = $(this).find(".dino-weight").val();
		let radius = $(this).find(".dino-radius").val();
		let maxpct = $(this).find(".dino-maxpct").val();
		
		let dinos = [];
        $(this).find(".name-item").each(function() {
			let id = $(this).data("id");
            let name = $(this).data("name");
            let bp = CREATURES.find(c => c.name === name).bp;
            let chance = $(this).closest(".dino-row").find('.chance-item[data-id="'+id+'"] .cluster-chance').val();
            let offsets = $(this).closest(".dino-row").find('.offset-item[data-id="'+id+'"] .cluster-offset').val();
            dinos.push({bp, chance, offsets });
        });

        dinos.forEach(d => {
            if (!(d.bp in limitsMap)) {
                limitsMap[d.bp] = maxpct;
            }
        });
		
		let bps = dinos.map(d => `"${d.bp}"`).join(",");
		let chanceList = dinos.map(d => d.chance ? parseFloat(d.chance) : 1);
        let hasChanceBlock = chanceList.some(c => c !== 1);
        let chanceBlock = hasChanceBlock ? ',NPCsToSpawnPercentageChance=(' + chanceList.join(",") + ')' : "";

        let offsetList = dinos
            .map(d => {
                if (!d.offsets || !d.offsets.includes(",")) return null;
                let parts = d.offsets.split(",").map(p => p.trim());
                if (parts.length !== 3) return null;
                let [x,y,z] = parts.map(parseFloat);
                if ([x,y,z].some(v => isNaN(v))) return null;
                return '(X='+x+',Y='+y+',Z='+z+')';
            }).filter(v => v !== null);

        let offsetBlock = offsetList.length > 0 ? ',NPCsSpawnOffsets=(' + offsetList.join(",") + ')' : "";

		entries.push(
			'(AnEntryName="'+clusterName+'",EntryWeight='+weight+
			',NPCsToSpawn=('+bps+')' +
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
	var clusters = [];

    $(".dino-row").each(function() {
		let dinos = [];

        $(this).find(".name-item").each(function() {
			let id = $(this).data("id");
            let name = $(this).data("name");
            let bp = CREATURES.find(c => c.name === name)?.bp || "";
            let chance = $(this).closest(".dino-row").find('.chance-item[data-id="'+id+'"] .cluster-chance').val();
            let offsets = $(this).closest(".dino-row").find('.offset-item[data-id="'+id+'"] .cluster-offset').val();
			dinos.push({ bp, chance, offsets });
		});

        clusters.push({
			name: $(this).find(".cluster-name").val(),
            weight: parseFloat($(this).find(".dino-weight").val()),
            radius: parseFloat($(this).find(".dino-radius").val()),
            maxpct: parseFloat($(this).find(".dino-maxpct").val()),
			dinos
        });
    });

    var payload = { container: container, clusters: clusters };
    var encoded = btoa(JSON.stringify(payload));
    $("#configLink").val(window.location.origin + window.location.pathname + "?data=" + encoded);
}

function isValidOffsets(str) {
    if (typeof str !== "string") return false;
	if (str.trim() === "") return false;
    const float = "-?\\d+(?:\\.\\d+)?";
    const regex = new RegExp("^\\s*" + float + "\\s*,\\s*" + float + "\\s*,\\s*" + float + "\\s*$");
    return regex.test(str);
}

function isValidClusterDino(d) {
    if (!d || typeof d !== "object") return false;
    if (typeof d.bp !== "string" || !d.bp.length) return false;

    if (d.chance !== undefined && d.chance !== null && d.chance !== "") {
        let c = parseFloat(d.chance);
        if (!isFinite(c) || c < 0) return false;
    }

    if (d.offsets !== undefined && d.offsets !== null && d.offsets !== "") {
        if (!isValidOffsets(d.offsets)) return false;
    }

    return true;
}

function isValidCluster(cluster) {
    if (!cluster || typeof cluster !== "object") return false;

    if (typeof cluster.weight !== "number" || !isFinite(cluster.weight) || cluster.weight <= 0)
        return false;

    if (typeof cluster.radius !== "number" || !isFinite(cluster.radius) || cluster.radius <= 0)
        return false;

    if (typeof cluster.maxpct !== "number" || !isFinite(cluster.maxpct) || cluster.maxpct < 0)
        return false;

    if (!Array.isArray(cluster.dinos) || cluster.dinos.length === 0)
        return false;

    for (let d of cluster.dinos) {
        if (!isValidClusterDino(d)) return false;
    }

    return true;
}

function loadFromUrl() {
	const params = new URLSearchParams(window.location.search);
	if (!params.has("data")) return;

	try {
		const decoded = JSON.parse(atob(params.get("data")));

        if (typeof decoded.container === "string") {
            $("#containerSelect").val(decoded.container);
        }

		$("#dinosContainer").empty();
		dinoIndex = 0;

        if (Array.isArray(decoded.clusters)) {
			decoded.clusters.forEach(cluster => {
				if (isValidCluster(cluster)) {
					let rowId = addClusterRow(cluster);

					$("#"+rowId+" .cluster-name").val(cluster.name);

					cluster.dinos.forEach(d => {
						$("#"+rowId+" .dino-tags").tagit("createTag", CREATURES.find(c => c.bp === d.bp).name);
					});

					cluster.dinos.forEach(d => {
						let name = CREATURES.find(c => c.bp === d.bp).name;
						let id = $("#"+rowId+" .name-item[data-name='"+name+"']").last().data("id");
						$("#"+rowId+' .chance-item[data-id="'+id+'"] .cluster-chance').val(d.chance);
						$("#"+rowId+' .offset-item[data-id="'+id+'"] .cluster-offset').val(d.offsets);
					});
				}
				else {
                    console.warn("Cluster invalide ignoré :", cluster);
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
		addClusterRow();
	});
    addClusterRow();

    $("#dinosContainer").on("click", ".remove-dino", function() {
        $(this).closest(".dino-row").remove();
		autoGenerate();
    });

    $("#generateBtn").click(generateConfig);

	const autoFields = [
		"#containerSelect",
		'.cluster-name',
		".dino-weight",
		".dino-maxpct",
		".dino-radius"
	];

	autoFields.forEach(selector => {
		$(document).on("input change", selector, autoGenerate);
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
