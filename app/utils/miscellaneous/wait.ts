/**
 *
 * @param time The amount of time in milliseconds to wait
 */

export async function wait(time: number) {
  await new Promise((resolve) => setTimeout(resolve, time));
}
