var sa_update = (function() {

var updateAvailable = false;
var changingText = ""
$(document).on("sa-update", function(event, data) {
	if (data.header == "updateSettings") {
		
		if (data.content.updateAvailable) {
			updateAvailable = true;
			$("#update-available").removeClass("hidden");
			$("#update-button").removeClass("hidden");
			$("#no-update").addClass("hidden");
			$("#check-update-button").addClass("hidden");
			$("#update-text").addClass("hidden");
                        $("#changing-update-text").addClass("hidden"); 
			$("#update-version").removeClass("hidden");

			$("#update-version").text("Version: " + data.content.version);		
		} else if (!data.content.updateAvailable) {
			updateAvailable = false;
			$("#no-update").removeClass("hidden");
			$("#update-available").addClass("hidden");
    			$("#update-button").addClass("hidden");
			$("#check-update-button").removeClass("hidden");
			$("#update-text").addClass("hidden");
			$("#update-version").addClass("hidden");
                        $("#changing-update-text").addClass("hidden");
			console.log("Update available:", updateAvailable);
		}

		if (data.content.updating) {
			$("#update-available").addClass("hidden");
                        $("#update-button").addClass("hidden");
                        $("#no-update").addClass("hidden");
                        $("#check-update-button").addClass("hidden");
			$("#update-text").removeClass("hidden");
                        $("#changing-update-text").removeClass("hidden");
			$("#update-version").addClass("hidden");
			if(data.content.stdout) {
				console.log("Updating: " + data.content.stdout);
				changingText += data.content.stdout + "<br>";
				$("#changing-update-text").html(changingText);
			}
		} else if (!data.content.updating) {
			changingText = "";
                        $("#changing-update-text").html(changingText);	
		}
	
		beo.notify(false, "sa-update");
	}
});

function checkUpdate() {
	beo.notify({title: "Checking for update...", icon: "attention", timeout: false, id: "sa-update"});
	setTimeout(function(){
    		beo.send({target: "sa-update", header: "checkUpdate", content: {}});
	}, 2000);
}

function runUpdate() {
	beo.notify({title: "Starting upgrade...", icon: "attention", timeout: false, id: "sa-update"});
	beo.send({target: "sa-update", header: "runUpdate", content: {}});
}

return {
	updateAvailable: updateAvailable,
	checkUpdate: checkUpdate,
	runUpdate: runUpdate
};

})();
