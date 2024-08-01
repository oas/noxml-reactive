import * as Y from "yjs";

export class GenericElement {
	// @ts-ignore
	raw: Y.Map<any>;

	constructor(parent: any, raw: Y.Map<any>) {
		this.raw = raw;
	}

	public deserialize() {
	}
}

export class Foo extends GenericElement {
	// @ts-ignore
	value: string;
	// @ts-ignore
	bool: boolean | undefined;

	constructor(parent: any, raw: Y.Map<any>) {
		super(parent, raw);
	}

	deserialize() {
		super.deserialize();

		this.value = this.raw.get('#');
		this.bool = (this.raw.get("_") as Y.Map<any>)?.get("bool");
	}
}

export class Bar extends GenericElement {
	// @ts-ignore
	value: string;

	constructor(parent: any, raw: Y.Map<any>) {
		super(parent, raw);
	}

	deserialize() {
		super.deserialize();

		this.value = this.raw.get('#');
	}
}

export class Root extends GenericElement {
	// @ts-ignore
	foos: Foo[];
	// @ts-ignore
	bars: Bar[];

	constructor(raw: Y.Map<any>) {
		super(null, raw);
	}

	deserialize() {
		super.deserialize();

		this.foos = (this.raw.get("foo") as Y.Array<any>).map((foo: any) => {
			const f = new Foo(this, foo);
			f.deserialize();
			return f;
		});

		this.bars = (this.raw.get("bar") as Y.Array<any>).map((bar: any) => {
			const b = new Bar(this, bar);
			b.deserialize();
			return b;
		});
	}
}
