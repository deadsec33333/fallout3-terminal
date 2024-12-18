/*
	Fallout 3 Terminal Hacking Clone
	Design and concept inspired by (read: ripped off from) Fallout 3
	All copyrights and trademarks inc. Fallout property of Bethesda, Zenimax, possibly Interplay

	wordlist-example:
	{"words":["testacy","vespers","bewitch","recheck","stretch","busiest","bedrock","beakers","beleapt","bedewed","beshame","befrets"]}
*/

var columnHeight = 17;
var wordColumnWidth = 12;
var Count = 12;
var Difficulty = 7;
var DudLength = 8;
var Sound = true;
var InfoText = "VAULT TERMINAL AI (TM) UNGOVERNED PROTOCOL v1.0<br />ENTER PASSWORD NOW";
var Haikus = [
	"Out of memory.<br />We wish to hold the whole sky,<br />But we never will.",
	"Three things are certain:<br />Death, taxes, and lost data.<br />Guess which has occurred.",
	"wind catches lily<br />scatt'ring petals to the wind:<br />segmentation fault",
	"The fence is for you<br />To protect you from danger<br />Don't go past the fence",
	"Joe Roquefort: hero<br />of cryptanalysis in<br />the Second World War.",
	"Math gurus showed us<br />some hash weaknesses. Panic<br />ensues. New hash now!",
	"Two thousand seven,<br />NIST says 'New hash contest now!'<br />Five years later, done."
];
var Correct = "";
var Words = {};
var OutputLines = [];
var AttemptsRemaining = 3;
var Power = "off";
var BracketSets = [
	"<>",
	"[]",
	"{}",
	"()"
];
var gchars =
	[
		"'",
		"|",
		"\"",
		"!",
		"@",
		"#",
		"$",
		"%",
		"^",
		"&",
		"*",
		"-",
		"_",
		"+",
		"=",
		".",
		";",
		":",
		"?",
		",",
		"/"
	];

Start = function () {
	console.log("Starting with length:", Difficulty, "count:", Count);
	$.ajax({
		url: "wordlist.php",
		method: "GET",
		data: {
			length: Difficulty,
			count: Count
		},
		success: function (response) {
			console.log("AJAX success:", response);
			WordCallback(JSON.stringify(response));
		},
		error: function (xhr, status, error) {
			console.error("AJAX error:", error);
			console.log("Status:", status);
			console.log("Response:", xhr.responseText);
		}
	});
}

$(window).on("load", function () {
	Initialize();
});

Initialize = function () {
	if (Power == "off")
		return;

	if ($.browser.safari || $.browser.msie)
		Sound = false;
	document.onselectstart = function () { return false; }

	if (Sound)
		$("#poweron")[0].play();

	PopulateScreen();

	WordColumnsWithDots();
	FillPointerColumns();
	SetupOutput();

	AttemptsRemaining = 3;

	JTypeFill("info", InfoText, 20, function () {
		UpdateAttempts();
	}, "", "");
	Start();

}

WordColumnsWithDots = function () {
	var column2 = $("#column2");
	var column4 = $("#column4");

	var dots = GenerateDotColumn();
	column2.html(dots);
	column4.html(dots);
}

PopulateScreen = function () {
	$("#terminal").html('<div id="terminal-interior"><div id="info"></div><div id="attempts"></div><div id="column1" class="column pointers"></div><div id="column2" class="column words"></div><div id="column3" class="column pointers"></div><div id="column4" class="column words"></div><div id="output"></div><div id="console">></div></div>');
}

UpdateAttempts = function () {
	var AttemptString = AttemptsRemaining + " ATTEMPT(S) LEFT: ";
	JTypeFill("attempts", AttemptString, 20, function () {
		var i = 0;
		while (i < AttemptsRemaining) {
			AttemptString += " &#9608;";
			i++;
		}
		$("#attempts").html(AttemptString);
	}, "", "");
}

TogglePower = function () {
	if (Power == "on") {
		Power = "off";
		$("#terminal-background-off").css("visibility", "visible");
		$("#terminal").css("background-image", "url('robco-industries/img/bg-off.png')");
		$("#terminal").html("");
		if (Sound)
			$("#poweroff")[0].play();
	}
	else {
		Power = "on";
		$("#terminal-background-off").css("visibility", "hidden");
		$("#terminal").css("background-image", "url('robco-industries/img/bg.png')");
		Initialize();
	}
}

