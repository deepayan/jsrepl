

setupConnection = function() {
    
    ws = Rserve.create({
	host: 'ws://localhost:8012',

	on_connect: function() {
	    // the capability passed on connect is in `this.ocap`
	    fcap = this.ocap;
	    logmessage("Connected!");
	    setStatusMessage("[Ready]");

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

	// The response to an oobMessage is sent back to the client by
	// calling the continuation 'cont' provided by it, where the
	// continutation has the standard form function(error,
	// result).  We never raise an error. We simply ask the user
	// for a response, and call cont(null, response) once it is
	// available.

	on_oob_message: function(msg, cont) {
            msg = msg.value.json();
	    processOOBMSG(msg, cont);
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
