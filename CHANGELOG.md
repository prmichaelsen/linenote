# Change Log

## [3.0.0]

Complete refactor. Major notes:
* looks for `.linenoteplus` file to determine your
  note directory
* allows any valid file path as a note marker
  and note will be created at that path
* link a note to an existing source file
  by entering that files relative path.
* rewrite caching
* factor out commands, etc