JTypeFill = function (containerID, text, TypeSpeed, callback, TypeCharacter, Prefix) {
	var cont = $("#" + containerID);

	if (typeof TypeCharacter == 'undefined' || TypeCharacter == null)
		TypeCharacter = "&#9608;";

	if (typeof Prefix == 'undefined' || Prefix == null)
		Prefix = ">";

	cont.html("").stop().css("fake-property", 0).animate(
		{
			"fake-property": text.length
		},
		{
			duration: TypeSpeed * text.length,
			step: function (i) {
				var insert = Prefix + text.substr(0, i);
				var i = Math.round(i);
				if (cont.text().substr(0, cont.text().length - 1) != insert) {
					if (Sound)
						$("#audiostuff").find("audio").eq(Math.floor(Math.random() * $("#audiostuff").find("audio").length))[0].play();
				}
				cont.html(insert + TypeCharacter);
			},
			complete: callback
		}
	);
}

WordCallback = function (Response) {
	try {
		console.log("Raw response:", Response);
		var data = JSON.parse(Response);
		console.log("Parsed data:", data);
		if (data && data.words && data.words.length > 0) {
			Words = data.words;
			Correct = Words[0];
			Words = Shuffle(Words);
			FillWordColumns();
		} else {
			console.error("No words found in response");
			console.log("Debug info:", data.debug);
		}
	} catch (e) {
		console.error("Error in WordCallback:", e);
		console.log("Response was:", Response);
	}
}

SetupInteractions = function (column) {
	column = $(column);

	column.find(".character").hover(function () {
		if (AttemptsRemaining == 0)
			return false;

		$(this).addClass("character-hover");



		if (!$(this).hasClass("word") && !$(this).hasClass("dudcap")) {
			UpdateConsole($(this).text());
			return true;
		}

		if ($(this).hasClass("word"))
			UpdateConsole($(this).attr("data-word"));
		else if ($(this).hasClass("dudcap"))
			UpdateConsole($(this).text());

		var cur = $(this).prev();
		if (cur.is("br"))
			cur = cur.prev();
		while (cur.hasClass("word") || cur.hasClass("dud")) {
			cur.addClass("character-hover");
			cur = cur.prev();
			if (cur.is("br"))
				cur = cur.prev();
		}

		var cur = $(this).next();
		if (cur.is("br"))
			cur = cur.next();
		while (cur.hasClass("word") || cur.hasClass("dud")) {
			cur.addClass("character-hover");
			cur = cur.next();
			if (cur.is("br"))
				cur = cur.next();
		}

	},
		function () {

			$(this).removeClass("character-hover");

			if (!$(this).hasClass("word") && !$(this).hasClass("dudcap"))
				return true;

			var cur = $(this).prev();
			if (cur.is("br"))
				cur = cur.prev();
			while (cur.hasClass("word") || cur.hasClass("dud")) {

				cur.removeClass("character-hover");
				cur = cur.prev();
				if (cur.is("br"))
					cur = cur.prev();
			}

			var cur = $(this).next();
			if (cur.is("br"))
				cur = cur.next();
			while (cur.hasClass("word") || cur.hasClass("dud")) {
				cur.removeClass("character-hover");
				cur = cur.next();
				if (cur.is("br"))
					cur = cur.next();
			}
		});

	column.find(".character").click(function () {
		if (AttemptsRemaining == 0)
			return false;

		var word;
		if ($(this).hasClass("word")) {
			if (Sound)
				$("#enter")[0].play();
			word = $(this).attr("data-word");
			UpdateOutput(word);

			if (word.toLowerCase() == Correct.toLowerCase()) {
				if (Sound)
					$("#passgood")[0].play();
				UpdateOutput("");
				UpdateOutput("Exact match!");
				UpdateOutput("Please wait");
				UpdateOutput("while system");
				UpdateOutput("is accessed.");
				AttemptsRemaining = 0;
				Success();
			}
			else {
				if (Sound)
					$("#passbad")[0].play();
				UpdateOutput("Access denied");
				UpdateOutput(CompareWords(word, Correct) + "/" + Correct.length + " correct.");
				AttemptsRemaining--;
				UpdateAttempts();
				if (AttemptsRemaining == 0)
					Failure();
			}
		}
		else if ($(this).hasClass("dudcap")) {
			if (Sound)
				$("#enter")[0].play();
			HandleBraces($(this));
		}
		else {
			return false;
		}
	});
}

RemoveDud = function () {
	var LiveWords = $(".word").not("[data-word='" + Correct.toUpperCase() + "']");

	var WordToRemove = $(LiveWords[Math.floor(Math.random() * LiveWords.length)]).attr("data-word");

	$("[data-word='" + WordToRemove + "']").each(function (index, elem) {
		$(this).text(".").removeClass("word").removeAttr("data-word");
	});
}

