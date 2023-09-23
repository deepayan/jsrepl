
var lastSubmission = '';
var lastInputBlock = null;
var lastOutputBlock = null;

var cmdHistory = [];

logmessage = function(s) {
    document.getElementById("logmessages").innerHTML += s;
}

clearmessages = function(s) {
    document.getElementById("logmessages").innerHTML = '<h3>Messages</h3>';
}

addtohistory = function(s) {
    cmdHistory[cmdHistory.length] = s;
    // should trim when list becomes too long
}


addtoScriptEditor = function(s) {
    logmessage("<br>" + s);
}


addInput = function(s) {
    // This should create a new div if lastInputBlock=null (which
    // will happen initially, and also when, e.g., an output div is
    // created). Otherwise it should add to the existing lastInputBlock.
    s = s.replace(/&/g, "&amp;").replace(/\</g, "&lt;").replace(/\</g, "&gt;");

    var rconsoleDiv = document.getElementById("rconsole");
    if (lastInputBlock === null)
	inDiv = document.createElement("pre");
    else
	inDiv = lastInputBlock;
    inCode = document.createElement("code"); // TODO: syntax highlight via prism
    if (input_pending)
	inCode.classList.add("language-plaintext"); // FIXME
    else
	inCode.classList.add("language-R");
    inCode.innerHTML = s;
    inDiv.appendChild(inCode);
    Prism.highlightElement(inCode);
    rconsoleDiv.appendChild(inDiv);
    // save current inDiv for re-use next time if appropriate
    lastInputBlock = inDiv;
    lastOutputBlock = null;
}



addOutput = function(s, stream) {
    // This should create a new div if lastOutputBlock=null (which
    // will happen initially, and also when, e.g., an input div is
    // created). Otherwise it should add to the existing lastOutputBlock.
    // FIXME: add argument to control whether to sanitize HTML?
    s = s.replace(/&/g, "&amp;").replace(/\</g, "&lt;");

    if (stream == "console.err") {
	s = '<span class="r-error"><strong>' + s + '</strong></span>'
    }
    if (stream == "console.msg") {
	s = '<span class="r-message"><em>' + s + '</em></span>'
    }
 
    var rconsoleDiv = document.getElementById("rconsole");
    if (lastOutputBlock === null) {
    	lastOutputBlock = document.createElement("pre");
	lastOutputBlock.className = "outchunk";
	lastOutputBlock.innerHTML = s;
	rconsoleDiv.appendChild(lastOutputBlock);
    }
    else {
	lastOutputBlock.innerHTML += s;
    }
}


// With Rserve and ocap we take the following approach:

// We have access to f which is a 'list' of two capabilities,
// f.validateInput() and f.evalInput(). How we use these depend on
// what code is evaluated (console or script editor).

// When code is submitted to R from the console, we want to (a)
// validate to see if the input can be parsed. If yes (result=''),
// then delete the content from the console editor, print it in a
// 'code input' block, and send it to f.evalInput(). Let's try this
// first.


setStatusMessage = function(s) {
    document.getElementById("statusbuffer").innerHTML = s;
}



// continuation to handle f.evalInput()
var econt = function(err, res)
{
    if (err) {
	logmessage("<p>R error [econt]</p>");
	console.log(err)
    }
    editor.session.setValue(''); // be ready again
    setStatusMessage('[READY]');
    document.getElementById("controls").scrollIntoView(false);
}


// continuation to handle f.validateInput(); rename to evalIfValid()

var vcont = function(err, res)
{
    if (err) logmessage("<p>R error [vcont]: " + err + "</p>");
    else {
	if (res == '') {
	    addtoScriptEditor(lastSubmission);
	    addtohistory(lastSubmission);
	    addInput(lastSubmission);
	    setStatusMessage('[Waiting...]');
	    editor.session.setValue('');
	    f.evalInput(lastSubmission, econt);
	}
	else {
	    logmessage("<p>Validation error: <code>" + res + "</code></p>");
	    // don't do anything else
	}
    }
}

processConsoleInput = function() {
    // clearmessages();
    lastSubmission = editor.getValue();
    // if a OOB message response is pending, treat as
    // response. Otherwise do standard validation and evaluation.
    if (input_pending) {
	setStatusMessage("[Waiting]");
	addInput(lastSubmission);
	input_pending = false;
	editor.session.setValue('');
	document.getElementById("controls").scrollIntoView(false);
	input_cont(null, lastSubmission);
    }
    else f.validateInput(lastSubmission, vcont);
}


// continuation to handle f.completeInput();

var completeIfAvailable = function(err, res)
{
    if (err) logmessage("<p>R error [completeIfAvailable]: " + err + "</p>");
    else {
	if (res !== '') {
	    editor.insert(res);
	}
    }
}

completeConsoleInput = function() {
    // clearmessages();
    setStatusMessage("[Ready]");
    lastSubmission = editor.getValue();
    f.getCompletions(lastSubmission,
		     editor.getCursorPosition().column,
		     completeIfAvailable);
}


processOOBSEND = function(msg) {
    var stream = msg[0];
    var payload = msg[1];
    // FIXME switch to switch
    if (stream == "console.out") {
	lastInputBlock = null;
	addOutput(payload, stream);
    }
    else if (stream == "console.err") {
	lastInputBlock = null;
	addOutput(payload, stream);
    }
    else if (stream == "console.reset") {
	// nothing to do
    }
    else if (stream == "console.msg") {
	lastInputBlock = null;
	addOutput(payload, stream);
    }
    else if (stream == "possible.completions") {
	setStatusMessage("<code>" + payload + "</code>")
    }
    else
	logmessage("<br>OOB SEND [ " + stream + " ]: <code>" + payload + "</code>");
    
    // "console.out": regular output
    // "console.err": error output
    // "console.reset": console was re-set (no payload)
    // "console.msg": message output

    return;
}

var input_pending = false;
var input_cont = null;

// We can ask the user for a response, but we won't get it
// immediately. So we pass along the continuation, and call it when
// the user submits a response, with the assumption that the
// continuation (which had been provided by the caller) knows what to
// do with it.

processOOBMSG = function(msg, cont) {
    let stream = msg[0];
    let payload = msg[1];
    if (stream != "console.in") {
	logmessage("<br>[UNKNOWN stream] OOB MSG [ " + stream + " ]:")
	logmessage("<pre>" + payload + "</pre>");
	cont("Unknown stream " + stream, null);
    }
    else {
	logmessage("<br>OOB MSG:" + stream);
	input_pending = true;
	input_cont = cont;
	setStatusMessage("[Waiting for input]");
    }
}


// automatic highlight disabled using 'data-manual' attribute below
// window.Prism = window.Prism || {};
// Prism.manual = true;


