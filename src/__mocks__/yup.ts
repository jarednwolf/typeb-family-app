// Minimal yup mock for unit tests that only need validate() success/failure
type Shape = Record<string, any>;

class MockSchema<T = any> {
  private _shape: Shape;
  private _type: string;
  constructor(type: string, shape: Shape = {}) { this._type = type; this._shape = shape; }
  shape(_s: Shape) { return this; }
  required() { return this; }
  length() { return this; }
  matches() { return this; }
  email() { return this; }
  min() { return this; }
  max() { return this; }
  oneOf() { return this; }
  nullable() { return this; }
  default() { return this; }
  when() { return this; }
  test() { return this; }
  of() { return this; }
  validate(data: any, _opts?: any): Promise<T> { return Promise.resolve(data as T); }
}

const string = () => new MockSchema('string');
const number = () => new MockSchema('number');
const boolean = () => new MockSchema('boolean');
const date = () => new MockSchema('date');
const array = () => new MockSchema('array');
const object = (shape: Shape = {}) => new MockSchema('object', shape);

// Support .when on object by returning self
// Already handled in MockSchema.when()

class ValidationError extends Error { inner: any[] = []; path?: string; constructor(message: string) { super(message); this.name = 'ValidationError'; } }

export { string, number, boolean, date, array, object, ValidationError };
export default { string, number, boolean, date, array, object, ValidationError };

// Minimal ref implementation for conditional schemas
export const ref = (_path: string) => ({ __isRef: true, path: _path });

