# jsrepl

A REPL for R that works in a browser, communicating with R using
Javascript via the Rserve package.

One modification is needed in the `inst/Rserv.conf` file before
installing.  After installing the package, try

```r
jsrepl::start_repl()
```

from a terminal.


# Bugs / missing features

* The `console.input enable` flag works for `readLines()`, `debug()`,
  etc., but not `readline()`.

  
* Output without newlines are not actually sent immediately, unless
  `flush.console()` is called explicitly.

```r
for (i in 1:5) { 
    Sys.sleep(0.5)
    cat("=")
    ## flush.console()
}
```

* Progress bars created using `txtProgressBar()` work

* Not surprisingly, terminal escape sequences don't work. To get output 
  that _contains_ escape sequences (without the desirable effect), try setting 
  `options(cli.ansi = TRUE, cli.num_colors" = 256)`, and then try to 
  print a tibble. One way to deal with this could be to recognize escape codes 
  and start <span class='...'> tags, and hope we will always get matching closing
  tags. Another, probably better, option is to use a HTML terminal emulator
  like <https://xtermjs.org/>

* `run.Rserve()` currently starts a new session for every new
  connection, e.g., if we reload the web page. It would be nice to
  have the _option_ of having a common / single session that all
  clients will connect to.
  
* HTML help does not work out of the box. Can be made to work by setting 
  suitable port options, and making sure the R httpd server does _not_ 
  start on its own.

* Default pager is not useful (unless we handle stdout OOB messages
  specially); probably could just set `options(pager)` to write to
  file / show / unlink.



# Blocking issues

There are three somewhat separate issues.

## Persistence of connection

Should two users connecting to Rserve get the same session (with same
state in terms of global environment, packages, etc.) or different
sessions?

Both scenarios have their uses. Rserve thinks that a new session is
"better", and does that on Linux / Mac, but not on Windows because of
OS limitations. As far as I can tell, there is no way to get
persistence on Linux / Mac. Note that just disabling fork/vfork
detection in configure is not enough (FIXME Is there supposed to be a
way that does not work?)

Status check:

* Linux: not persistent by default, no way to change

* Mac: not persistent by default, no way to change

* Windows: TODO

## Printing messages while evaluating

It is relatively easy to have R evaluate a command and print the
return value. It is less easy to handle user interaction _while_ a
command is being evaluated.

This is the main selling point of Rserve over simpler alternatives
like `httpuv` (along with security, but that's not really our concern
because we expect to run locally). Rserve achieves this using
[out-of-band](https://en.wikipedia.org/wiki/Out-of-band_data)
messages. As a test case, consider:

```r
for (i in 1:5) { 
    Sys.sleep(1)
    cat("Step: ", i, fill = TRUE)
}
```

[There is an issue described above with `flush.console()` when
messages don't have a newline, which has an impact on the next issue,
but that's more of an R-side problem.]

Unfortunately, while this works on Linux and Mac, it does not work on
Windows. This is a major deal-breaker.

Status check:

* Linux: Works

* Mac: Works

* Windows: TODO


## Prompts and input

Out-Of-Band communication during evaluation can be in both
directions. This is analogous to modal dialogs in a GUI. The most
important use-case is debugging, but for a simple example, consider

```r
menu(c("A", "B"))
```

There are two parts of this: showing a prompt, and accepting input
that gets send back to R. We consider these separately.

### Prompts

This mostly works if OOB messaging works, but the prompt (`Selection:
`) does not get printed. This is really probably related to lack of
newlines, but none of these show up on Mac:

```r
readline(prompt = "What is your favorite color? ")
readline(prompt = "What is your favorite color?\n ")
```

Compare this with the following, which works as well as can be expected.

```r
readline.fc <- function(prompt) {
    cat(prompt)
    flush.console()
    readline("")
}
readline.fc(prompt = "What is your favorite color? ")
```

In other words, it's really a sub-issue of the previous issue, but
nonetheless, it's something that needs to be fixed if this is to
become usable.

Status check:

* Linux: Prompts do not get shown

* Mac: Prompts do not get shown

* Windows: TODO


### Inputs

The more important feature is the ability to accept user input during
this kind of interaction and send the response to R for further
processing. As with OOB messages, this works on Linux / Mac but not on
Windows.

Status check:

* Linux: Input is accepted and sent to R for processing

* Mac: Input is accepted and sent to R for processing

* Windows: TODO


