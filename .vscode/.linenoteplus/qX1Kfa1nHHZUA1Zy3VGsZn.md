Note: 

Note UUIDs like `/path/to/note` are allowed.

This means the note path will be something like:

`${projectRoot}/.vscode/.linenoteplus/path/to/note.md``

To extract the UUID, we strip the `noteDir` and
the `.md` from the note path.

We do this instead of `path.basename` because
that implementation will return `note`
instead of `/path/to/note`.