var sa_control = (function() {

var service = {
  "Rear Line-In": false,
  "Front Line-In": false,
  "Amplifier": false,
  "Rear Line-Out": false
};


$(document).on("sa-control", function(event, data) {
	if (data.header == "serviceSettings") {
		if (data.content.service["Amplifier"]) {
			service["Amplifier"] = true;
			$("#amplifier-enabled-toggle").addClass("on");
		} else if(data.content.service["Amplifier"] === null) {
			service["Amplifier"] = null;
			$("#amplifier-enabled-toggle").addClass("disabled");
			$("#amplifier-enabled-toggle").removeClass("on");
			$("#amplifier-text").text("Roomplayer without amplifier found.");
                } else if (!data.content.service["Amplifier"]) {
                        service["Amplifier"] = false;
                        $("#amplifier-enabled-toggle").removeClass("on");
		}
		
		if (data.content.service["Front Line-In"]) {
                        service["Front Line-In"] = true;
                        $("#front-in-enabled-toggle").addClass("on");
			$("#rear-in-enabled-toggle").removeClass("on");
                } else if (!data.content.service["Front Line-In"]) {
                        service["Front Line-In"] = false;
                        $("#front-in-enabled-toggle").removeClass("on");
                }

		if (data.content.service["Rear Line-In"]) {
                        service["Rear Line-In"] = true;
                        $("#rear-in-enabled-toggle").addClass("on");
			$("#front-in-enabled-toggle").removeClass("on");
                } else if (!data.content.service["Rear Line-In"]) {
                        service["Rear Line-In"] = false;
                        $("#rear-in-enabled-toggle").removeClass("on");
                }

		if (data.content.service["Rear Line-Out"]) {
                        service["Rear Line-Out"] = true;
                        $("#rear-out-enabled-toggle").addClass("on");
		} else if(data.content.service["Rear Line-Out"] === null) {
                        service["Rear Line-Out"] = null;
                        $("#rear-out-enabled-toggle").addClass("disabled");
                        $("#rear-out-enabled-toggle").removeClass("on");
                        $("#rear-out-text").text("Headphone attached, Rear Line-Out disabled.");
                } else if (!data.content.service["Rear Line-Out"]) {
                        service["Rear Line-Out"] = false;
                        $("#rear-out-enabled-toggle").removeClass("on");
                }

		
		beo.notify(false, "sa-control");
	}
});


function toggleService(prop) {
	service[prop] = !service[prop];
        
        if (service[prop]) {
		beo.notify({title: "Turning " + prop + " on...", icon: "attention", timeout: false, id: "sa-control"});
	} else {
		beo.notify({title: "Turning " + prop + " off...", icon: "attention", timeout: false, id: "sa-control"});
	}
	beo.send({target: "sa-control", header: "serviceSettings", content: {service: service}});
}


return {
	toggleService: toggleService
};

})();
