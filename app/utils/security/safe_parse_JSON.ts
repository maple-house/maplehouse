function replacer(_key: string, value: unknown) {
  if (typeof value === "bigint") {
    return { __type: "bigint", value: value.toString() };
  }
  return value;
}

function reviver(_key: string, value: any) {
  if (value && typeof value === "object" && value.__type === "bigint") {
    return BigInt(value.value);
  }
  return value;
}



export function JSONParser<T = unknown>(value: string): T | undefined {
  try {
    return JSON.parse(value, reviver) as T;
  } catch {
    return undefined;
  }
}

export function JSONSerializer<T = unknown>(value : T) : string | undefined {
  try {
    return JSON.stringify(value,replacer);
  } catch {
    return undefined
  }
}

