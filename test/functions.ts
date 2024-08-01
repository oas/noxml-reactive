import {GenericElement} from "./entities";
import * as Y from "yjs";

export async function updateEntity(entity: GenericElement, lambda: () => Promise<string>) {
	const message = await new Promise<string>(resolve => {
		entity.raw.doc!.transact(async () => {
			const message = await lambda();
			resolve(message);
		}, "jonas");
	})

	entity.deserialize();

	console.info("updated entity:", message);
}

export function convertToY(json: any): Y.AbstractType<any> | string | number {
	if (Array.isArray(json)) {
		const array = new Y.Array();
		for (const element of json) {
			// Is the element a complex value (object or array)?
			if (typeof element === "object") {
				// If it is, we need to convert it recursively.
				array.push([convertToY(element)]);
			}
			else {
				array.push([element]);
			}
		}
		return array;
	}

	if (typeof json === "object") {
		const map = new Y.Map();
		for (const key in json) {
			const element = json[key];
			if (typeof element === "object") {
				map.set(key, convertToY(element));
			}
			else {
				map.set(key, element);
			}
		}
		return map;
	}

	return json;
}
