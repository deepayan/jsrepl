
var lastSubmission = '';
var lastInputBlock = null;
var lastOutputBlock = null;

var cmdHistory = [];

logmessage = function(s) {
    document.getElementById("logmessages").innerHTML += '<p>' + s + '</p>';
}

clearmessages = function(s) {
    document.getElementById("logmessages").innerHTML = '<h3>Messages</h3>';
}

addtohistory = function(s) {
    cmdHistory[cmdHistory.length] = s;
    // should trim when list becomes too long
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



// continuation to handle f.evalInput()
var econt = function(err, res)
{
    if (err) {
	logmessage("R error [econt]");
	console.log(err)
    }
    editor.session.setValue(''); // be ready again
}


// continuation to handle f.validateInput(); rename to evalIfValid()

var vcont = function(err, res)
{
    if (err) logmessage("R error [vcont]: " + err);
    else {
	if (res == '') {
	    logmessage("[OK] Executing: <code>" + lastSubmission + "</code>");
	    editor.session.setValue('[WAITING]');
	    addInput(lastSubmission);
	    addtohistory(lastSubmission);
	    f.evalInput(lastSubmission, econt);
	}
	else {
	    logmessage("Validation error: <code>" + res + "</code>");
	    // don't do anything else
	}
    }
}

processConsoleInput = function() {
    clearmessages();
    lastSubmission = editor.getValue();
    f.validateInput(lastSubmission, vcont);
}


processOOBSEND = function(msg) {
    var stream = msg[0];
    var payload = msg[1];
    logmessage("OOB SEND [ " + stream + " ]: <pre>" + payload + "</pre>");
    // var rconsoleDiv = document.getElementById("rconsole");
    if (stream == "console.out") {
	lastInputBlock = null;
	addOutput(payload, stream);
    }
    if (stream == "console.err") {
	lastInputBlock = null;
	addOutput(payload, stream);
    }
    if (stream == "console.reset") {
	// nothing to do
    }
    if (stream == "console.msg") {
	lastInputBlock = null;
	addOutput(payload, stream);
    }
    
    // "console.out": regular output
    // "console.err": error output
    // "console.reset": console was re-set (no payload)
    // "console.msg": message output

    return;
}





      
// automatic highlight disabled using 'data-manual' attribute below
// window.Prism = window.Prism || {};
// Prism.manual = true;


