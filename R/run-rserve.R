

validateInput <- function(text) {
    tryCatch({ parse(text = text, srcfile = FALSE); return('') },
             error = function(e) {
                 m <- paste(conditionMessage(e), collapse = "\n")
                 m
             })
}

## just eval, and let errors be handled by Rserve OOB messages
evalInput <- function(text) {
    ok <- validateInput(text)
    if (nzchar(ok))
        return(sprintf("Unexpected error in parsing: %s", ok))
    exprList <- parse(text = text, srcfile = NULL)
###        out <- capture.output(
    withAutoprint(exprList, evaluated = TRUE, local = FALSE, echo = FALSE)
###        )
    NULL
}

## return modified input to replace current text --- or be more
## subtle? Should also look at how ACE might help.
completeInput <- function(text, cursorPosition = nchar(text))
{
    ## do very basic for now, and assume text is a single string 
    comps <- utils:::.win32consoleCompletion(text, cursorPosition)
    ## if comps$addition != "" just add that and return
    if (nzchar(comps$addition)) return(paste0(text, comps$addition))
    ## else, somehow communicate (to be shown as feedback) - either
    ## that there is no valid completion, or that there are several
    ## (and list them)
    text # return unmodified
}


wrap <- function(js) {
    if (!inherits(js, "javascript_function"))
        stop("Reference is not a JavaScript function")
    function(...) Rserve::self.oobMessage(list(js, ...))
}


oc.init <- function() ocap(auth)



## 'capabilities' to be exposed in Javascript:

## TODO
## - completion

auth <- function(user, pass) {
    ## How can we authorize?
    ## if (user == "foo" && pass == "bar") something
    ## else "sorry, unauthorized!"
    list(validateInput = ocap(validateInput),
         evalInput = ocap(evalInput),
         completeInput = ocap(completeInput))
}



### This will run Rserve on the default port: 6311, ending with 

## -- running Rserve in this R session (pid=****), 1 server(s) --
## (This session will block until Rserve is shut down)

run_rserve <- function()
{

    ## See https://github.com/s-u/Rserve/wiki/rserve.conf for options

    run.Rserve(qap = FALSE,
               ## qap.oc = TRUE, 
               websockets.qap.oc = TRUE,
               websockets.qap = TRUE, websockets.port = 8012,
               keep.alive = TRUE, oob.idle.interval = 1,
               
               oob = TRUE,
               console.oob = TRUE,
               forward.stdio = TRUE,
               console.input = TRUE)

}



start_repl <- function()
{
    browseURL(system.file("template.html", package = "jsrepl"))
    run_rserve()
}

