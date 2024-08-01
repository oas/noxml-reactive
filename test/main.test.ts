import {describe, assert, it} from 'vitest';
import {Parser} from "noxml/dist/index";
import * as Y from "yjs";
import {Root} from "./entities";
import {updateEntity, convertToY} from "./functions";

const parser = new Parser();

describe('end to end tests', () => {
	it('parsing simple example, checking the correct order', async () => {
		const before =
			'<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
			'<xml>\n' +
			'\t<foo>1</foo>\n' +
			'\t<bar>2</bar>\n' +
			'\t<foo bool="true">3</foo>\n' +
			'</xml>';
		let json = await parser.parse(before);

		const document = new Y.Doc();

		const reactive = document.getMap("reactive");
		const undo = new Y.UndoManager(reactive, {captureTimeout: 0, trackedOrigins: new Set(["jonas"])});

		const models = reactive.set("models", new Y.Map()) as Y.Map<unknown>;

		const model = convertToY(json["xml"]) as Y.Map<unknown>;
		models.set("model-1", model);
		console.info("model before change:", JSON.stringify(model.toJSON()));


		const entity = new Root(model);
		entity.deserialize();
		console.info("foos[0].value before change:", entity.foos[0].value);

		/*
		// Die Änderung kann entweder von außen oder direkt von innen erfolgen. Das hier geht also auch:
		await updateEntity(entity, async () => {
			entity.foos[0].raw.set("#", "4");
			return "changed foos[0].value to 4";
		});
		 */
		await updateEntity(entity.foos[0], async () => {
			entity.foos[0].raw.set("#", "4");
			return "changed foos[0].value to 4";
		});
		console.info("model after change:", JSON.stringify(model.toJSON()));
		console.info("foos[0].value after change:", entity.foos[0].value);
		assert.strictEqual(entity.foos[0].value, "4");


		// Die Synchronisierung mit encodeStateAsUpdate übermittelt die gesamte Struktur.
		// TODO: Eventuell könnte man auf dem Server die Unterschiede berechnen und nur die Änderungen übermitteln (mit encodeStateVector).
		const vector = Y.encodeStateAsUpdate(document);
		console.info("vector:", vector);
		// Da es sich um ein Uint8Array handelt, gibt seine Länge an, wie viele Bytes es enthält.
		console.info("vector size in bytes:", vector.length);

		// Wir simulieren hier den Empfang der Änderungen auf einem anderen Client.
		{
			const remoteDocument = new Y.Doc();
			Y.applyUpdate(remoteDocument, vector);

			const remoteReactive = remoteDocument.getMap("reactive");
			const remoteModels = remoteReactive.get("models") as Y.Map<unknown>;
			const remoteModel = remoteModels.get("model-1") as Y.Map<unknown>;
			console.info("remote model:", JSON.stringify(remoteModel.toJSON()));

			const remoteEntity = new Root(remoteModel);
			remoteEntity.deserialize();
			console.info("remote foos[0].value:", remoteEntity.foos[0].value);
			assert.strictEqual(remoteEntity.foos[0].value, "4");
		}

		// Wir simulieren hier das Rückgängigmachen der Änderungen auf dem Client.
		{
			undo.undo();
			// Das deserialize() ist notwendig, damit die Änderungen auch in den Feldern übernommen werden.
			entity.deserialize();

			console.info("model after undo:", JSON.stringify(model.toJSON()));
			console.info("foos[0].value after undo:", entity.foos[0].value);
			assert.strictEqual(entity.foos[0].value, "1");
		}

		{
			undo.redo();
			entity.deserialize();

			console.info("model after redo:", JSON.stringify(model.toJSON()));
			console.info("foos[0].value after redo:", entity.foos[0].value);
			assert.strictEqual(entity.foos[0].value, "4");
		}
	});
});
