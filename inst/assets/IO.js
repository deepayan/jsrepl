
var lastSubmission = '';
var lastInputBlock = null;
var lastOutputBlock = null;

logmessage = function(s) {
    document.getElementById("logmessages").innerHTML += s;
}
  
clearmessages = function(s) {
    document.getElementById("logmessages").innerHTML = '<h3>Messages</h3>';
}

// COMMAND HISTORY

// This is fairly simple to handle at the javascript level, but
// eventually we may prefer to do it in R if we want R sessions to be
// persistent (i.e., connect to same R session from multiple browser
// sessions, or when the browser page is reloaded).

// NOTE: keeping track of edits is tricky --- what happens if you go
// up, change something, and then go further back up. Does the change
// persist, or revert? readline is actually quite complicated --- it
// saves the edits until the (edited) command is actually executed,
// and at that point reverts the old command to the original. Any
// unexecuted but edited old command remains edited.

// For now, we will just forget any edits as soon as we go up or down
// (but that must eventually change)

var cmdHistory = [];
var unsubmittedCmd = '';
var historyIndex = -1; // -1 is new, 0, ..., cmdHistory.length previous (in reverse order)

function resetHistory() {
    historyIndex = -1;
}

addtohistory = function(s) {
    cmdHistory[cmdHistory.length] = s;
    // should trim when list becomes too long
    resetHistory();
}

ShowPreviousCmd = function() {
    // If no more history left, don't do anything. if historyIndex ==
    // -1 (currently editing new command), save current as
    // unsubmittedCmd, then show previous command and change
    // historyIndex. Otherwise show previous command and update
    // historyIndex.

    let nhistory = cmdHistory.length; // could be zero
    // any history left? Yes unless we are currently at nhistory - 1
    if (historyIndex == nhistory - 1) return;
    if (historyIndex == -1) unsubmittedCmd = editor.getValue();
    historyIndex++;
    editor.session.setValue('');
    editor.insert(cmdHistory[nhistory - 1 - historyIndex]);
}

ShowNextCmd = function() {
    // if historyIndex == -1 (currently editing new command), do
    // nothing.  If historyIndex == 0 (no more history left) update
    // historyIndex and show unsubmitted.  Otherwise show next command
    // and update historyIndex.

    let nhistory = cmdHistory.length;
    // any history left? Yes unless we are currently at nhistory - 1
    if (historyIndex == -1) return;
    editor.session.setValue('');
    historyIndex--;
    if (historyIndex == -1) {
	editor.insert(unsubmittedCmd);
    }
    else {
	editor.insert(cmdHistory[nhistory - 1 - historyIndex]);
    }
}


// DONE HISTORY


// TODO once we actually have a script editor
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
    else if (stream == "console.msg") {
	s = '<span class="r-message"><em>' + s + '</em></span>'
    }
    else if (stream == "stdout") {
	s = '<div class="r-stdout">' + s + '</div>'
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
    if (s === null) s =
	"[Ready]" + " [ Submit: <code>Ctrl+Enter</code> ]" +
	" [ History: <code>Ctrl+Up | Down</code> ]" +
	" [ Complete: <code>TAB</code> ]";
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
    setStatusMessage(null);
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
    setStatusMessage(null);
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
    else if (stream == "stdout") {
	// default pager - usually multiple lines 
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