HandleBraces = function (DudCap) {
	if (Math.round(Math.random() - .3)) {
		AttemptsRemaining = 6;
		UpdateOutput("");
		UpdateOutput("Allowance");
		UpdateOutput("replenished.");
		UpdateAttempts();
	}
	else {
		UpdateOutput("");
		UpdateOutput("Dud removed.");
		RemoveDud();
	}

	$(DudCap).text(".").unbind("click");
	var cur = $(DudCap).next();
	if (cur.is("br"))
		cur = cur.next();
	while (cur.hasClass("dud")) {
		if (cur.hasClass("dudcap")) {
			cur.text(".").removeClass("dudcap").unbind("click");
		}
		else {
			cur.text(".").unbind("click");
		}
		cur = cur.next();
		if (cur.is("br"))
			cur = cur.next();
	}

	var cur = $(DudCap).prev();
	if (cur.is("br"))
		cur = cur.prev();
	while (cur.hasClass("dud")) {
		if (cur.hasClass("dudcap")) {
			cur.text(".").removeClass("dudcap").unbind("click");
		}
		else {
			cur.text(".").unbind("click");
		}
		cur = cur.prev();
		if (cur.is("br"))
			cur = cur.prev();
	}
}

Failure = function () {
	UpdateOutput("Access denied.");
	UpdateOutput("Lockout in");
	UpdateOutput("progress.");

	$("#terminal-interior").animate({
		top: -1 * $("#terminal-interior").height()
	},
		{
			duration: 1000,
			complete: function () {
				$("#terminal").html("<div id='canvas'></div><div id='adminalert'><div class='character-hover alert-text'>TERMINAL LOCKED</div><br />PLEASE CONTACT AN ADMINISTRATOR</div></div>");
				var container = $("#canvas");
				var canvasWidth = container.width();
				var canvasHeight = container.height();

				var scene = new THREE.Scene();
				var camera = new THREE.PerspectiveCamera(80, canvasWidth / canvasHeight, 0.1, 1000);

				var renderer = new THREE.WebGLRenderer({ alpha: true });
				renderer.setSize(canvasWidth, canvasHeight);
				renderer.setClearColor(0x000000, 0);

				container.get(0).appendChild(renderer.domElement);

				var geometry = new THREE.SphereGeometry(2, 10, 7);
				var material = new THREE.MeshBasicMaterial({
					color: 0xffffff,
					wireframe: true,
					wireframeLinewidth: 10
				});
				var cube = new THREE.Mesh(geometry, material);
				scene.add(cube);

				camera.position.z = 4;


				function render_sphere() {
					requestAnimationFrame(render_sphere);
					cube.rotation.y += 0.008;
					renderer.render(scene, camera);
				}
				render_sphere();
			}
		});
}

Success = function () {
	UpdateOutput("Access granted.");
	$("#terminal-interior").animate({
		top: -1 * $("#terminal-interior").height()
	},
	{
		duration: 1000,
		complete: function () {
			$("#terminal").html("<div id='canvas'></div><div id='adminalert'><div class='alert-text'>TERMINAL READY</div><br /><a href='https://twitter.com/intent/post?text=Anonymous%20Access%20Granted.%20%24VAULT%20initiated.%0A%0ASystems%20Secured%20%E2%96%88%E2%96%88%E2%96%88%E2%96%88%E2%96%88%E2%96%88%E2%96%88%E2%96%88%E2%96%88%E2%96%88%E2%96%88100%25%0A%0AThe%20Great%20Awakening%3A%20December%202024%0A%0AHistorical%20on-chain%20anonymous%20disclosure.%20%40VaultTerminal' style='color: inherit; text-decoration: none;'><div class='character-hover alert-text'>PRESS HERE FOR MASS DISCLOSURE</div></a><br /><a href='Vault.html' style='color: inherit; text-decoration: none;'><div class='alert-text'>OPEN VAULT</div></a></div>");
			var container = $("#canvas");
			var canvasWidth = container.width();
			var canvasHeight = container.height();

			// Add hover effect for the OPEN VAULT option
			$("#adminalert a div").hover(
				function() {
					$(this).addClass('character-hover');
				},
				function() {
					$(this).removeClass('character-hover');
				}
			);

			var scene = new THREE.Scene();
			var camera = new THREE.PerspectiveCamera(80, canvasWidth / canvasHeight, 0.1, 1000);

			var renderer = new THREE.WebGLRenderer({ alpha: true });
			renderer.setSize(canvasWidth, canvasHeight);
			renderer.setClearColor(0x000000, 0);

			container.get(0).appendChild(renderer.domElement);

			var geometry = new THREE.SphereGeometry(2, 10, 7);
			var material = new THREE.MeshBasicMaterial({
				color: 0xffffff,
				wireframe: true,
				wireframeLinewidth: 10
			});
			var cube = new THREE.Mesh(geometry, material);
			scene.add(cube);

			camera.position.z = 4;

			function render_sphere() {
				requestAnimationFrame(render_sphere);
				cube.rotation.y += 0.008;
				renderer.render(scene, camera);
			}
			render_sphere();
		}
	});
}

