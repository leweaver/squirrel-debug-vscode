/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/

'use strict';

import * as vscode from 'vscode';
import { WorkspaceFolder, DebugConfiguration, ProviderResult, CancellationToken } from 'vscode';
import { SdbClientSession } from './sdbClientSession';
import { FileAccessor } from './sdbRuntime';
import { getConfiguration, setConfiguration } from './utils';

export function activateSdbClient(context: vscode.ExtensionContext, factory?: vscode.DebugAdapterDescriptorFactory) {
    let startDebugCommandHandler = (resource: vscode.Uri, stopFirstLine: boolean) => {
        let targetResource = resource;
        if (!targetResource && vscode.window.activeTextEditor) {
            targetResource = vscode.window.activeTextEditor.document.uri;
        }
        if (targetResource) {
            vscode.debug.startDebugging(undefined, {
                type: 'squirrel',
                name: 'Debug File (Stop on first line)',
                request: 'launch',
                hostnamePort: "localhost:8000",
                program: `"${getConfiguration('runtime_path')}" -p 8000 ${stopFirstLine?"-s ":""}-f "${targetResource.fsPath}"`
            });
        }
    };
    context.subscriptions.push(
        vscode.commands.registerCommand('extension.squirrel-debug.debugEditorContents', (resource: vscode.Uri) => {
            startDebugCommandHandler(resource, false);
        }),
        vscode.commands.registerCommand('extension.squirrel-debug.debugStoppedEditorContents', (resource: vscode.Uri) => {
            startDebugCommandHandler(resource, true);
        }),
        vscode.commands.registerCommand('extension.squirrel-debug.toggleFormatting', (variable) => {
            const ds = vscode.debug.activeDebugSession;
            if (ds) {
                ds.customRequest('toggleFormatting');
            }
        })
    );

    context.subscriptions.push(vscode.commands.registerCommand('extension.squirrel-debug.getHostnamePort', config => {
        return vscode.window.showInputBox({
            placeHolder: "Please enter the hostname and port of the application hosting SDB",
            value: "localhost:8000"
        });
    }));

    context.subscriptions.push(vscode.commands.registerCommand('extension.squirrel-debug.getSdbRuntime', config => {
        let fsPath = getConfiguration('runtime_path');
        if (fsPath) {
            return fsPath;
        }
        
        return vscode.window.showOpenDialog({
                "title": "Select Squirrel Debuggable Executable",
                "canSelectMany": false,
                "filters": {
                    "executable": ['exe', 'bat', 'cmd', 'sh'], 
                    "other": ['*']
                }
        }).then(fileArr => {
            if (fileArr?.length !== 1) {
                return Promise.reject('No file selected');
            }
            let fsPath = fileArr[0].fsPath;
            setConfiguration('runtime_path', fsPath);
            return Promise.resolve(fsPath);
        });
    }));

    // register a configuration provider for current open 'squirrel' file debug type
    const provider = new SdbConfigurationProvider();
    context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider('squirrel', provider));

    // register a dynamic configuration provider for 'squirrel' debug type
    context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider('squirrel', {
        provideDebugConfigurations(folder: WorkspaceFolder | undefined): ProviderResult<DebugConfiguration[]> {
            return [
                {
                    name: "Dynamic Launch",
                    request: "launch",
                    type: "squirrel",
                    hostnamePort: "localhost:8000",
                    program: '"${command:SdbRuntime}" -p 8000 -s -f ${file}"'
                }
            ];
        }
    }, vscode.DebugConfigurationProviderTriggerKind.Dynamic));

    if (!factory) {
        factory = new InlineDebugAdapterFactory();
    }
    context.subscriptions.push(vscode.debug.registerDebugAdapterDescriptorFactory('squirrel', factory));
    if ('dispose' in factory) {
        context.subscriptions.push(factory);
    }

    // override VS Code's default implementation of the debug hover
    context.subscriptions.push(vscode.languages.registerEvaluatableExpressionProvider('squirrel', {
        provideEvaluatableExpression(document: vscode.TextDocument, position: vscode.Position): vscode.ProviderResult<vscode.EvaluatableExpression> {
            const wordRange = document.getWordRangeAtPosition(position);
            return wordRange ? new vscode.EvaluatableExpression(wordRange) : undefined;
        }
    }));

    // override VS Code's default implementation of the "inline values" feature"
    context.subscriptions.push(vscode.languages.registerInlineValuesProvider('squirrel', {

        provideInlineValues(document: vscode.TextDocument, viewport: vscode.Range, context: vscode.InlineValueContext) : vscode.ProviderResult<vscode.InlineValue[]> {

            const allValues: vscode.InlineValue[] = [];

            for (let l = viewport.start.line; l <= context.stoppedLocation.end.line; l++) {
                const line = document.lineAt(l);
                var regExp = /local_[ifso]/ig;	// match variables of the form local_i, local_f, Local_i, LOCAL_S...
                do {
                    var m = regExp.exec(line.text);
                    if (m) {
                        const varName = m[0];
                        const varRange = new vscode.Range(l, m.index, l, m.index + varName.length);

                        // some literal text
                        //allValues.push(new vscode.InlineValueText(varRange, `${varName}: ${viewport.start.line}`));

                        // value found via variable lookup
                        allValues.push(new vscode.InlineValueVariableLookup(varRange, varName, false));

                        // value determined via expression evaluation
                        //allValues.push(new vscode.InlineValueEvaluatableExpression(varRange, varName));
                    }
                } while (m);
            }

            return allValues;
        }
    }));
}

class SdbConfigurationProvider implements vscode.DebugConfigurationProvider {

	/**
	 * Massage a debug configuration just before a debug session is being launched,
	 * e.g. add all missing attributes to the debug configuration.
	 */
	resolveDebugConfiguration(folder: WorkspaceFolder | undefined, config: DebugConfiguration, token?: CancellationToken): ProviderResult<DebugConfiguration> {

		// if launch.json is missing or empty
		if (!config.type && !config.request && !config.name) {
			const editor = vscode.window.activeTextEditor;
			if (editor && editor.document.languageId === 'squirrel') {
                config.type = "squirrel";
                config.name = "Launch";
                config.request = "launch";
                config.hostnamePort = "localhost:8000";
                config.program = '"${command:SdbRuntime}" -p 8000 -s -f ${file}"';
			}
		}

		return config;
	}
}

export const workspaceFileAccessor: FileAccessor = {
    async readFile(path: string) {
        try {
            const uri = vscode.Uri.file(path);
            const bytes = await vscode.workspace.fs.readFile(uri);
            const contents = Buffer.from(bytes).toString('utf8');
            return contents;
        } catch(e) {
            try {
                const uri = vscode.Uri.parse(path);
                const bytes = await vscode.workspace.fs.readFile(uri);
                const contents = Buffer.from(bytes).toString('utf8');
                return contents;
            } catch (e) {
                return `cannot read '${path}'`;
            }
        }
    }
};

class InlineDebugAdapterFactory implements vscode.DebugAdapterDescriptorFactory {

    createDebugAdapterDescriptor(_session: vscode.DebugSession): ProviderResult<vscode.DebugAdapterDescriptor> {
        return new vscode.DebugAdapterInlineImplementation(new SdbClientSession(workspaceFileAccessor));
    }
}
