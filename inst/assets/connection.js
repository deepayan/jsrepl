

setupConnection = function() {
    
    ws = Rserve.create({
	host: 'ws://localhost:8012',

	on_connect: function() {
	    // the capability passed on connect is in `this.ocap`
	    fcap = this.ocap;
	    logmessage("Connected!");

	    var cont = function(err, res) {
		if (err) logmessage("R error! Initialization failed: " + err);
		else f = res;
	    }
	    // FIXME: how do I pass arguments, e.g., to authenticate?
	    fcap(cont);
	},

	on_data: function(msg) { // OOB send callback - one-way messages from R to Javascript
            msg = msg.value.json();
	    processOOBSEND(msg);
	},

	// oobMessage are handled by the function provided in
	// on_oob_message of the from function(data, continutation)
	// where the continutation has the standard form
	// function(error, result)

	on_oob_message: function(msg, k) {
            msg = msg.value.json();
            console.log("OOB MSG: " + msg);
            k(null, "foobar");
	}
	
    });

}

// reconnect if ws.closed === true
connectAndRun = function(fun) {
    if (ws.closed === false) {
	fun();
    }
    else {
	setupConnection();
	setTimeout(connectAndRun, 100, fun);
    }

}
