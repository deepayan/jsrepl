# jsrepl

A REPL for R that works in a browser, communicating with R using
Javascript via the Rserve package.


# Bugs / missing features

* The `console.input enable` flag works for `readLines()`, `debug()`,
  etc., but not `readline()`.

  
* Output without newlines are not actually sent immediately, unless
  `flush.console()` is called explicitly (not sure if even this works
  in Linux).

```r
for (i in 1:5) { 
    Sys.sleep(0.5)
    cat("=")
    ## flush.console()
}
```

* Progress bars created using `txtProgressBar()` work

* Not surprisingly, terminal escape sequences don't work.

* `run.Rserve()` currently starts a new session for every new
  connection, e.g., if we reload the web page. It would be nice to
  have the _option_ of having a common / single session that all
  clients will connect to.
  
* HTML help does not work out of the box.

* Default pager is not useful (unless we handle stdout OOB messages
  specially); probably could just set `options(pager)` to write to
  file / show / unlink.

