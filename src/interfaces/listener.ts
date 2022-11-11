export interface Listener<T> {
  next: (value: T) => void;
  error?: (err: unknown) => void;
  complete?: () => void;
}

export interface FullListener<T> extends Listener<T> {
  error: (err: unknown) => void;
  complete: () => void;
}