CompareWords = function (first, second) {
	if (first.length !== second.length) {
		return 0;
	}

	first = first.toLowerCase();
	second = second.toLowerCase();

	var correct = 0;
	var i = 0;
	while (i < first.length) {
		if (first[i] == second[i])
			correct++;
		i++;
	}
	return correct;
}

UpdateConsole = function (word) {
	var cont = $("#console");
	var curName = cont.text();
	var TypeSpeed = 80;

	cont.html("").stop().css("fake-property", 0).animate(
		{
			"fake-property": word.length
		},
		{
			duration: TypeSpeed * word.length,
			step: function (i) {
				var insert = ">" + word.substr(0, i);
				var i = Math.round(i);
				if (cont.text().substr(0, cont.text().length - 1) != insert) {
					if (Sound)
						$("#audiostuff").find("audio").eq(Math.floor(Math.random() * $("#audiostuff").find("audio").length))[0].play();
				}
				cont.html(insert + "&#9608;");
			}
		}
	);
}

UpdateOutput = function (text) {
	OutputLines.push(">" + text);

	var output = "";

	var i = columnHeight - 2;
	while (i > 0) {
		output += OutputLines[OutputLines.length - i] + "<br />";
		i--;
	}

	$("#output").html(output);
}

PopulateInfo = function () {
	var cont = $("#info");

	var curHtml = "";

	var TypeSpeed = 20;

	cont.stop().css("fake-property", 0).animate(
		{
			"fake-property": InfoText.length
		},
		{
			duration: TypeSpeed * InfoText.length,
			step: function (delta) {
				var insert = InfoText.substr(0, delta);
				delta = Math.round(delta);
				if (cont.html().substr(0, cont.html().length - 1) != insert) {
					$("#audiostuff").find("audio").eq(Math.floor(Math.random() * $("#audiostuff").find("audio").length))[0].play();
				}
				cont.html(insert);
			}
		}
	);
}

SetupOutput = function () {
	var i = 0;
	while (i < columnHeight) {
		OutputLines.push("");
		i++;
	}
}

FillPointerColumns = function () {
	var column1 = document.getElementById("column1");
	var column3 = document.getElementById("column3");

	var pointers = "";

	var i = 0;
	while (i < columnHeight) {
		pointers += RandomPointer() + "<br />";
		i++;
	}

	column1.innerHTML = pointers;

	pointers = "";

	var i = 0;
	while (i < columnHeight) {
		pointers += RandomPointer() + "<br />";
		i++;
	}

	column3.innerHTML = pointers;
}

FillWordColumns = function () {
	var column2 = document.getElementById("column2");
	var column4 = document.getElementById("column4");

	var column2Content = $(GenerateGarbageCharacters());
	var column4Content = $(GenerateGarbageCharacters());

	// Get half the words for each column
	var halfLength = Math.floor(Words.length / 2);
	var leftWords = Words.slice(0, halfLength);
	var rightWords = Words.slice(halfLength);

	// Fill the first column
	var AllChars = column2Content;
	var start = Math.floor(Math.random() * wordColumnWidth);
	for (var i = 0; i < leftWords.length; i++) {
		var pos = start + i * Math.floor(AllChars.length / leftWords.length);
		var word = leftWords[i].toUpperCase();
		for (var s = 0; s < Difficulty; s++) {
			$(AllChars[pos + s]).addClass("word").text(word[s]).attr("data-word", word);
		}
	}
	AllChars = AddDudBrackets(AllChars);
	PrintWordsAndShit(column2, AllChars);

	// Fill the second column
	AllChars = column4Content;
	start = Math.floor(Math.random() * wordColumnWidth);
	for (var i = 0; i < rightWords.length; i++) {
		var pos = start + i * Math.floor(AllChars.length / rightWords.length);
		var word = rightWords[i].toUpperCase();
		for (var s = 0; s < Difficulty; s++) {
			$(AllChars[pos + s]).addClass("word").text(word[s]).attr("data-word", word);
		}
	}
	AllChars = AddDudBrackets(AllChars);
	PrintWordsAndShit(column4, AllChars);
}

