/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import { Node } from 'EmmetNode';
import { getNode, parseDocument, validate } from './util';

export function mergeLines() {
	let editor = vscode.window.activeTextEditor;
	if (!validate(false)) {
		return;
	}

	let rootNode = parseDocument(editor.document);
	if (!rootNode) {
		return;
	}

	return editor.edit(editBuilder => {
		editor.selections.reverse().forEach(selection => {
			let [rangeToReplace, textToReplaceWith] = getRangesToReplace(editor.document, selection, rootNode);
			if (rangeToReplace && textToReplaceWith) {
				editBuilder.replace(rangeToReplace, textToReplaceWith);
			}
		});
	});
}

function getRangesToReplace(document: vscode.TextDocument, selection: vscode.Selection, rootNode: Node): [vscode.Range, string] {
	let startNodeToUpdate: Node;
	let endNodeToUpdate: Node;

	if (selection.isEmpty) {
		startNodeToUpdate = endNodeToUpdate = getNode(rootNode, selection.start);
	} else {
		startNodeToUpdate = getNode(rootNode, selection.start, true);
		endNodeToUpdate = getNode(rootNode, selection.end, true);
	}

	if (!startNodeToUpdate || !endNodeToUpdate) {
		return [null, null];
	}

	let rangeToReplace = new vscode.Range(startNodeToUpdate.start, endNodeToUpdate.end);
	let textToReplaceWith = document.lineAt(startNodeToUpdate.start.line).text.substr(startNodeToUpdate.start.character);
	for (let i = startNodeToUpdate.start.line + 1; i <= endNodeToUpdate.end.line; i++) {
		textToReplaceWith += document.lineAt(i).text.trim();
	}

	return [rangeToReplace, textToReplaceWith];
}