# How to build

1. download and install (yarn)[https://yarnpkg.com/] on your system
1. git clone git@github.com:leweaver/squirrel-debug-vscode.git
1. change directory to the cloned repository
1. on the command line, run `yarn`
1. load visual studio code, then:
  - `file->open folder` with the repository folder 
  - On the 'Run and debug' tab, select **"Extension + Server (squirrel-debug-vscode)"**

The extension should now build, and launch a new VSCode window that contains the built version of the extension.

# Making a new release
See: https://code.visualstudio.com/api/working-with-extensions/publishing-extension

Note: using `vsce publish minor` command is one option. The alternative is to manually edit the package.json file and increment the "version" field prior to running `vsce package`, then upload to https://marketplace.visualstudio.com/manage/

npm install -g vsce
vsce package