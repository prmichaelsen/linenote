# Change Log

## [3.0.0]

Complete refactor. Major notes:
* Looks for `.linenoteplus` file to determine your
  note directory
* Allows any valid file path as a note marker
  and note will be created at that path
* Link a note to an existing source file
  by entering that file's relative path.
* Rewrite caching
* Factor out commands, etc

## [3.0.1]
* Line Note Plus debug output channel no 
  longer shows automatically to reduce noise.

## [3.0.2]
* Fix up clean up initialization never firing