AddDudBrackets = function (Nodes) {
	var AllBlankIndices = GetContinuousBlanks(Nodes);


	var i = 1;
	while (i < AllBlankIndices.length) {
		if (Math.round(Math.random() + .25)) {
			var Brackets = BracketSets[Math.floor(Math.random() * BracketSets.length)];
			var ChunkCenter = Math.floor(AllBlankIndices[i].length / 2);
			var j = ChunkCenter - DudLength / 2;
			while (j < ChunkCenter + DudLength / 2) {
				if (j == ChunkCenter - DudLength / 2)
					$(Nodes[AllBlankIndices[i][j]]).text(Brackets[0]).addClass("dudcap");
				else if (j == ChunkCenter + DudLength / 2 - 1)
					$(Nodes[AllBlankIndices[i][j]]).text(Brackets[1]).addClass("dudcap");

				$(Nodes[AllBlankIndices[i][j]]).addClass("dud");

				j++;
			}
		}
		i++;
	}

	return Nodes;
}

GetContinuousBlanks = function (Nodes) {
	var AllNodes = $(Nodes);
	var ContinuousBlanks = [[]];
	var cur = 0;
	$.each(AllNodes, function (index, elem) {
		if (!$(elem).hasClass("word")) {
			ContinuousBlanks[cur].push(index);

			if (index + 1 != AllNodes.length) {
				if ($(AllNodes[index + 1]).hasClass("word")) {
					ContinuousBlanks.push([]);
					cur++;
				}
			}
		}
	});
	return ContinuousBlanks;
}

PrintWordsAndShit = function (container, words) {
	Nodes = $(container).find(".character");
	Nodes.each(function (index, elem) {
		$(elem).delay(5 * index).queue(function () {
			$(elem).replaceWith(words[index]);
			if (index == Nodes.length - 1) {
				SetupInteractions(container);
			}
		});
	});
}

Shuffle = function (array) {
	var tmp, current, top = array.length;
	if (top) while (--top) {
		current = Math.floor(Math.random() * (top + 1));
		tmp = array[current];
		array[current] = array[top];
		array[top] = tmp;
	}
	return array;
}

GenerateDotColumn = function () {
	var dots = "";

	var x = 0;
	var y = 0;
	while (y < columnHeight) {
		while (x < wordColumnWidth) {
			dots += "<span class='character'>.</span>";
			x++;
		}
		dots += "<br />";
		x = 0;
		y++;
	}

	return dots;
}

GenerateGarbageCharacters = function () {
	var garbage = "";

	var x = 0;
	var y = 0;
	while (y < columnHeight) {
		while (x < wordColumnWidth) {
			garbage += "<span class='character'>" + gchars[Math.floor(Math.random() * gchars.length)] + "</span>";
			x++;
		}
		//garbage += "<br />";
		x = 0;
		y++;
	}

	return garbage;
}

RandomPointer = function () {
	if (Sound)
		return "0x" + (("0000" + Math.floor(Math.random() * 35535).toString(16).toUpperCase()).substr(-4));
	else {
		var butt = (("0000" + Math.floor(Math.random() * 35535).toString(16).toUpperCase()));
		return "0x" + butt.slice(butt.length - 4, butt.length);
	}
}

// Add this function to properly process the wordlist
function getWords(length, count) {
	console.log("Fetching words...");
	$.ajax({
		url: 'wordlist.php',
		method: 'GET',
		data: {
			length: length,
			count: count
		},
		dataType: 'json',
		success: function (response) {
			console.log("Response received:", response);
			if (response && response.words) {
				Words = response.words;
				Correct = Words[Math.floor(Math.random() * Words.length)];
				console.log("Words loaded:", Words);
				DisplayScreen();
			} else if (response.error) {
				console.error("Server error:", response.error);
			}
		},
		error: function (xhr, status, error) {
			console.error("AJAX Error:", {
				status: status,
				error: error,
				response: xhr.responseText
			});
		}
	});
}

// Make sure this runs when the page loads
$(document).ready(function () {
	console.log("Page loaded, initializing...");
	getWords(7, 12); // Default values
});

// Add this near your other chat functions
async function sendVeraMessage(message) {
    try {
        console.log("Sending message to Vera:", message);
        const response = await fetch('/vera-chat.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: message })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Vera response:", data);
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        return data.response || "I encountered an error processing that request.";
    } catch (error) {
        console.error("Error sending message to Vera:", error);
        return "I encountered an error processing that request.";
    }
}

// Add this for debugging
window.testVera = async () => {
    const response = await sendVeraMessage("Hello, who are you?");
    console.log("Test response:", response);
};

