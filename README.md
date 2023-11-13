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



