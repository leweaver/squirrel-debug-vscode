# VS Code Squirrel Debugger
This extension is designed to connect to a [Squirrel DeBugger](https://github.com/leweaver/squirrel-debug-server) (SDB) running in a C++ process. This extension does not contain any syntax highlighting or language service features. For that, you will need to install one of the other existing extensions.

To quickly 'try it out', you can [download a pre-built sample application](https://github.com/leweaver/squirrel-debug-server/releases/) that runs Quirrel scripts with a started SDB instance.

To make proper use of SDB in your use case, you will want embed SDB into the application in which you have embedded squirrel.

# Instructions for use with Sample Binary
1. Install this extension
1. [Download latest sample binary](https://github.com/leweaver/squirrel-debug-server/releases/), then place in a convenient location.
1. In your VSCode workspace, create/open the `.vscode/settings.json` file.
1. Set the `"sdb_config.runtime_path"` field to the absolute path of your downloaded sample binary. Eg, `"C:\\vscode-quirrel-debugger\\sample_app.exe"`
1. Open any squirrel file in your VSCode Workspace
1. Press F5, or select the `Run`/`Start Debugging` menu.

If you encounter issues, you can take a look in the `Squirrel Debug (SDB)` channel of the Output panel for information. 

# Supported Debugger Features
- Attach to already-running process containing SDB via TCP (IP/Port)
- Debug current file by launching a specified process containing SDB
- Pause, resume, terminate, stepping in/out/over
- Inspection of local variables at all levels of the stack
- Inspection of global variables
- Hierarchical inspection of Table, Array and Instance variables
- ::print(), ::error() redirection from application to VSCode console
- Multiple VS code debuggers concurrently connected to a single SDB instance.

# Unsupported Debugger Features
## High-Pri TODO list. Aiming for next version
- Improved output of variables in inspector
- Variable hover support
- Watch window
- Modification of variable values (int and string only?)
- Provide option to set current working directory prior to launching process for 'Debug Open File' mode

## Lower priority. Want for completeness
- Multiple VM's in C++ client
- Conditional breakpoints, Hitcount breakpoints, Logging breakpoints
- Squirrel Unicode Builds
- MacOS / Linux support

## Unlikely to be supported Functionality
- VS Code 'Browser' mode debugging
- Immediate mode code execution