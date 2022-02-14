# 0.2.1
- Just updated the README slightly.

# 0.2.0
- Improved output of variables in inspector
- Variable hover support
- Watch window
- 'File Open' to select squirrel executable
- Some better error messages when launching a process
- Logging applications stderr to the SDB output window

# 0.1.0
Initial relase. Supported:

- Attach to already-running process containing SDB via TCP (IP/Port)
- Debug current file by launching a specified process containing SDB
- Pause, resume, terminate, stepping in/out/over
- Inspection of local variables at all levels of the stack
- Inspection of global variables
- Hierarchical inspection of Table, Array and Instance variables
- ::print(), ::error() redirection from application to VSCode console
- Multiple VS code debuggers concurrently connected to a single SDB instance.