
## Useful options and settings

pager <- function(files, header = "", title = "R Information", delete.file = FALSE) {
    header <- rep(header, length.out = length(files))
    out <- tempfile(fileext = ".html")
    writeText <- function(s, append = TRUE) cat(s, file = out, sep = "\n", append = append) 
    writeText(sprintf("<html><head><title>%s</title></head>\n<body>", title), append = FALSE)
    writeText(sprintf("\n<h1>%s</h1>", title))
    for (i in seq_along(files)) {
        writeText(sprintf("\n<h2>%s</h2>", header[[i]]))
        writeText("\n<pre>")
        writeText(readLines(files[i]))
        writeText("</pre>\n")
    }
    writeText("\n</body>\n")
    ## on.exit(unlink(out))
    browseURL(out)
}

## Need to find a way to set these on startup
