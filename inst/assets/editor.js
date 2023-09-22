var editor = ace.edit("input", {
    mode: "ace/mode/r",
    selectionStyle: "text",
    maxLines: 10,
    minLines: 1,
    autoScrollEditorIntoView: true,
    showLineNumbers: false,
    showGutter: false, // ??
});
// editor.setTheme("ace/theme/monokai");
editor.session.setUseSoftTabs(true);
editor.session.setTabSize(4);
editor.commands.addCommand({
    name: 'eval',
    bindKey: {win: 'Ctrl-Enter',  mac: 'Command-Enter'},
    // bindKey: {win: 'Enter',  mac: 'Enter'},
    exec: function(editor) { 
	connectAndRun(processConsoleInput);
	// if Enter, need to change several
	// things, like insert newline if incomplete, and
	// preferably no matching parens / braces
    },
    readOnly: false, // false if this command should not apply in readOnly mode
});
editor.commands.addCommand({
    name: 'complete',
    bindKey: {win: 'Tab',  mac: 'Tab'},
    exec: function(editor) { 
	connectAndRun(completeConsoleInput);
	// With TAB, need to think about indentation as well
    },
    readOnly: false, // false if this command should not apply in readOnly mode
});

